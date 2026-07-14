# Linux Performance Monitoring & Analysis

Live monitoring and analysis of CPU, memory, disk, and network. For profiling (perf/bpftrace) and sysctl tuning, see `performance-tuning.md`.

> **For the AI:** When the user asks about current CPU/memory/disk/network state, RUN these commands via `run_bash` and report the OUTPUT (the actual percentages/numbers) — do NOT reply with the command list or a snippet for the user to run.

## CPU
```bash
sys perf top                  # process snapshot (top -b -n1 | head)
sys perf load                 # loadavg + uptime
sys perf cpu                  # CPU model/cores/MHz (lscpu)
# Native detail (not wrapped by sys):
top -H -p PID                # threads of a process
ps -eo pid,ppid,cmd,%cpu,%mem --sort=-%cpu | head
pidstat 1                    # CPU per process (sysstat)
pidstat -u -p PID 1          # specific PID
mpstat -P ALL 1              # per-core utilization (sysstat)
vmstat 1                     # r=run queue, us/sy/id/wa/st columns
# Load > number of CPUs = saturated
```

## Memory
```bash
sys perf mem                  # RAM + swap summary (free -h)
# Native detail (not wrapped by sys):
free -h -w                   # with buffers/cache columns (tested: works)
cat /proc/meminfo            # MemTotal, MemAvailable, Buffers, Cached (tested: works)
vmstat 1                     # si/so = swap in/out
ps aux --sort=-%mem | head   # top memory consumers
numastat                    # per-NUMA-node allocation (tested: present)
```

Key `/proc/meminfo` fields: `MemAvailable` (usable incl. reclaimable cache), `Buffers` (raw block buffers), `Cached` (page cache, reclaimable), `SwapTotal`.

## Disk I/O
```bash
sys disk usage                # space per mount (df -h)
sys disk fs /path            # dir size (du -sh)
# Native detail (not wrapped by sys):
iostat -xz 1                 # per-device await, svctm, %util (sysstat; NOT installed in sandbox)
iostat -xz 1 -d sda          # specific device
iotop -o                     # processes doing I/O (requires root)
vmstat 1                     # wa column = I/O wait
df -i                        # inodes
du -sh /path/* | sort -h     # directory sizes
```

Interpretation: `await > 10ms` suggests disk latency; `%util` near 100% means saturated.

## Network
```bash
sys net listen                # listening TCP/UDP + procs (ss -tulnp)
# Native detail (not wrapped by sys):
ss -tupn                     # with process
ss -ti                       # TCP info: cwnd, rtt, retrans
ss -s                        # summary stats
netstat -s | grep -i retrans # retransmits (net-tools)
ip -s link                   # per-interface packet stats
```

## System Health
```bash
sys log errors               # errors this boot (journalctl -p err -b)
sys log boot                 # full boot log
# Native detail (not wrapped by sys):
dmesg -T | tail -20          # kernel log with timestamps (needs root in sandbox)
systemd-analyze              # total boot time
systemd-analyze blame        # per-unit boot time
```

## Quick "system is slow" checklist
```bash
sys perf load                # load
sys perf mem                 # memory
sys disk usage               # disk space
vmstat 1                     # CPU/IO/swap
sys net listen               # listening services
sys log errors               # recent errors
```
