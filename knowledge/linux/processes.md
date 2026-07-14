# Linux Process Management

> **For the AI:** When the user asks about running processes, CPU/memory per process, or "what's running", RUN the relevant command via `run_bash` (e.g. `sys perf top` or `ps ...`) and report the OUTPUT. Do NOT reply with a command list or snippet for the user to run.

## Viewing Processes
```bash
ps aux                          # all processes (BSD style)
ps -ef                          # all processes (standard)
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem   # custom format, sort by memory
ps -u user                      # processes for a user
ps -p PID                       # specific process
ps -L PID                       # threads of a process
pgrep -a name                   # find PIDs by name
pidof name                      # PID of a program
lsof -i :8080                   # process using port 8080
lsof -p PID                     # open files by PID
fuser -v /path                  # processes using a file/dir
```
Interactive viewers: `top`, `htop`, `btop`, `atop` (install as needed).

## Process Signals
```bash
kill -TERM PID    # graceful terminate
kill -KILL PID    # force kill (unblockable)
kill -INT PID     # interrupt (like Ctrl+C)
kill -HUP PID     # reload config
kill -STOP PID    # suspend (like Ctrl+Z)
kill -CONT PID    # continue suspended
killall name      # kill all by name
pkill -f pattern  # kill by regex pattern
pkill -9 -u user  # force kill all of a user's processes
```
Signal numbers: HUP=1, INT=2, QUIT=3, KILL=9, TERM=15, STOP=19, CONT=18.
See also: `signals-exit-codes.md`.

## Process Priority (Nice)
```bash
nice -n -5 cmd     # run with priority -5 (higher); only root for negative
renice -n -5 -p PID   # change priority of a running process
ionice -c 2 -n 0 cmd  # I/O priority (best-effort, high)
```
Nice range: -20 (highest) to 19 (lowest). Default: 0.

## Resource Limits (ulimit)
```bash
ulimit -a          # show all limits
ulimit -n 65536    # max open files
ulimit -u 100      # max user processes
ulimit -c unlimited  # core dump size
```
Persistent: `/etc/security/limits.conf` or systemd `LimitNOFILE=`.

## cgroups (Control Groups)
```bash
systemd-cgls                          # cgroup tree
systemd-cgtop                         # cgroup resource usage
systemd-run --user --scope -p MemoryMax=500M cmd
```
cgroup v2 mounted at `/sys/fs/cgroup/`.

## Process States
- `R` — running/runnable
- `S` — sleeping (interruptible)
- `D` — uninterruptible sleep (I/O wait)
- `Z` — zombie (terminated, parent hasn't reaped)
- `T` — stopped (by signal)

## /proc/[pid]/
- `status` — state, memory, credentials
- `cmdline` — command with args (\0 separated)
- `environ` — environment variables
- `cwd` — symlink to working directory
- `exe` — symlink to executable
- `fd/` — open file descriptors
- `smaps` — detailed memory per mapping
- `limits` — resource limits
- `io` — I/O statistics

## Zombie Processes
Zombies (state Z) are dead but not reaped:
```bash
ps aux | awk '$8 ~ /Z/'   # find zombies
kill -SIGCHLD $(pidof parent)  # sometimes reaps them
```
Cannot kill zombies with SIGKILL. If the parent is broken, restart the parent.

## Systemd Service Management
```bash
sys svc status <unit>       # full status + recent logs
systemctl show <unit>       # all properties as key=value
systemctl list-dependencies <unit>   # dependency tree
systemctl kill -s KILL <unit> # signal all processes in a unit
```
See also: `systemd.md`.

## Out-of-Memory (OOM)
```bash
cat /proc/PID/oom_score          # 0-1000, higher = more likely killed
cat /proc/PID/oom_score_adj      # -1000 (never) to 1000 (always)
sys svc status systemd-oomd      # user-space OOM daemon
```

## Background & Detached
```bash
setsid cmd            # new session (no SIGHUP on logout)
tmux new -s session   # create tmux session
tmux attach -t session
screen -S session     # create screen session
screen -r session
```
