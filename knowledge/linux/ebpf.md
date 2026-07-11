# eBPF (Extended Berkeley Packet Filter)

## Overview
eBPF is a revolutionary kernel technology that allows running sandboxed programs in the Linux kernel without changing kernel source code or loading kernel modules.

## Key Concepts

### Architecture
- **Bytecode Verifier**: Ensures program safety (no loops, bounded execution, memory safety)
- **JIT Compiler**: Compiles bytecode to native machine code (x86, ARM, RISC-V)
- **Maps**: Key-value stores for sharing data between kernel and userspace
- **Helpers**: Kernel functions callable from eBPF programs
- **Program Types**: Different attachment points with different capabilities

### Program Types
| Type | Attachment Point | Use Case |
|------|------------------|----------|
| `XDP` | Network driver (early) | DDoS mitigation, load balancing |
| `TC` | Traffic Control (ingress/egress) | Filtering, shaping |
| `KPROBE` | Kernel function entry | Tracing, profiling |
| `KRETPROBE` | Kernel function return | Latency measurement |
| `UPROBE` | Userspace function entry | Application tracing |
| `TRACEPOINT` | Static kernel tracepoints | Stable tracing |
| `RAW_TRACEPOINT` | Raw tracepoints | Performance |
| `LSM` | Linux Security Modules | Security policy |
| `CGROUP_SKB` | Cgroup network | Container networking |
| `SOCK_OPS` | TCP socket operations | Congestion control |
| `SK_MSG` | Socket message | TLS processing |
| `STRUCT_OPS` | Kernel struct callbacks | Custom algorithms |

## Tools Ecosystem

### BPFtrace (High-Level Tracing)
```bash
# Install
sudo apt install bpftrace  # Debian/Ubuntu
sudo dnf install bpftrace  # Fedora

# One-liners
bpftrace -e 'tracepoint:syscalls:sys_enter_open { printf("%s %s\n", comm, str(args->filename)); }'
bpftrace -e 'kprobe:vfs_read { @bytes[comm] = sum(args->count); }'
bpftrace -e 'profile:hz:99 { @[stack] = count(); }'

# Script file
cat > trace.bt <<'EOF'
#!/usr/bin/bpftrace

BEGIN { printf("Tracing opens...\n"); }

tracepoint:syscalls:sys_enter_openat
{
    printf("%-16s %s\n", comm, str(args->filename));
}
EOF
chmod +x trace.bt
./trace.bt
```

### bcc (BPF Compiler Collection)
```bash
# Install
sudo apt install bpfcc-tools linux-headers-$(uname -r)

# Tools
execsnoop          # Trace exec() calls
opensnoop          # Trace open() calls
biolatency         # Block I/O latency
bashreadline       # Trace bash commands
tcpconnect         # Trace TCP connections
tcpretrans         # Trace TCP retransmits
runqlat            # Run queue latency
profile            # CPU profiling
```

### bpftrace vs bcc
| Aspect | bpftrace | bcc |
|--------|----------|-----|
| Language | Domain-specific (awk-like) | Python/C++ |
| Learning Curve | Low | Medium |
| Flexibility | Limited | Full |
| Performance | Good | Excellent |
| Deployment | Single binary | Requires Python/headers |

### libbpf / CO-RE (Compile Once, Run Everywhere)
```c
// Modern eBPF with libbpf and CO-RE
// Compile with clang -target bpf -O2 -g

#include <vmlinux.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_tracing.h>

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 10240);
    __type(key, u32);
    __type(value, u64);
} exec_count SEC(".maps");

SEC("tracepoint/syscalls/sys_enter_execve")
int trace_exec(struct trace_event_raw_sys_enter *ctx) {
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    u64 *count = bpf_map_lookup_elem(&exec_count, &pid);
    if (count) {
        (*count)++;
    } else {
        u64 val = 1;
        bpf_map_update_elem(&exec_count, &pid, &val, BPF_ANY);
    }
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
```

### bpftrace Map Types
```bpftrace
# Hash map
@counts[comm] = count();

# Array map (fixed size)
@latency[100] = hist(args->latency);

# LRU hash (auto-evict)
@lru[pid] = lru();

# Stack trace
@stacks = stack(count());

# Perf event array (for userspace)
@events = perf_event_array();
```

## Maps

### Common Map Types
```c
// Hash map (most common)
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 10240);
    __type(key, u32);
    __type(value, u64);
} my_hash SEC(".maps");

// Per-CPU array (high performance counters)
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 64);
    __type(key, u32);
    __type(value, u64);
} percpu_counters SEC(".maps");

// LRU Hash (auto-evicts old entries)
struct {
    __uint(type, BPF_MAP_TYPE_LRU_HASH);
    __uint(max_entries, 1024);
    __type(key, u32);
    __type(value, struct data);
} lru_map SEC(".maps");

// Ring buffer (high-throughput event streaming)
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 20);  // 1MB
} events SEC(".maps");

// Stack trace map
struct {
    __uint(type, BPF_MAP_TYPE_STACK_TRACE);
    __uint(max_entries, 10000);
    __uint(key_size, sizeof(u32));
    __uint(value_size, 128);  // max frames * 8
} stack_traces SEC(".maps");
```

## Networking with eBPF

### XDP (eXpress Data Path)
```c
// xdp_drop.c - Drop packets at driver level
#include <linux/bpf.h>
#include <bpf/bpf_helpers.h>

SEC("xdp")
int xdp_drop(struct xdp_md *ctx) {
    return XDP_DROP;
}

char LICENSE[] SEC("license") = "GPL";
```

```bash
# Load XDP program
sudo ip link set dev eth0 xdp obj xdp_drop.o sec xdp

# View stats
sudo ip link show dev eth0

# Offload to hardware (if supported)
sudo ip link set dev eth0 xdpoffload obj xdp_drop.o sec xdp
```

