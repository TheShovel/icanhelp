const { runBash } = require("./bash");
const { readFile, readFileLines, writeFile, listDirectory } = require("./fs");
const { solveMath } = require("./math");
const { ocrImage } = require("../ocr");
const { extractWebpage } = require("./extract");
const { createDocx } = require("./docx");


async function searchWeb({ query, resultSize }) {
  try {
    var limit = resultSize || 5;
    var res = await fetch(
      "https://lite.duckduckgo.com/lite/?q=" + encodeURIComponent(query),
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    );
    var html = await res.text();

    // Detect CAPTCHA challenge page
    if (html.includes("challenge") && /[Dd]uck/i.test(html)) {
      return JSON.stringify([]);
    }

    // Extract result links
    var links = [];
    var linkRe =
      /<a rel="nofollow" href="(.*?)" class='result-link'>(.*?)<\/a>/g;
    var m;
    while ((m = linkRe.exec(html)) !== null) {
      links.push({
        href: m[1],
        title: m[2].replace(/<[^>]*>/g, "").trim(),
      });
    }

    // Extract snippets
    var snippets = [];
    var snippetRe = /<td class='result-snippet'>(.*?)<\/td>/g;
    while ((m = snippetRe.exec(html)) !== null) {
      snippets.push(m[1].replace(/<[^>]*>/g, "").trim());
    }

    // Extract display URLs
    var displayUrls = [];
    var urlRe = /<span class='link-text'>(.*?)<\/span>/g;
    while ((m = urlRe.exec(html)) !== null) {
      displayUrls.push(m[1].trim());
    }

    var results = [];
    for (var i = 0; i < links.length && i < limit; i++) {
      var href = links[i].href;
      var title = links[i].title;
      if (!title) continue;

      // Decode real URL from DuckDuckGo's redirect URL
      var url = displayUrls[i] || "";
      var uddg = href.match(/uddg=([^&]+)/);
      if (uddg) {
        try {
          url = decodeURIComponent(uddg[1]);
        } catch (_) {}
      }

      results.push({
        title: title.slice(0, 120),
        url: url,
        snippet: (snippets[i] || "").slice(0, 200),
      });
    }

    return JSON.stringify(results);
  } catch (e) {
    return "Search failed: " + e.message;
  }
}

function parseColor(str) {
  if (!str || typeof str !== "string") return null;
  str = str.trim();

  // Hex colors
  var hexMatch = str.match(/^#([0-9a-fA-F]{3,8})$/);
  if (hexMatch) {
    var h = hexMatch[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length === 4) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    if (h.length >= 6) {
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
      };
    }
  }

  // rgb() / rgba()
  var rgbMatch = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  return null;
}

