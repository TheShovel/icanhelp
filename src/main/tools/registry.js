const { runBash } = require('./bash');
const { readFile, writeFile, listDirectory } = require('./fs');

var tools = [
  {
    type: 'function',
    function: {
      name: 'run_bash',
      description: 'Run a bash command on the Linux system. Use this to execute programs, install packages, run scripts, or get system info.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The bash command to execute' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file from the filesystem.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path to the file' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write content to a file. Creates parent directories if needed. Overwrites existing files.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path to the file' },
          content: { type: 'string', description: 'Content to write to the file' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_directory',
      description: 'List files and directories in a folder.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path to the directory' },
        },
        required: ['path'],
      },
    },
  },
];

var handlers = {
  run_bash: runBash,
  read_file: readFile,
  write_file: writeFile,
  list_directory: listDirectory,
};

async function executeToolCall(toolCall) {
  var fn = handlers[toolCall.function.name];
  if (!fn) return JSON.stringify({ error: 'Unknown tool: ' + toolCall.function.name });
  var args = {};
  try {
    args = JSON.parse(toolCall.function.arguments);
  } catch (e) {
    return JSON.stringify({ error: 'Invalid arguments: ' + e.message });
  }
  var result = await fn(args);
  return String(result);
}

module.exports = { tools, executeToolCall };
