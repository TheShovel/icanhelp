const { runBash } = require("./bash");
const { readFile, readFileLines, writeFile, listDirectory } = require("./fs");
const { ocrImage } = require("../ocr");
const {
  addKnowledge,
  searchKnowledge,
  listKnowledge,
  clearKnowledge,
} = require("../rag");
const { findSkills, getSkillInstructions, getAllSkills } = require("../skills");

async function searchWeb({ query, resultSize }) {
  try {
    var res = await fetch(
      "https://raspy-lab-e617.niccata24.workers.dev/?q=" +
        encodeURIComponent(query) +
        "&limit=" +
        (resultSize || 5),
    );
    var data = await res.json();
    var results = Array.isArray(data)
      ? data
      : data.items || data.results || data.data || [];
    var trimmed = results.slice(0, resultSize || 5).map(function (r) {
      return {
        title: (r.title || "").slice(0, 120),
        url: r.url || r.link || "",
        snippet: (r.snippet || r.text || r.description || r.body || "").slice(
          0,
          200,
        ),
      };
    });
    return JSON.stringify(trimmed);
  } catch (e) {
    return "Search failed: " + e.message;
  }
}

async function setTheme({ properties, name }) {
  if (!properties || typeof properties !== "object") {
    return (
      "The 'properties' argument must be a JSON object with CSS variable names mapping to hex colors. " +
      "Available variables: --bg-panel, --bg-header, --bg-body, --bg-input, --bg-code, --bg-tool, " +
      "--border, --border-strong, --fg, --fg-dim, --fg-muted, --accent, --accent-hover, " +
      "--user-bubble-bg, --user-bubble-fg, --danger. " +
      "Pick colors yourself based on what the user asked for. Example for a blue theme: " +
      '{"--bg-panel":"#1a1a2e","--accent":"#5a9cf8","--fg":"#e0e0e0"}'
    );
  }
  var keys = Object.keys(properties);
  if (keys.length === 0) {
    return (
      "No variables provided. Available variables: --bg-panel, --bg-header, --bg-body, --bg-input, --bg-code, --bg-tool, " +
      "--border, --border-strong, --fg, --fg-dim, --fg-muted, --accent, --accent-hover, " +
      "--user-bubble-bg, --user-bubble-fg, --danger. " +
      "Pick colors yourself based on what the user asked for and call set_theme again. Example: " +
      '{"--bg-panel":"#1a1a2e","--accent":"#5a9cf8","--fg":"#e0e0e0"}'
    );
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
      name: "store_knowledge",
      description:
        "Store information in the local knowledge base for later retrieval. Use this to remember facts, instructions, code snippets, or any information the user wants to keep. The knowledge is automatically chunked and embedded for semantic search.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The information to store",
          },
          metadata: {
            type: "object",
            description: "Optional metadata like source, category, or tags",
          },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description:
        "IMPORTANT: Search the local knowledge base BEFORE answering any question about Linux, programming, security, networking, or system administration. " +
        "Returns the most relevant stored entries with similarity scores (higher = more relevant). " +
        "The knowledge base covers: bash, Linux commands, filesystem, systemd, package managers (apt/dnf/pacman), " +
        "networking, permissions, desktop environments (Wayland/X11), troubleshooting, kernel, security hardening, " +
        "JavaScript, Node.js, Python, Git, Docker, SQL, web development, HTTP, and computer science fundamentals." +
        " Always call this when the user asks a factual or how-to question.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "What to search for in the knowledge base",
          },
          k: {
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
      name: "list_knowledge",
      description:
        "Get statistics about the knowledge base (total entry count and breakdown by source). " +
        "ONLY use this if the user explicitly asks for knowledge-base stats. To answer a question, " +
        "use search_knowledge(query) instead — never use this to look things up.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "clear_knowledge",
      description: "Delete all entries from the knowledge base.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_skills",
      description:
        "List all available skills and their descriptions. Use this to discover what skills are available for the current task.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "start_skill",
      description:
        "Load a skill's instructions into context. Call this when the user's request matches a skill's description. The skill provides expert guidance for completing the specific task. Returns the skill's full instructions.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "The name of the skill to load (use list_skills first to find the right one)",
          },
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
  read_file_lines: readFileLines,
  write_file: writeFile,
  list_directory: listDirectory,
  ocr_image: ocrImage,
  set_theme: setTheme,
  list_themes: listThemesStub,
  delete_theme: deleteThemeStub,
  apply_theme: applyThemeStub,
  store_knowledge: (args) => addKnowledge(args.text, args.metadata),
  search_knowledge: (args) => searchKnowledge(args.query, args.k),
  list_knowledge: async function () {
    // Return the stats but steer the model toward the actual search tool,
    // since listing entries is never useful for answering a question.
    var stats = await listKnowledge();
    return (
      stats +
      "\n\nNOTE: This only lists counts. To actually use the knowledge base, " +
      "call search_knowledge with a `query` argument (e.g. " +
      'search_knowledge({ query: "cpu usage", k: 5 })) — do NOT call ' +
      "list_knowledge to look things up."
    );
  },
  clear_knowledge: clearKnowledge,
  list_skills: function () {
    var all = getAllSkills();
    return JSON.stringify(
      all.map(function (s) {
        return { name: s.name, description: s.description, path: s.dirName };
      }),
      null,
      2,
    );
  },
  start_skill: function (args) {
    var name = args && args.name;
    if (!name)
      return "Please provide a skill name. Use list_skills to see available skills.";
    var matched = findSkills(name);
    if (matched.length === 0) {
      return (
        'Skill "' +
        name +
        '" not found. Use list_skills to see available skills.'
      );
    }
    var instructions = getSkillInstructions([matched[0].name]);
    if (!instructions) return 'Skill "' + name + '" has no instructions.';
    return (
      "--- Begin skill: " +
      matched[0].name +
      " ---\n\n" +
      instructions +
      "\n\n--- End skill: " +
      matched[0].name +
      " ---"
    );
  },
};

async function executeToolCall(toolCall, opts) {
  // Hard cap on tool calls per turn. Small local models ignore soft prompt
  // instructions and will loop tools endlessly; this guarantees a stop.
  if (toolCallCount >= MAX_TOOLS_PER_TURN) {
    return (
      "TOOL_LIMIT_REACHED: You have already used " + MAX_TOOLS_PER_TURN +
      " tools this turn. STOP calling tools now and answer the user with what " +
      "you already know. Do not call any more tools."
    );
  }
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
    toolCallCount++;
    return String(result);
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
}

// Per-turn tool budget. Reset at the start of every user turn.
var MAX_TOOLS_PER_TURN = 4;
var toolCallCount = 0;
function resetToolBudget() {
  toolCallCount = 0;
}

module.exports = { tools, executeToolCall, resetToolBudget };
