const { spawn } = require('child_process');

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

var SUDO_RE = /\bsudo\s/;

async function runBash({ command, onSudoPrompt }) {
  if (isDangerous(command)) {
    var name = command.trim().split(/\s+/)[0];
    return 'Error: Command blocked for safety: ' + name;
  }

  // Proactively prompt for sudo password if sudo is in the command
  if (SUDO_RE.test(command) && onSudoPrompt) {
    var password = await onSudoPrompt();
    if (password) {
      command = 'echo ' + JSON.stringify(password) + ' | sudo -S ' + command.replace(/\bsudo\s+/, '');
    }
  }

  return new Promise(function (resolve) {
    var proc = spawn('/bin/bash', ['-c', command], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000,
    });

    var stdout = '';
    var stderr = '';
    var allOutput = '';
    var timer = setTimeout(function () {
      proc.kill();
      resolve(allOutput + '\n(Command timed out after 30s)');
    }, 30000);

    function checkOutput(text) {
      allOutput += text;
      if (allOutput.length > 100000) {
        resolve(allOutput.slice(0, 100000) + '\n... (output truncated)');
        proc.kill();
        return true;
      }
      return false;
    }

    proc.stdout.on('data', function (data) {
      var text = data.toString();
      stdout += text;
      if (checkOutput(text)) return;
    });

    proc.stderr.on('data', function (data) {
      var text = data.toString();
      stderr += text;
      if (checkOutput(text)) return;
    });

    proc.on('close', function () {
      clearTimeout(timer);
      var output = stdout || stderr || '(no output)';
      if (output.length > 50000) output = output.slice(0, 50000) + '\n... (truncated)';
      resolve(output);
    });

    proc.on('error', function (err) {
      clearTimeout(timer);
      resolve('Error: ' + err.message);
    });
  });
}

module.exports = { runBash };
