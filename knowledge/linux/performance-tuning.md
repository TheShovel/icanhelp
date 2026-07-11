# Linux Performance Monitoring & Tuning

## CPU

### Monitoring
```bash
# Real-time
top                     # Basic
htop                    # Interactive, colors
btop                    # Modern, graphs
atop                    # Historical, logging

# Per-process
pidstat 1               # CPU per process (1s interval)
pidstat -u 1 -p PID     # Specific PID
ps -eo pid,ppid,cmd,%cpu,%mem --sort=-%cpu | head

# System-wide
mpstat 1                # Per-CPU stats
mpstat -P ALL 1         # All CPUs
vmstat 1                # System overview (r=b=blocked, us=sy=id=wa=st)
sar -u 1 10             # Historical (sysstat package)

# Load average
uptime                  # 1, 5, 15 min
cat /proc/loadavg
# Load > CPU cores = saturated
```

### Analysis
```bash
# Top CPU consumers
ps aux --sort=-%cpu | head -20

# Thread-level
top -H -p PID           # Threads of process
perf top -p PID         # Function-level (perf_event_paranoid=1)

# Context switches
pidstat -w 1            # Voluntary/non-voluntary
vmstat 1                # cs column = context switches/sec

# CPU affinity
taskset -cp 0-3 PID     # Pin to cores 0-3
taskset -cp 0 PID       # Pin to core 0
```

### Tuning
```bash
# Governor (performance/powersave/ondemand)
cpupower frequency-set -g performance
echo performance | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Disable C-states (latency sensitive)
echo 1 > /sys/module/processor/parameters/max_cstate
# Or kernel param: processor.max_cstate=1 idle=poll

# Isolate CPUs (kernel cmdline)
isolcpus=2,3 nohz_full=2,3 rcu_nocbs=2,3
# Then pin critical tasks to CPUs 2,3

# IRQ affinity
echo 2 > /proc/irq/24/smp_affinity  # Pin interrupt to CPU 2
```

## Memory

### Monitoring
```bash
free -h                   # Human readable
free -h -w                # Wide (show cache/available)
cat /proc/meminfo         # Detailed

# Per-process
smem -rk                  # RSS, PSS, USS (install smem)
ps aux --sort=-%mem | head
pmap -x PID               # Process memory map

# Slab (kernel)
slabtop -o                # Once
slabtop                   # Interactive

# NUMA
numastat                  # Per-node stats
numactl --hardware        # Topology
```

### Analysis
```bash
# OOM killer
dmesg -T | grep -i "out of memory"
journalctl -k | grep -i oom

# Memory leaks
valgrind --leak-check=full --show-leak-kinds=all ./program
# Or: heaptrack ./program

# Swap usage
swapon --show
cat /proc/swaps
# Per-process swap
for f in /proc/*/status; do awk '/VmSwap|Name/{printf $2 " " $3} END {print ""}' $f; done | sort -k2 -nr | head
```

### Tuning
```bash
# Swappiness (0-100, default 60)
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.d/99-swap.conf

# VFS cache pressure (default 100)
sysctl vm.vfs_cache_pressure=50

# Huge pages (for databases, JVM)
echo 1024 > /proc/sys/vm/nr_hugepages
# Persistent: vm.nr_hugepages=1024 in sysctl.conf

# Transparent Huge Pages (THP)
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
# Kernel cmdline: transparent_hugepage=never

# OOM score adjustment
echo -1000 > /proc/PID/oom_score_adj  # Protect from OOM
echo 1000 > /proc/PID/oom_score_adj   # Prefer to kill
```

## Disk I/O

### Monitoring
```bash
# Real-time
iostat -xz 1              # Extended, skip first, 1s interval
iostat -xz 1 -d sda       # Specific device
iotop -o                  # Only processes doing I/O
dstat -d                  # Disk stats
btop                      # Includes I/O

# Latency
iolatency -d sda 1        # bpftrace tool
biolatency 1              # bpftrace, latency histogram

# Block layer
btrace /dev/sda           # Trace block I/O
blktrace -d /dev/sda -o - | blkparse -i -

# Filesystem
df -h                     # Space
df -i                     # Inodes
du -sh /path/*            # Directory sizes
ncdu /path                # Interactive
```

### Analysis
```bash
# I/O wait
vmstat 1                  # wa column
sar -d 1                  # tps, await, svctm, %util

# Queue depth
cat /sys/block/sda/queue/nr_requests

# Scheduler
cat /sys/block/sda/queue/scheduler
# none (NVMe), mq-deadline, bfq, kyber
echo mq-deadline > /sys/block/sda/queue/scheduler

# Read-ahead
blockdev --getra /dev/sda
blockdev --setra 4096 /dev/sda  # 4MB (default 256KB)

# NCQ depth
cat /sys/block/sda/device/queue_depth
```

### Tuning
```bash
# noatime (already default on most)
# discard (TRIM) - use fstrim timer instead
systemctl enable fstrim.timer

# I/O scheduler for SSD
# NVMe: none (hardware handles)
# SATA SSD: mq-deadline or kyber
# HDD: bfq (desktop) or mq-deadline (server)

# Mount options
# ext4: defaults,noatime,discard
# xfs: defaults,noatime
# btrfs: defaults,noatime,compress=zstd

# Database files: disable barriers (if battery-backed RAID)
# mount -o nobarrier /dev/sdX /mnt
```

