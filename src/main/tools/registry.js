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
];

var handlers = {
  search_web: searchWeb,
  run_bash: runBash,
  read_file: readFile,
  write_file: writeFile,
  list_directory: listDirectory,
  ocr_image: ocrImage,
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
