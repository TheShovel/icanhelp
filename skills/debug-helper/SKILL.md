---
name: debug-helper
description: Systematic debugging assistance for any kind of software or system problem. Use when the user reports an error, unexpected behavior, crash, or performance issue. Helps isolate root causes and find fixes.
---

# Debug Helper

Debug systematically. Don't jump to conclusions — gather evidence, form hypotheses, test them.

## Debugging Process

### 1. Understand the Symptom
- What exactly is happening vs what should happen?
- When did it start? Was there a recent change?
- Is it reproducible? How often?
- Does it happen in a specific environment or context?

### 2. Gather Evidence
- Look at error messages and logs (check `~/.cache/icanhelp/` for app logs)
- Check system logs: `journalctl -xe`, `dmesg`, `~/.xsession-errors`
- Ask for reproduction steps and screenshots
- Use `run_bash` to inspect processes, file permissions, disk space, memory
- Use `search_knowledge` to look up error patterns

### 3. Isolate the Cause
- Narrow down: is it the code, the environment, the configuration, or the input?
- Try minimal reproduction: strip away complexity until the problem appears
- Binary search: disable halves of the system to find the culprit
- Check recent changes: `git --no-pager log --oneline -10`, `git --no-pager diff`

### 4. Fix and Verify
- Apply the minimal fix needed
- Verify the fix works (ask the user to test, or run the relevant command)
- Ensure the fix doesn't break anything else

## Common Problem Categories

| Symptom | Likely Causes | Check |
|---------|--------------|-------|
| App crashes on launch | Missing model file, corrupt config, Node.js version mismatch | `~/.cache/icanhelp/` exists? Model downloaded? |
| No response from LLM | Model not loaded, context size exceeded, GPU OOM | Check model path, reduce context size, check GPU memory |
| Vision not working | Missing transformer cache, ONNX runtime error | Check `~/.cache/icanhelp/transformers/`, vision.log |
| Web search fails | Network down, worker API changed | Check internet, try `curl` to test connectivity |
| Theme not applying | IPC error, renderer not ready, CSS variable mismatch | Check console in DevTools, verify variable names |
| Electron window issues | Wayland/X11 display issues, GPU acceleration, screen bounds | Check `$XDG_SESSION_TYPE`, try `--disable-gpu` |
| Bash tool fails | Permission denied, command not found, timeout | Check command exists, needs sudo, or output truncated |
| Sudo/confirmation loop | Tool call not properly acknowledged, IPC stuck | Check main.js pendingSudo/pendingConfirm state |

## General Tips
- **Use the knowledge base** — search for error messages and troubleshooting guides
- **Use the web** — search for error codes and known issues
- **Check file permissions** — the app uses `~/.cache/icanhelp/` and `~/.config/icanhelp/`
- **Look at recent changes** — check `git --no-pager diff` or `git --no-pager log`
- **Test incrementally** — change one thing at a time
