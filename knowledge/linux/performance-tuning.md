# Linux Performance Tuning & Profiling

Tuning and deep profiling. For live monitoring/analysis see `performance.md`.

## CPU Frequency & Governors
```bash
# View current governor / driver (cpupower not installed in sandbox)
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor   # (tested: works)
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_driver
sys perf cpu                  # CPU model/cores/MHz (lscpu)
cat /proc/cpuinfo | grep MHz # per-core frequency (tested: works)

# Set governor (live, requires root; cpupower optional)
cpupower frequency-set -g performance        # performance|powersave|ondemand|schedutil
echo performance | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Pin a process to cores
taskset -c 0,1 command
taskset -cp 0-3 PID
```

Governors: `performance` (max freq), `powersave` (min), `ondemand`/`schedutil` (load-driven, schedutil is the modern default).

## Disk I/O Tuning
```bash
# Scheduler (read; write requires root)
cat /sys/block/sda/queue/scheduler          # none|mq-deadline|bfq|kyber
echo mq-deadline > /sys/block/sda/queue/scheduler

# Read-ahead
blockdev --getra /dev/sda
blockdev --setra 4096 /dev/sda              # 4MB (default 256 sectors)

# Enable periodic TRIM
systemctl enable fstrim.timer
```

Guidance: NVMe → `none`; SATA SSD → `mq-deadline`/`kyber`; HDD → `bfq` (desktop) or `mq-deadline` (server).

## Network Tuning (sysctl)
```bash
# View current values (safe, read-only)
sysctl net.ipv4.tcp_congestion_control net.core.somaxconn vm.swappiness

# Apply at runtime (non-persistent; requires root)
sysctl -w net.core.somaxconn=65535
sysctl -w net.ipv4.tcp_congestion_control=bbr

# Persist in /etc/sysctl.d/99-net.conf, then:
sysctl --system
```

Common high-throughput settings: `net.core.rmem_max=16777216`, `net.core.wmem_max=16777216`, `net.ipv4.tcp_rmem="4096 87380 16777216"`, `net.ipv4.tcp_wmem="4096 65536 16777216"`, `net.core.default_qdisc=fq`, `net.ipv4.tcp_congestion_control=bbr`.

## Memory Tuning (sysctl)
```bash
sysctl vm.swappiness            # 0-200, default 60; lower = less swap
sysctl -w vm.swappiness=10      # desktop; 1 for servers
sysctl -w vm.vfs_cache_pressure=50   # reclaim dentry/inode cache sooner
# Persist: echo 'vm.swappiness=10' >> /etc/sysctl.d/99-swap.conf
```

Transparent Huge Pages (can cause latency spikes in databases/RT apps):
```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/enabled   # requires root
```

## Profiling with perf
```bash
# System-wide sampling with call graph (perf NOT installed in sandbox)
perf record -F 99 -a -g -- sleep 30
perf report
perf stat -e cycles,instructions,cache-misses ./program
perf record -e sched:sched_switch -a -- sleep 10   # tracepoint
```

## eBPF / bpftrace
```bash
# One-liners (bpftrace NOT installed in sandbox; see ebpf.md)
bpftrace -e 'tracepoint:syscalls:sys_enter_openat { printf("%s %s\n", comm, str(args->filename)); }'
bpftrace -e 'profile:hz:99 { @[stack] = count(); }'
```

## Kernel Boot Parameters (GRUB)
Edit `/etc/default/grub` → `GRUB_CMDLINE_LINUX_DEFAULT`, then `grub-mkconfig -o /boot/grub/grub.cfg` (or `update-grub`). Common: `mitigations=off` (perf vs security), `transparent_hugepage=never`, `intel_pstate=disable` (use acpi-cpufreq), `processor.max_cstate=1` (latency), `isolcpus=2,3 nohz_full=2,3` (CPU isolation).
