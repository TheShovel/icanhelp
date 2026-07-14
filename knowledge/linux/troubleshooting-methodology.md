# Linux Troubleshooting Methodology

## General Approach

1. **Define the problem** — symptoms, when it started, what changed, reproducible?, impact.
2. **Gather information** — system state, logs, metrics.
3. **Form hypothesis** — binary search / divide and conquer; check recent changes first.
4. **Test hypothesis** — one change at a time; document; have a rollback plan.
5. **Implement fix** — apply, verify, monitor for regression.
6. **Document** — root cause, resolution, prevention.

## Gather Info (Baseline)
Prefer `sys` verbs; native universal tools are fine where `sys` doesn't cover them.
```bash
uname -a                     # kernel (tested: works)
cat /etc/os-release
sys detect                   # distro + tooling
sys perf load                # load (uptime)
sys perf mem                 # memory (free -h)
sys disk usage               # disk (df -h)
vmstat 1                     # health (tested: works)
sys log show -xe             # last failure (tested: works)
dmesg -T                     # kernel log (root in sandbox)
sys net listen               # listening sockets (tested: works)
ip addr show ; ip route show
ping -c 3 8.8.8.8
```

## Common Issue Categories

### Boot
```bash
systemctl --failed           # failed units (tested: works)
systemctl list-units --state=failed
sys log boot -1 -p err       # previous boot errors
sys kern initramfs           # rebuild initramfs
```

### Network Connectivity (layered)
```bash
ethtool eth0 ; ip link show eth0        # L1/L2
ip neighbor show ; ip route get 8.8.8.8 # L3
sys net listen ; nc -zv host port        # L4
dig example.com ; getent hosts example.com   # DNS
sys firewall status ; nft list ruleset  # firewall
tcpdump -i eth0 -nn -w cap.pcap port 80 # capture
```

### Disk Space
```bash
sys disk fs /                # du -sh on a path
find / -xdev -type f -size +100M -exec ls -lh {} \;
lsof +L1                      # deleted-but-open files
df -i                         # inode exhaustion
sys log vacuum 30d           # trim journal by time
```

### Memory
```bash
sys perf mem ; cat /proc/meminfo
ps aux --sort=-%mem | head
dmesg -T | grep -i "out of memory"   # (root)
sys swap status
```

### CPU
```bash
top -c ; htop ; pidstat 1
mpstat -P ALL 1
perf record -a -g -- sleep 30 ; perf report   # (perf not in sandbox)
cat /proc/interrupts
```

### Process Issues
```bash
ps aux | grep D      # uninterruptible sleep (I/O stuck)
ps aux | grep Z      # zombies (kill parent to reap)
lsof -p PID ; ls -l /proc/PID/fd/   # open files / fds
ps -eLf | grep PID ; top -H -p PID  # threads
```

### Service Issues
```bash
sys svc status service        # status + recent logs
journalctl -u service -f
systemctl cat service ; systemd-analyze verify service
systemctl list-dependencies service
```

### Permissions
```bash
ls -la /path ; stat /path ; getfacl /path
sys secure status             # SELinux / AppArmor
sys secure audit              # recent AVC denials
getcap /path/to/binary ; sudo -l
```

## Performance: USE Method

For each resource check **U**tilization, **S**aturation, **E**rrors:
- **CPU**: `mpstat 1` / `vmstat 1` (r > CPUs = saturated) / `dmesg | grep cpu`
- **Memory**: `sys perf mem` / `vmstat 1` (si/so) / `dmesg | grep memory`
- **Disk**: `iostat -xz 1` (%util, await) / `smartctl -a /dev/sda`
- **Network**: `sar -n DEV 1` / `netstat -s | grep retrans` / `ethtool -S eth0`

## Flame Graphs (CPU profiling)
```bash
perf record -F 99 -a -g -- sleep 30
perf script | stackcollapse-perf.pl | flamegraph.pl > cpu.svg
```

## Debugging Tools Cheatsheet

| Tool | Purpose |
|------|---------|
| `strace` | System calls |
| `ltrace` | Library calls |
| `gdb` | Debugger |
| `perf` | Profiling |
| `bpftrace` | eBPF tracing (see ebpf.md) |
| `tcpdump` | Packet capture |
| `lsof` | Open files |
| `ss` | Socket statistics |
| `iotop` / `nethogs` | Per-process I/O / network |
| `htop` | Interactive process viewer |
| `vmstat` / `iostat` / `mpstat` / `pidstat` / `sar` / `numastat` | System statistics |
