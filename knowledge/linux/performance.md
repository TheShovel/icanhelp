# Linux Performance Tuning & Profiling

## Monitoring Tools
- `top`/`htop` — real-time process overview, CPU/memory per process
- `htop` shows tree view (F5), thread counts (H), user filters (u)
- `atop` — historical process/CPU/disk/memory logging with replay
- `btm` (bottom) — modern TUI with GPU, network, disk, temperature
- `nmon` — interactive stats with export to CSV
- `glances` — web+terminal multi-metric dashboard

## CPU Performance
- `mpstat -P ALL 1` — per-core utilization every 1s
- `perf top` — live kernel+userspace CPU profiling (sampling)
- `perf record -F 99 -ag -- sleep 30` — 99 Hz sampling, full call graph
- `perf report` — analyze recorded profile
- `turbostat` — real-time CPU frequency, C-states, power consumption
- `cpupower frequency-info` — governor and frequency details
- Governors: `performance`, `powersave`, `ondemand`, `schedutil` (preferred)
- `cpupower frequency-set -g performance` — set governor
- `taskset -c 0,1 <command>` — pin process to specific cores

## Memory Analysis
- `free -h` — total/used/free RAM + swap
- `vmstat 1` — system memory, swap I/O, CPU, run queue
- `/proc/meminfo` — detailed memory breakdown (MemAvailable, Buffers, Cached)
- `smem` — proportional set size (PSS) per process
- `slabtop` — kernel slab allocator usage
- `cat /proc/slabinfo` — detailed slab statistics
- `numastat -m` — NUMA node memory allocation
- Transparent HugePages: check `/sys/kernel/mm/transparent_hugepage/enabled`
  - `always` — kernel automatically promotes; `madvise` — opt-in via madvise; `never` — disable

## Disk I/O
- `iostat -xz 1` — per-device I/O statistics (await, svctm, %util)
- `iotop -o` — processes currently doing I/O
- `iostat -x 1` extended columns: r/s, w/s, rkB/s, wkB/s, await, svctm, %util
- await > 10ms suggests disk latency issue; %util near 100% means saturated
- `lsblk -o NAME,ROTA,SIZE,MODEL` — SSD vs HDD detection (ROTA=1 for HDD)
- `hdparm -Tt /dev/sda` — cached and buffered disk read speed
- `fio --randwrite --direct=1 --bs=4k --size=1G --numjobs=4` — benchmark random 4k write
- `blktrace /dev/sda` — detailed block layer tracing
- `iowatcher -t <trace>` — visualize blktrace output as SVG

## Network Performance
- `sar -n DEV 1` — network interface throughput
- `netstat -s` — protocol stats (retransmits, drops, errors)
- `ss -i` — per-socket TCP info (cwnd, rtt, rttvar)
- `ethtool -S eth0` — NIC driver-level counters
- `ethtool -K eth0 tx on gro on gso on tso on` — enable offloads
- `iperf3 -c <server>` — TCP throughput test
- `iperf3 -c <server> -u -b 1G` — UDP throughput test
- `tc qdisc show dev eth0` — current queuing discipline (fq_codel, pfifo_fast)
- `sysctl net.core.default_qdisc=fq_codel` — BBR-friendly qdisc
- `sysctl net.ipv4.tcp_congestion_control=bbr` — BBR congestion control

## Kernel Tuning (sysctl)
```
# Reduce swappiness (default 60, lower = less swap)
vm.swappiness = 10

# Increase max file descriptors
fs.file-max = 2097152

# Network buffer tuning
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 131072 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# Enable fast TCP connection reuse
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15

# Increase backlog
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
```

## Profiling with perf
```
# Record 30 seconds of CPU samples with stack traces
perf record -F 99 -a -g -- sleep 30

# Show top functions with annotations
perf report -n --stdio

# Annotate a specific function
perf annotate <function_name>

# Record kernel tracepoints
perf record -e sched:sched_switch -a -- sleep 10

# Record block device events
perf record -e block:block_rq_complete -a -- sleep 10
```

## eBPF / bpftrace
- `bpftrace -e 'tracepoint:syscalls:sys_enter_open { printf("%s %s\n", comm, str(args->filename)); }'`
- `bpftrace -e 'kprobe:do_sys_open { @[comm] = count(); }'` — count opens by process
- `bcc/tools/filetop` — show top files read/written per process
- `bcc/tools/biolatency` — histogram of disk I/O latency
- `bcc/tools/execsnoop` — print new processes as they exec
- `bcc/tools/tcplife` — show TCP session lifetimes with bytes transferred
- `bcc/tools/cpudist` — distribution of CPU time per process
