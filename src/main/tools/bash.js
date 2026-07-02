const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const BLOCKED_PATTERNS = [
  /^\s*rm\s+-rf\s+\/\s*/,
  /^\s*mkfs/,
  /^\s*dd\s+/,
  /^\s*shutdown/,
  /^\s*reboot/,
  /^\s*init\s/,
];

function isDangerous(command) {
  return BLOCKED_PATTERNS.some((p) => p.test(command));
}

async function runBash({ command }) {
  if (isDangerous(command)) {
    var name = command.trim().split(/\s+/)[0];
    return JSON.stringify({ error: 'Command blocked for safety: ' + name });
  }

  try {
    var { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 100 * 1024,
      shell: '/bin/bash',
    });
    var output = stdout || stderr || '(no output)';
    if (output.length > 50000) output = output.slice(0, 50000) + '\n... (truncated)';
    return output;
  } catch (e) {
    return e.stderr || e.message || String(e);
  }
}

module.exports = { runBash };
