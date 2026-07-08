const { runBash } = require("./bash");
const { readFile, writeFile, listDirectory } = require("./fs");
const { ocrImage } = require("../ocr");

async function searchWeb({ query, resultSize }) {
  try {
    var res = await fetch(
      "https://raspy-lab-e617.niccata24.workers.dev/?q=" +
        encodeURIComponent(query) +
        "&limit=" +
        (resultSize || 5),
    );
    var data = await res.json();
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return "Search failed: " + e.message;
  }
}

async function setTheme({ properties, name }) {
  if (!properties || typeof properties !== "object") {
    return JSON.stringify({ error: "properties object required" });
  }
  var count = 0;
  for (var key in properties) {
    if (properties.hasOwnProperty(key)) count++;
  }
  var result = { ok: true, changed: count };
  if (name) result.saved = name;
  return JSON.stringify(result);
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
      description: "Read the contents of a file from the filesystem.",
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
      name: "write_file",
      description:
        "Write content to a file. Creates parent directories if needed. Overwrites existing files.",
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
      name: "set_theme",
      description:
        'Change the app\'s CSS theme. Pass a properties object of CSS variables (--bg-panel, --bg-body, --bg-header, --bg-input, --fg, --fg-dim, --fg-muted, --accent, --border, --user-bubble-bg, --user-bubble-fg). You can use any CSS value: solid colors, gradients, images (url()), shadows, fonts, etc. Example: { "--bg-panel": "linear-gradient(135deg, #1e1e2e, #313244)" } or { "--bg-body": "url(https://example.com/bg.png)" }. Optionally pass a name to save the theme.',
      parameters: {
        type: "object",
        properties: {
          properties: {
            type: "object",
            description: "CSS variable/value pairs",
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
];

var handlers = {
  search_web: searchWeb,
  run_bash: runBash,
  read_file: readFile,
  write_file: writeFile,
  list_directory: listDirectory,
  ocr_image: ocrImage,
  set_theme: setTheme,
  list_themes: listThemesStub,
  delete_theme: deleteThemeStub,
  apply_theme: applyThemeStub,
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

module.exports = { tools, executeToolCall };
