# What Is Eating My Resources?

"What is using up X" playbooks. Start broad, then drill into the offending process. Tools marked *(install)* are not present by default on every desktop.

> **For the AI:** When asked what is using CPU/memory/disk/network, RUN `sys perf top` (and the relevant command) via `run_bash` and report the actual top processes/numbers. Do NOT reply with a list of commands or a snippet for the user to run.

## Quick triage — see everything at once
```bash
sys perf top                  # CPU/MEM snapshot (top -b -n1 | head)
sys perf mem                  # RAM + swap summary
sys perf load                 # load average
# Interactive viewers (only mention these if the user wants a live view):
htop              # (install) CPU/MEM per-process; F6 sort, F9 kill
btop              # (install) CPU/GPU/mem/disk/net graphs
glances           # (install) terminal + web dashboard
```

## What is eating CPU?
```bash
ps -eo pid,comm,%cpu --sort=-%cpu | head
sys perf top
mpstat -P ALL 1                      # (install) per-core utilization
pidstat -u -p PID 1                  # (install) per-process CPU over time
perf top -p PID                      # (install) live sampling of one process
```
Common causes: runaway loop, unoptimized build, crypto miner, indexing, thermal throttling (`sensors` / `turbostat`).

## What is eating memory (RAM)?
```bash
sys perf mem                  # total/used/free + swap
ps -eo pid,comm,%mem,rss --sort=-%mem | head
cat /proc/PID/smaps | grep -i pss    # per-mapping detail for a PID
sudo slabtop                         # (install) kernel slab usage
```
Common causes: memory leak, cache/buffer growth (normal — `free` counts it as used), too many browser tabs, container without a memory limit.

## What is eating the GPU?
```bash
nvidia-smi            # GPU util, memory, processes (NVIDIA)
nvidia-smi dmon -s u  # 1s GPU utilization samples
nvidia-smi --query-compute-apps=pid,used_memory,process_name --format=csv
radeontop             # (install) AMD GPU
intel_gpu_top         # (install) Intel integrated GPU
```

## What is eating disk I/O?
```bash
sys disk usage                # space per mount
iostat -xz 1          # (install) %util near 100% = saturated
iotop -o              # (install) processes doing I/O now
sudo fatrace          # (install) which process accesses which file
```
Common causes: backup/sync (rsync, Dropbox), database, log spam, swap thrashing, malware scanning.

## What is using up storage / disk space?
```bash
sys disk usage                # space per mount (df -h)
sys disk fs /home            # per-path size (du -sh)
# Native detail (not wrapped by sys):
du -sh /* 2>/dev/null  # size of each top-level dir
du -sh /home/*         # per-user usage
ncdu /                 # (install) interactive disk usage browser
du -h --max-depth=1 /var 2>/dev/null | sort -h   # drill down
find / -xdev -type f -size +1G -printf '%s %p\n' | sort -rn | head   # big files
lsof +L1               # deleted files still held open (df full, du doesn't show)
```
Common causes: logs (`/var/log`), package cache (`sys pkg clean`), container images (`docker system prune`), old kernels, snapshots, downloads, VM disk images, un-emptied trash.

## What is using network bandwidth?
```bash
sys net listen                # open connections + process (ss -tupn)
sudo nethogs                     # (install) per-process network usage
sudo iftop -i eth0               # (install) live per-host bandwidth
sudo nload                       # (install) overall throughput graph
```
Common causes: cloud backups/sync, updates, torrents, streaming, leaking connections, malware beaconing.

## After you find the hog
- **Legitimate but heavy**: limit with `nice`/`ionice`, cgroup limits (`systemd-run --scope -p MemoryMax=`), or schedule off-hours.
- **Bug/leak**: restart the process; update or report the bug.
- **Malware (miner/beacon)**: kill, remove persistence (`systemctl`, `crontab`), scan, change credentials.
- **Full disk**: delete logs/cache/snapshots, `lsof +L1` for held-deleted files, expand the volume or add storage.