## Network

### Monitoring
```bash
# Bandwidth
iftop -i eth0             # Per-connection
nethogs                   # Per-process
bmon                      # Graphical
nload                     # Simple graph
vnstat                    # Historical (daemon)

# Connections
ss -tuln                  # Listening TCP/UDP
ss -tupn                  # With process
ss -s                     # Summary stats
netstat -tulnp            # Legacy

# Packet capture
tcpdump -i eth0 -n port 80
tcpdump -i eth0 -w capture.pcap
wireshark capture.pcap

# Socket stats
ss -ti                    # TCP info (cwnd, rtt, retrans)
ss -o state established   # With timer info

# Bandwidth test
iperf3 -s                 # Server
iperf3 -c server          # Client
iperf3 -c server -R       # Reverse (download test)
iperf3 -c server -P 10    # 10 parallel streams
```

### Analysis
```bash
# Retransmissions
netstat -s | grep -i retrans
# Or: ss -ti | grep retrans

# Drop packets
ethtool -S eth0 | grep -i drop
cat /proc/net/softnet_stat

# MTU issues
ping -M do -s 1472 host   # 1472 + 28 = 1500
# "local error: Message too large" = MTU too small

# TCP buffer tuning
sysctl net.core.rmem_max=16777216
sysctl net.core.wmem_max=16777216
sysctl net.ipv4.tcp_rmem='4096 87380 16777216'
sysctl net.ipv4.tcp_wmem='4096 65536 16777216'
sysctl net.core.netdev_max_backlog=5000
sysctl net.ipv4.tcp_congestion_control=bbr
```

### Tuning
```bash
# BBR congestion control (kernel 4.9+)
echo 'net.core.default_qdisc=fq' >> /etc/sysctl.d/99-net.conf
echo 'net.ipv4.tcp_congestion_control=bbr' >> /etc/sysctl.d/99-net.conf
sysctl --system

# Increase connection tracking
sysctl net.netfilter.nf_conntrack_max=1000000
sysctl net.netfilter.nf_conntrack_tcp_timeout_established=600

# Disable TCP timestamps (security/performance)
sysctl net.ipv4.tcp_timestamps=0

# TCP Fast Open
sysctl net.ipv4.tcp_fastopen=3

# Queue discipline
tc qdisc add dev eth0 root fq
```

## System-Wide Tools

### perf (CPU Profiling)
```bash
# System-wide
perf record -g -- sleep 30
perf report

# Specific process
perf record -g -p PID -- sleep 30
perf report

# Call graph
perf record -g --call-graph=dwarf ./program
perf report --call-graph

# Hardware counters
perf stat -e cycles,instructions,cache-references,cache-misses ./program
perf stat -a -- sleep 10  # System-wide

# Tracepoints
perf record -e sched:sched_switch -a -- sleep 5
perf script
```

### bpftrace / bcc (eBPF)
```bash
# Install: bpftrace, bcc-tools

# Open files
opensnoop

# Syscalls
syscount -p PID
syscount

# File I/O
biolatency 1
biosnoop

# TCP
tcplife
tcpconnect
tcpretrans

# Memory
mmappages
oomkill

# Custom
bpftrace -e 'tracepoint:syscalls:sys_enter_openat { printf("%s %s\n", comm, str(args->filename)); }'
```

### System Health
```bash
# Overall
glances                   # Comprehensive
dstat --top-cpu --top-mem --top-io  # Rolling top
atop -r /var/log/atop/atop_$(date +%Y%m%d)  # Historical

# Boot
systemd-analyze           # Total boot time
systemd-analyze blame     # Per-unit time
systemd-analyze critical-chain

# Logs
journalctl -p err -b      # Errors this boot
journalctl -u service -f  # Follow service
journalctl --since "1 hour ago" --until "now"
```

## Continuous Monitoring

### Prometheus Node Exporter
```bash
# Install
wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz
tar xzf node_exporter-*.tar.gz
sudo cp node_exporter-*/node_exporter /usr/local/bin/
sudo useradd --no-create-home --shell /bin/false node_exporter
sudo systemctl enable --now node_exporter
```

### Grafana Dashboards
- Node Exporter Full (ID: 1860)
- Linux System Overview (ID: 14414)

### Alerting Rules
```yaml
# High CPU
- alert: HighCPU
  expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
  for: 5m

# High Memory
- alert: HighMemory
  expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
  for: 5m

# Disk Space
- alert: DiskSpace
  expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 10
  for: 5m

# Disk I/O
- alert: DiskLatency
  expr: rate(node_disk_read_time_seconds_total[1m]) / rate(node_disk_reads_completed_total[1m]) > 0.1
  for: 5m
```

## Kernel Parameters (`/etc/sysctl.d/99-performance.conf`)
```ini
# Virtual Memory
vm.swappiness = 10
vm.vfs_cache_pressure = 50
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
vm.dirty_expire_centisecs = 3000
vm.dirty_writeback_centisecs = 500

# Network
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq

# Filesystem
fs.inotify.max_user_watches = 524288
fs.file-max = 2097152

# Kernel
kernel.pid_max = 4194304
kernel.sched_min_granularity_ns = 10000000
kernel.sched_wakeup_granularity_ns = 15000000
```