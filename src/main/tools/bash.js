const { spawn } = require("child_process");

const BLOCKED_PATTERNS = [
  /^\s*rm\s+-rf\s+\/\s*/,
  /^\s*mkfs/,
  /^\s*dd\s+/,
  /^\s*shutdown/,
  /^\s*reboot/,
  /^\s*init\s/,
];

const CONFIRM_PATTERNS = [
  /\brm\s+-rf\b/,
  /\bkill\b/,
  /\bpkill\b/,
  /\bkillall\b/,
  /\bchmod\s+777\b/,
  /\bchown\b/,
  /\bpasswd\b/,
  /\buserdel\b/,
  /\bgroupdel\b/,
  /\bwipefs\b/,
  /\bformat\b/,
  /\bmkfs\.\w+/,
];

function matchesAny(command, patterns) {
  return patterns.some(function (p) {
    return p.test(command);
  });
}

var SUDO_RE = /\bsudo\s/;

async function runBash({ command, onSudoPrompt, onConfirm, onOutput }) {
  if (matchesAny(command, BLOCKED_PATTERNS)) {
    var name = command.trim().split(/\s+/)[0];
    return "Error: Command blocked for safety: " + name;
  }

  if (matchesAny(command, CONFIRM_PATTERNS) && onConfirm) {
    var ok = await onConfirm(command);
    if (!ok) return "(cancelled by user)";
  }

  if (SUDO_RE.test(command) && onSudoPrompt) {
    var password = await onSudoPrompt();
    if (password) {
      command =
        "echo " +
        JSON.stringify(password) +
        " | sudo -S " +
        command.replace(/\bsudo\s+/, "");
    }
  }

  return new Promise(function (resolve) {
    var proc = spawn("/bin/bash", ["-c", command], {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 60000,
    });

    var stdout = "";
    var stderr = "";
    var allOutput = "";

    function checkOutput(text) {
      allOutput += text;
      if (allOutput.length > 100000) {
        resolve(allOutput.slice(0, 100000) + "\n... (output truncated)");
        proc.kill();
        return true;
      }
      return false;
    }

    proc.stdout.on("data", function (data) {
      var text = data.toString();
      stdout += text;
      if (onOutput) onOutput(text);
      if (checkOutput(text)) return;
    });

    proc.stderr.on("data", function (data) {
      var text = data.toString();
      stderr += text;
      if (onOutput) onOutput(text);
      if (checkOutput(text)) return;
    });

    proc.on("close", function () {
      var output = stdout || stderr || "(no output)";
      if (output.length > 50000)
        output = output.slice(0, 50000) + "\n... (truncated)";
      resolve(output);
    });

    proc.on("error", function (err) {
      resolve("Error: " + err.message);
    });
  });
}

module.exports = { runBash };