### TC (Traffic Control)
```bash
# Attach to ingress
tc qdisc add dev eth0 ingress
tc filter add dev eth0 ingress bpf da obj tc_filter.o sec classifier

# Attach to egress
tc qdisc add dev eth0 root handle 1: clsact
tc filter add dev eth0 egress bpf da obj tc_filter.o sec classifier
```

### Socket Filtering
```c
// Filter on socket
SEC("socket")
int socket_filter(struct __sk_buff *skb) {
    // Allow only port 80/443
    if (bpf_ntohs(skb->protocol) != ETH_P_IP) return 0;
    // Parse IP/TCP headers...
    return 1;  // Allow
}
```

## Tracing & Profiling

### USDT (User Statically Defined Tracing)
```bash
# List USDT probes in binary
bpftrace -l 'usdt:/usr/bin/python3:*'

# Trace Python function calls
bpftrace -e 'usdt:/usr/bin/python3:function__entry { printf("%s\n", str(arg0)); }'
```

### Profiling with eBPF
```bash
# CPU profiling (99 Hz)
bpftrace -e 'profile:hz:99 { @[stack] = count(); }'

# Memory allocation profiling
bpftrace -e 'uprobe:libc:malloc { @size[stack] = sum(arg1); }'

# Block I/O latency
bpftrace -e 'tracepoint:block:block_rq_issue { @start[args->dev, args->sector] = nsecs; } tracepoint:block:block_rq_complete /@start[args->dev, args->sector]/ { @latency = hist(nsecs - @start[args->dev, args->sector]); }'
```

## Security (LSM BPF)

### File Access Control
```c
// lsm_file_open.c
#include <linux/bpf.h>
#include <bpf/bpf_helpers.h>
#include <linux/lsm_hooks.h>

SEC("lsm/file_open")
int BPF_PROG(file_open_hook, struct file *file, int flags) {
    char filename[256];
    bpf_probe_read_str(filename, sizeof(filename), file->f_path.dentry->d_name.name);
    
    // Block access to sensitive files
    if (bpf_strncmp(filename, 8, "secret") == 0) {
        return -EPERM;
    }
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
```

## Container Networking (Cilium)

### Cilium Architecture
- **eBPF Datapath**: Replaces iptables/kube-proxy
- **Service Mesh**: L7 visibility, mTLS, auth
- **Network Policy**: Kubernetes NetworkPolicy + CiliumNetworkPolicy
- **Load Balancing**: Maglev, consistent hashing
- **Encryption**: WireGuard, IPsec

### Cilium CLI
```bash
# Install
cilium install

# Check status
cilium status

# View endpoints
cilium endpoint list

# Policy verification
cilium policy get

# Hubble observability
cilium hubble enable
hubble observe --follow
```

## Performance Analysis

### perf with eBPF
```bash
# Record with eBPF
perf record -e bpf:bpf_prog_run -a -- sleep 10

# Generate report
perf report
```

### BCC Tools for Performance
```bash
# CPU flame graphs
profile -F 99 -d 30 > out.stacks
flamegraph.pl out.stacks > flame.svg

# Off-CPU analysis
offcputime -K -f 30 > offcpu.stacks

# Memory leaks
memleak -p $(pidof myapp)

# Lock contention
profile -e lock:lock_acquire -F 99
```

## Debugging eBPF Programs

### Verifier Logs
```bash
# View verifier log
bpftool prog show id <prog_id> --pretty

# Load with debug
bpftool prog load prog.o /sys/fs/bpf/prog type kprobe
# Check /sys/kernel/debug/tracing/trace_pipe
```

### bpftool
```bash
# List programs
bpftool prog list

# List maps
bpftool map list

# Dump map contents
bpftool map dump id <map_id>

# Show program info
bpftool prog show id <prog_id> --pretty

# Pin maps/programs
bpftool prog pin id <id> /sys/fs/bpf/my_prog
bpftool map pin id <id> /sys/fs/bpf/my_map
```

## Development Workflow

### Modern Toolchain (libbpf + clang)
```bash
# Install dependencies
sudo apt install clang llvm libbpf-dev linux-headers-$(uname -r)

# Build with Makefile
# Makefile
CLANG = clang
LLC = llc
BPFTOOL = bpftool

vmlinux.h:
	$(BPFTOOL) btf dump file /sys/kernel/btf/vmlinux format c > vmlinux.h

%.o: %.c vmlinux.h
	$(CLANG) -target bpf -O2 -g -Wall -I. -c $< -o $@

# Generate skeleton
%.skel.h: %.o
	$(BPFTOOL) gen skeleton $< > $@
```

### CI/CD Integration
```yaml
# .github/workflows/ebpf.yml
- name: Build eBPF
  run: |
    make
    # Test load
    sudo bpftool prog load build/prog.o /sys/fs/bpf/test type xdp
```

## Resources
- [eBPF.io](https://ebpf.io) - Official site
- [BPF Performance Tools](https://www.brendangregg.com/ebpf.html) - Brendan Gregg
- [Cilium eBPF Docs](https://docs.cilium.io/en/stable/bpf/)
- [Linux Kernel BPF Documentation](https://www.kernel.org/doc/html/latest/bpf/)
- [bpftrace Reference](https://github.com/bpftrace/bpftrace/blob/master/docs/reference_guide.md)
- [BCC Tutorial](https://github.com/iovisor/bcc/blob/master/docs/tutorial.md)
- [libbpf Bootstrap](https://github.com/libbpf/libbpf-bootstrap)
- [eBPF Summit Talks](https://www.youtube.com/c/eBPFSummit)