# Unix Signals & Exit Codes

## Common Signals
- `SIGHUP` (1) — hangup; often reload config (daemons)
- `SIGINT` (2) — interrupt from terminal (Ctrl+C)
- `SIGQUIT` (3) — quit + core dump (Ctrl+\)
- `SIGKILL` (9) — force kill, cannot be caught or ignored
- `SIGTERM` (15) — graceful termination (default for `kill`)
- `SIGSTOP` (19/17/23) — pause process, cannot be caught
- `SIGCONT` (18/19/25) — resume stopped process
- `SIGUSR1` (10) / `SIGUSR2` (12) — user-defined
- `SIGPIPE` (13) — write to closed pipe
- `SIGCHLD` (17/20/18) — child process state changed

## Sending signals
```
kill -TERM 1234          — graceful stop (PID 1234)
kill -9 1234             — force kill
kill -HUP 1234           — reload config
pkill -f nginx           — by process name
killall -u bob           — all of user's processes
```
Always prefer `SIGTERM` before `SIGKILL`; `SIGKILL` can corrupt state.

## Exit Codes (shell `$?`)
- `0` — success
- `1` — general/catch-all error
- `2` — misuse of shell builtin/syntax
- `126` — command found but not executable
- `127` — command not found
- `128+N` — killed by signal N (e.g., 130 = SIGINT/Ctrl+C, 137 = SIGKILL)
- `130` — terminated by Ctrl+C
- `137` — OOM kill or `kill -9` (128+9)
- `143` — `SIGTERM` (128+15)

## Trap signals in scripts
```
trap 'cleanup' EXIT INT TERM    — run cleanup on exit/interrupt
trap 'echo interrupted' INT
trap - INT                      — remove handler
```
Use `trap` for temp-file cleanup and graceful shutdown.

## systemd signal handling
- `ExecReload=` typically sends `SIGHUP`
- `TimeoutStopSec=` controls graceful shutdown window before `SIGKILL`
- `KillSignal=SIGTERM` default; set `SIGQUIT` for core dumps
