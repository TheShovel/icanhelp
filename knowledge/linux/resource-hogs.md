# What Is Eating My Resources? (Diagnosing Resource Hogs)

Practical "what is using up X" playbooks. Each section answers a common user
question: *what is eating CPU / GPU / memory / disk I/O / storage / network*.
Start broad (system overview), then drill into the offending process.

## Quick triage — see everything at once
```bash
htop                 # CPU, MEM, per-process; F5 tree, F6 sort, F9 kill
btop                 # modern TUI: CPU, GPU, mem, disk, net graphs
glances              # terminal + web dashboard, all metrics
top -o %CPU          # sort by CPU (interactive: press P)
top -o %MEM          # sort by memory (interactive: press M)
```
If a metric is pegged (CPU ~100%, mem full, disk 100% util), go to that section.

## What is eating CPU?
```bash
top -o %CPU                          # live, highest CPU first
ps -eo pid,comm,%cpu --sort=-%cpu | head   # top CPU consumers
htop                                 # F6 → sort by CPU
mpstat -P ALL 1                      # per-core utilization (1s samples)
```
Deep dive into a hot process:
```bash
perf top -p PID                      # live sampling of one process
perf record -F 99 -p PID -g -- sleep 10 && perf report   # call graph
pidstat -u -p PID 1                  # per-process CPU over time
```
Common causes: runaway loop, unoptimized build, crypto miner, indexing,
thermal throttling (check `sensors` / `turbostat`).

## What is eating memory (RAM)?
```bash
free -h                              # total/used/free + swap
top -o %MEM                          # sort by memory
ps -eo pid,comm,%mem,rss --sort=-%mem | head
htop                                 # RES column = physical memory
smem -s rss -r | head                # PSS (shared mem split fairly)
```
Find leaks / big allocators:
```bash
cat /proc/PID/smaps | grep -i pss     # per-mapping detail for a PID
sudo slabtop                          # kernel memory (slab) usage
```
Common causes: memory leak, cache/buffer growth (normal — `free` counts it as
used), too many browser tabs, JVM/container without memory limit.

## What is eating the GPU?
```bash
nvidia-smi                            # GPU util, memory, processes (NVIDIA)
nvidia-smi dmon -s u                  # 1s GPU utilization samples
radeontop                            # AMD GPU live usage
intel_gpu_top                        # Intel integrated GPU
```
Per-process GPU usage:
```bash
nvidia-smi --query-compute-apps=pid,used_memory,process_name --format=csv
```
Common causes: machine-learning training, video encode/decode, browser
hardware acceleration, GPU miner, game. If GPU is hot but idle-looking, check
`nvidia-smi` process list for a stuck CUDA job.

## What is eating disk I/O?
```bash
iostat -xz 1                          # %util near 100% = saturated
iotop -o                              # processes doing I/O right now
sudo iotop -a                         # accumulated I/O per process
dstat -d                              # simple disk throughput
```
Find what is reading/writing:
```bash
sudo fatrace                          # file access trace (which process, which file)
sudo btrace /dev/sda                  # block-level I/O
sudo opensnoop                        # files opened live (bpftrace/bcc)
```
Common causes: backup/sync (rsync, Dropbox), database, log spam, swap
thrashing, defrag/scrub, malware scanning.

## What is using up storage / disk space? (on a drive)
```bash
df -h                                # space used per mount ("my drive")
df -h /home                          # space on a specific path's filesystem
du -sh /* 2>/dev/null                # size of each top-level dir (root fs)
du -sh /home/*                       # per-user usage
ncdu /                              # interactive, navigable disk usage (best tool)
```
Drill down to the biggest offender:
```bash
du -h --max-depth=1 /var 2>/dev/null | sort -h
ncdu /var                            # browse and delete interactively
```
Find large files quickly:
```bash
find / -type f -size +500M -exec ls -lh {} \; 2>/dev/null
find / -xdev -type f -size +1G -printf '%s %p\n' | sort -rn | head
```
Find space held by deleted-but-open files (df says full, du doesn't):
```bash
lsof +L1                             # deleted files still open by a process
# fix: restart the holding process, or `> /proc/PID/fd/N` to truncate
```
Common causes: log files (`/var/log`), package cache (`apt clean`,
`dnf clean`), container/images (`docker system prune`), old kernels,
snapshots (btrfs/zfs/`timeshift`), downloads, VM disk images, trash not emptied.

## What is using network bandwidth?
```bash
sudo iftop -i eth0                   # live per-host bandwidth
nethogs                              # per-process network usage (like top for net)
ss -tup                              # open connections + process
sudo nload                           # overall throughput graph
```
Find chatty processes:
```bash
sudo netstat -tup                     # connections with PID/program
sudo conntrack -L | wc -l             # connection count (NAT/DoS check)
```
Common causes: backups/sync to cloud, updates, torrents, streaming, a process
leaking connections, malware beaconing.

## Decision table — pick the right tool
| Question | First command | Drill-down |
|----------|---------------|------------|
| What eats CPU? | `top -o %CPU` | `perf top -p PID` |
| What eats RAM? | `free -h` / `top -o %MEM` | `smem`, `/proc/PID/smaps` |
| What eats GPU? | `nvidia-smi` | `nvidia-smi --query-compute-apps` |
| What eats disk I/O? | `iostat -xz 1` | `iotop -o`, `fatrace` |
| What uses my drive space? | `df -h` / `ncdu /` | `du -sh`, `find -size +1G` |
| What uses bandwidth? | `nethogs` | `iftop`, `ss -tup` |

## After you find the hog
- **Legitimate but heavy**: limit with `nice`/`ionice`, cgroup limits
  (`systemd-run --scope -p CPUWeight=`, `MemoryMax=`), or schedule off-hours.
- **Bug/leak**: restart the process; update or report the bug.
- **Malware (miner/beacon)**: kill, remove persistence (`systemctl`, crontab),
  scan, change credentials.
- **Full disk**: delete logs/cache/snapshots, `lsof +L1` for held-deleted files,
  expand the volume or add storage.
