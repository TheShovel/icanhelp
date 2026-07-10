# Linux Process Management

## Viewing Processes
```
ps aux                    — all processes (BSD style)
ps -ef                    — all processes (standard)
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem — custom format, sort by memory
ps -u user                — processes for user
ps -p PID                 — specific process
ps -L PID                 — threads of process
top                       — interactive process viewer
htop                      — enhanced top (if installed)
btop                      — modern top with graphs
atop                      — system + process history
pgrep -a <name>           — find PIDs by name
pidof <name>              — PID of program
lsof                      — list open files
lsof -i :8080             — process using port 8080
lsof -p PID               — open files by PID
fuser -v /path            — processes using file/dir
```

## Process Signals
```
kill -TERM PID            — graceful terminate
kill -KILL PID            — force kill (unblockable)
kill -INT PID             — interrupt (like Ctrl+C)
kill -HUP PID             — reload config
kill -STOP PID            — suspend (like Ctrl+Z)
kill -CONT PID            — continue suspended
kill -USR1 / -USR2 PID    — custom signals
killall <name>            — kill all by name
pkill -f <pattern>        — kill by regex pattern
pkill -9 -u user          — force kill all user processes
```
Signal numbers: HUP=1, INT=2, QUIT=3, KILL=9, TERM=15, STOP=19, CONT=18

## Process Priority (Nice)
```
nice -n -5 cmd            — run with priority -5 (higher)
renice -n -5 -p PID       — change priority of running process
chrt -f 50 cmd            — real-time FIFO priority 50
chrt -r 99 cmd            — real-time round-robin priority 99
ionice -c 2 -n 0 cmd     — I/O priority (best-effort, high)
```
Nice range: -20 (highest priority) to 19 (lowest)
Default: 0. Only root can set negative nice values.

## Resource Limits (ulimit)
```
ulimit -a                 — show all limits
ulimit -n 65536           — max open files
ulimit -u 100             — max user processes
ulimit -c unlimited       — core dump size
```
Persistent: set in `/etc/security/limits.conf` or systemd unit `LimitNOFILE=`.

## cgroups (Control Groups)
```
systemd-cgls                      — cgroup tree
systemd-cgtop                     — cgroup resource usage
systemd-run --user --scope -p MemoryMax=500M cmd
cgcreate -g cpu,memory:/mygroup
cgset -r cpu.max="50000 100000" /mygroup
cgexec -g cpu,memory:/mygroup cmd
```
cgroup v2 mounted at `/sys/fs/cgroup/`

## Process States
- `R` — running or runnable
- `S` — sleeping (interruptible)
- `D` — uninterruptible sleep (I/O wait)
- `Z` — zombie (terminated, parent hasn't reaped)
- `T` — stopped (by signal)
- `t` — stopped by debugger
- `X` — dead

## /proc/[pid]/
- `status` — process state, memory, credentials
- `cmdline` — command with args (\0 separated)
- `environ` — environment variables
- `cwd` — symlink to current working directory
- `exe` — symlink to executable
- `fd/` — directory of open file descriptors
- `fdinfo/` — file descriptor flags/positions
- `maps` — memory mappings
- `smaps` — detailed memory usage per mapping
- `limits` — resource limits
- `sched` — scheduling stats
- `net/` — network info (tcp, udp, unix sockets)
- `io` — I/O statistics

## Zombie Processes
Zombies (state Z) are already dead but not reaped:
```
ps aux | grep 'Z'            — find zombies
kill -SIGCHLD $(pidof parent)  — sometimes reaps them
```
Cannot kill zombies with SIGKILL. If parent is broken, restart parent process.

## Systemd Service Management
```
systemctl status <unit>        — full status + recent logs
systemctl show <unit>          — all properties as key=value
systemctl list-dependencies <unit> — dependency tree
systemctl kill -s KILL <unit>  — send signal to all processes in unit
```
See also: `knowledge/linux/systemd.md`

## Out-of-Memory (OOM)
```
# oom_score 0-1000: higher = more likely to be killed
cat /proc/PID/oom_score
cat /proc/PID/oom_score_adj  # -1000 (never OOM) to 1000 (always)

# systemd-oomd (Fedora 32+, Ubuntu 24+)
systemctl status systemd-oomd

# earlyoom (lightweight OOM killer)
earlyoom -m 5 -s 10    # kill when mem < 5% or swap < 10%
```

## Background & Detached
```
setsid cmd                — run in new session (no SIGHUP on logout)
tmux new -s session       — create tmux session
tmux attach -t session    — reattach
screen -S session         — create screen session
screen -r session         — reattach
```