function relativeLuminance(rgb) {
  function channel(c) {
    var s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

function contrastRatio(a, b) {
  var l1 = relativeLuminance(a);
  var l2 = relativeLuminance(b);
  var lighter = Math.max(l1, l2);
  var darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function setTheme({ properties, name }) {
  var VALID_VARS = [
    "--bg-panel", "--bg-header", "--bg-body", "--bg-input", "--bg-hover",
    "--bg-code", "--bg-tool", "--bg-tool-out", "--bg-overlay",
    "--bg-list-item-hover", "--bg-list-item-active",
    "--border", "--border-strong", "--border-focus",
    "--fg", "--fg-dim", "--fg-muted", "--fg-placeholder",
    "--accent", "--accent-hover", "--accent-press", "--accent-fg",
    "--user-bubble-bg", "--user-bubble-fg",
    "--thinking-fg", "--thinking-border",
    "--tool-fg", "--tool-border", "--tool-text-fg",
    "--danger", "--confirm-cmd-fg",
    "--scrollbar-thumb", "--scrollbar-thumb-list",
  ];
  var validSet = {};
  for (var vi = 0; vi < VALID_VARS.length; vi++) validSet[VALID_VARS[vi]] = true;

  if (!properties || typeof properties !== "object") {
    return (
      "Invalid: 'properties' must be a JSON object. Provide CSS variable names mapped to colors. " +
      "Example: {\"--bg-panel\":\"#1a1a2e\",\"--accent\":\"#5a9cf8\"}"
    );
  }

  var keys = Object.keys(properties);
  if (keys.length === 0) {
    return (
      "No variables provided. Pick colors and call set_theme again. " +
      "Example: {\"--bg-panel\":\"#1a1a2e\",\"--accent\":\"#5a9cf8\"}"
    );
  }

  // Validate variable names and values.
  var errors = [];
  for (var ki = 0; ki < keys.length; ki++) {
    var k = keys[ki];
    var v = properties[k];

    if (!validSet[k]) {
      errors.push("Unknown variable: '" + k + "'. Valid names: " + VALID_VARS.join(", "));
      continue;
    }

    if (typeof v !== "string" || v.length === 0) {
      errors.push("'" + k + "' value must be a CSS color string (e.g. '#1a1a2e', 'rgba(0,0,0,0.5)').");
      continue;
    }

    // Reject injection attempts.
    if (/[<>]/.test(v) || /url\s*\(/i.test(v) || /expression\s*\(/i.test(v) || /javascript\s*:/i.test(v)) {
      errors.push("'" + k + "' value contains unsafe content. Use a plain CSS color only.");
      continue;
    }

    // Validate color format: hex, rgb(), rgba(), hsl(), hsla(), or CSS named color.
    var isHex = /^#[0-9a-fA-F]{3,8}$/.test(v);
    var isFunc = /^(rgb|rgba|hsl|hsla)\s*\(/.test(v);
    var isNamed = /^[a-zA-Z]+$/.test(v) && v.length < 30;
    if (!isHex && !isFunc && !isNamed) {
      errors.push("'" + k + "': '" + v + "' is not a valid CSS color. Use hex (#1a1a2e), rgb/rgba/hsl, or a named color.");
    }
  }

  if (errors.length > 0) {
    return "Theme validation failed — fix these and call set_theme again:\n" + errors.join("\n");
  }

  // Check contrast for text-on-background pairs. Uses default theme colors
  // for any variable the user didn't set, so partial themes are validated.
  var DEFAULTS = {
    "--bg-panel": "#242424", "--bg-body": "#1e1e1e", "--bg-header": "#2d2d2d",
    "--bg-input": "#3a3a3a", "--bg-code": "#333333", "--bg-tool": "#2a2a2a",
    "--bg-tool-out": "#2a2a2a", "--bg-list-item-hover": "#333333",
    "--fg": "#e0e0e0", "--fg-dim": "#bbbbbb", "--fg-muted": "#999999",
    "--fg-placeholder": "#666666", "--accent": "#5a9cf8",
    "--accent-fg": "#ffffff", "--accent-hover": "#7ab4ff",
    "--user-bubble-bg": "#5a9cf8", "--user-bubble-fg": "#ffffff",
    "--thinking-fg": "#d4a85c", "--thinking-border": "#8b6914",
    "--tool-fg": "#66bb6a", "--tool-border": "#4a7c59",
    "--tool-text-fg": "#a5d6a7", "--danger": "#f28b82",
    "--confirm-cmd-fg": "#d4a85c", "--border": "#3a3a3a",
    "--border-strong": "#4a4a4a",
  };
  var merged = {};
  for (var dk in DEFAULTS) merged[dk] = DEFAULTS[dk];
  for (var pk in properties) merged[pk] = properties[pk];
  // User bubble bg defaults to accent if not explicitly set.
  if (!properties["--user-bubble-bg"]) merged["--user-bubble-bg"] = merged["--accent"];

  var contrastWarnings = [];
  var pairs = [
    // Body text on backgrounds
    { fg: "--fg", bg: "--bg-panel", label: "main text on panel", min: 4.5 },
    { fg: "--fg", bg: "--bg-body", label: "main text on body", min: 4.5 },
    { fg: "--fg", bg: "--bg-header", label: "main text on header", min: 4.5 },
    { fg: "--fg", bg: "--bg-input", label: "main text on input", min: 4.5 },
    { fg: "--fg", bg: "--bg-code", label: "main text on code block", min: 4.5 },
    { fg: "--fg", bg: "--bg-tool", label: "main text on tool block", min: 4.5 },
    { fg: "--fg", bg: "--bg-list-item-hover", label: "text on list hover", min: 4.5 },
    // Dim/muted text on panel
    { fg: "--fg-dim", bg: "--bg-panel", label: "dim text on panel", min: 3.0 },
    { fg: "--fg-muted", bg: "--bg-panel", label: "muted text on panel", min: 2.5 },
    { fg: "--fg-placeholder", bg: "--bg-input", label: "placeholder on input", min: 1.8 },
    // Accent button text
    { fg: "--accent-fg", bg: "--accent", label: "button text on accent", min: 2.5 },
    { fg: "--accent-fg", bg: "--accent-hover", label: "button text on accent hover", min: 2.0 },
    // User bubble
    { fg: "--user-bubble-fg", bg: "--user-bubble-bg", label: "bubble text on bubble", min: 2.5 },
    // Thinking block
    { fg: "--thinking-fg", bg: "--bg-panel", label: "thinking text on panel", min: 3.0 },
    { fg: "--thinking-fg", bg: "--bg-tool", label: "thinking text on tool", min: 3.0 },
    // Tool blocks
    { fg: "--tool-fg", bg: "--bg-tool", label: "tool label on tool bg", min: 3.0 },
    { fg: "--tool-text-fg", bg: "--bg-tool", label: "tool output on tool bg", min: 4.5 },
    { fg: "--tool-text-fg", bg: "--bg-tool-out", label: "tool output on tool-out bg", min: 4.5 },
    // Danger / confirm
    { fg: "--danger", bg: "--bg-panel", label: "danger text on panel", min: 3.0 },
    { fg: "--confirm-cmd-fg", bg: "--bg-tool", label: "confirm cmd on tool", min: 3.0 },
    // Borders should contrast with panel
    { fg: "--border", bg: "--bg-panel", label: "border on panel", min: 1.4 },
    { fg: "--border-strong", bg: "--bg-panel", label: "strong border on panel", min: 1.8 },
  ];

  for (var pi = 0; pi < pairs.length; pi++) {
    var pair = pairs[pi];
    var fgColor = merged[pair.fg];
    var bgColor = merged[pair.bg];
    if (!fgColor || !bgColor) continue;
    var fgRgb = parseColor(fgColor);
    var bgRgb = parseColor(bgColor);
    if (!fgRgb || !bgRgb) continue;
    var ratio = contrastRatio(fgRgb, bgRgb);
    if (ratio < pair.min) {
      contrastWarnings.push(
        pair.label + ": contrast ratio " + ratio.toFixed(1) +
        " (need ≥" + pair.min + "). " + pair.fg + "=" + fgColor +
        " vs " + pair.bg + "=" + bgColor + " — text will be unreadable."
      );
    }
  }

  if (contrastWarnings.length > 0) {
    return "Theme rejected — insufficient contrast. Fix these and call set_theme again:\n" + contrastWarnings.join("\n");
  }

  return (
    "Theme applied with " +
    keys.length +
    " color changes." +
    (name ? " Saved as '" + name + "'." : "")
  );
}

function listThemesStub() {
  return JSON.stringify({ themes: {} });
}
function deleteThemeStub() {
  return JSON.stringify({ ok: true });
}
function applyThemeStub() {
  return JSON.stringify({ ok: true });
}

var tools = [
  {
    type: "function",
    function: {
      name: "search_web",
      description:
        "Search the web for current information. Returns a JSON array of results with title, URL, and snippet.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
          resultSize: {
            type: "number",
            description: "Number of results to return (default 5)",
            default: 5,
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_bash",
      description:
        "Run a bash command on the Linux system. Use this to execute programs, install packages, run scripts, or get system info.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The bash command to execute",
          },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description:
        "Read the contents of a SMALL file from the filesystem. Only use this for files under ~64 KB. " +
        "For larger files (or any text file you want to read incrementally) use read_file_lines instead, " +
        "which reads a bounded range of lines so you never blow past your context limit.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute path to the file" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file_lines",
      description:
        "Read a bounded range of lines from a TEXT file (source code, logs, CSV, markdown, etc.). " +
        "Use this for large files or when you only need part of a file. It returns at most " +
        "500 lines per call and tells you how to fetch the next chunk. " +
        "IMPORTANT: only use this for text files. Do NOT use it for images or binaries " +
        "(use ocr_image for images). Line numbers are 1-based.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute path to the text file" },
          startLine: {
            type: "number",
            description: "1-based line number to start reading from (default 1)",
            default: 1,
          },
          maxLines: {
            type: "number",
            description:
              "Maximum number of lines to return. Capped at 500. Use the returned next startLine to continue.",
            default: 500,
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description:
        "Write content to a file. Creates parent directories if needed. Overwrites existing files. " +
        "If the user doesn't specify a path, write to their home directory.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute path to the file" },
          content: {
            type: "string",
            description: "Content to write to the file",
          },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_directory",
      description: "List files and directories in a folder.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Absolute path to the directory",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ocr_image",
      description:
        "Analyze an image file using local OCR and vision. Extracts both text found in the image and a visual description of the scene (objects, people, setting). Use this to understand screenshots, photos, or scanned documents.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Absolute path to the image file",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "extract_webpage",
      description:
        "Fetch and extract the main text content from a webpage URL. Use this after search_web to get the full content of a search result. " +
        "Optionally extracts and analyzes images found on the page using OCR and vision. " +
        "Returns JSON with title, extracted text, and optional image descriptions.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The full URL of the webpage to extract content from",
          },
          extractImages: {
            type: "boolean",
            description: "Whether to download and analyze images on the page (default true)",
            default: true,
          },
          maxImages: {
            type: "number",
            description: "Maximum number of images to process (default 3, max 5)",
            default: 3,
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_docx",
      description:
        "Create a Word (.docx) document from text or markdown content. " +
        "Use this when the user asks you to write a document, letter, report, or save something as a Word file. " +
        "Returns a file path and preview that the user can download.",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "The full text content for the document. Use markdown-style formatting for structure.",
          },
          filename: {
            type: "string",
            description: "Optional filename without extension (default: 'document'). Alphanumeric, spaces, hyphens, underscores only.",
          },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_theme",
      description:
        "Call this when the user asks to change the app's colors, make a theme (green, blue, dark, etc), or change how the app looks. Set CSS variables — only use these exact names:" +
        " --bg-panel (main background), --bg-header (title bar), --bg-body (chat area), --bg-input (text fields)," +
        " --bg-code (code blocks), --bg-tool (tool blocks), --border, --border-strong," +
        " --fg (main text), --fg-dim, --fg-muted, --accent (buttons/links), --accent-hover," +
        " --user-bubble-bg, --user-bubble-fg, --danger.",
      parameters: {
        type: "object",
        properties: {
          properties: {
            type: "object",
            description:
              "CSS variable/value pairs. Only use supported names listed above. Values must be hex colors (e.g. '#1a1a2e') or rgba().",
            additionalProperties: { type: "string" },
          },
          name: { type: "string", description: "Optional name to save as" },
        },
        required: ["properties"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_themes",
      description: "List saved theme names.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_theme",
      description: "Apply a saved theme by name and set it as default.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Theme name" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_theme",
      description: "Delete a saved theme.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Theme name" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "math",
      description: "Compute a math expression or solve a math problem. Call this for any arithmetic, algebra, or calculus.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "The math expression or problem to solve.",
          },
        },
        required: ["expression"],
      },
    },
  },
];

var handlers = {
  search_web: searchWeb,
  run_bash: runBash,
  read_file: readFile,
  read_file_lines: readFileLines,
  write_file: writeFile,
  list_directory: listDirectory,
  ocr_image: ocrImage,
  set_theme: setTheme,
  list_themes: listThemesStub,
  delete_theme: deleteThemeStub,
  apply_theme: applyThemeStub,
  extract_webpage: extractWebpage,
  create_docx: createDocx,
  math: (args) => solveMath(args),
};

async function executeToolCall(toolCall, opts) {
  var fn = handlers[toolCall.function.name];
  if (!fn)
    return JSON.stringify({ error: "Unknown tool: " + toolCall.function.name });
  var args = {};
  try {
    args = JSON.parse(toolCall.function.arguments);
  } catch (e) {
    return JSON.stringify({ error: "Invalid arguments: " + e.message });
  }
  if (opts) Object.assign(args, opts);
  try {
    var result = await fn(args);
    return String(result);
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
}

// Per-turn tool budget. Reset at the start of every user turn.
function resetToolBudget() {
  // No-op: hard limit removed. Soft nudges handled in buildFunctions.
}

module.exports = { tools, executeToolCall, resetToolBudget };
