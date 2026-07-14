const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Ensure the app's bundled `bin/` (the universal `sys` CLI) is always on PATH
// when the AI runs commands, regardless of how the desktop session exported
// PATH. We resolve candidates in order and prepend every one that exists:
//   1. <app-base>/bin   — works in both the dev tree and an installed layout
//      (bash.js lives at <base>/src/main/tools/bash.js, so <base> is two dirs up)
//   2. ~/.local/bin     — where the installer symlinks `sys` for humans/AI
//   3. ~/.local/share/icanhelp/bin — alternative installed location
// Falls back gracefully if none exist.
function sysBinCandidates() {
  const candidates = [];
  try {
    const here = __dirname; // <base>/src/main/tools
    const appBase = path.resolve(here, "..", "..", "..");
    candidates.push(path.join(appBase, "bin"));
  } catch (e) { /* ignore */ }
  try {
    const home = require("os").homedir();
    candidates.push(path.join(home, ".local", "bin"));
    const dataHome =
      process.env.XDG_DATA_HOME || path.join(home, ".local", "share");
    candidates.push(path.join(dataHome, "icanhelp", "bin"));
  } catch (e) { /* ignore */ }
  // de-dupe and keep only existing dirs
  const seen = new Set();
  return candidates.filter(function (c) {
    const ok = !seen.has(c) && fs.existsSync(c);
    if (ok) seen.add(c);
    return ok;
  });
}

function withSysOnPath(env) {
  const base = env || process.env;
  const existing = base.PATH || base.Path || "";
  const parts = existing.split(path.delimiter);
  const toAdd = sysBinCandidates().filter(function (c) {
    return !parts.includes(c);
  });
  if (toAdd.length === 0) return base;
  return Object.assign({}, base, {
    PATH: toAdd.concat(parts).join(path.delimiter),
  });
}

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
      env: withSysOnPath(process.env),
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
