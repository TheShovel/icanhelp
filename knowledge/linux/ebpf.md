# eBPF (Extended Berkeley Packet Filter)

eBPF runs sandboxed programs in the kernel without changing kernel source or loading modules. Programs are verified (no loops, bounded, memory-safe), JIT-compiled, and exchange data with user space via **maps**.

## Program Types (attachment points)
`XDP` (driver ingress), `TC` (traffic control), `KPROBE`/`KRETPROBE` (kernel fn entry/return), `UPROBE` (user fn), `TRACEPOINT` (stable static points), `LSM` (security), `CGROUP_SKB`, `SOCK_OPS`, `STRUCT_OPS`.

## Tools
- **bpftrace** — high-level DTrace-like one-liners (install: `pacman -S bpftrace` / `apt install bpftrace`).
- **bcc** — Python/C++ toolkit (`bcc-tools`, `linux-headers-$(uname -r)`). Tools: `execsnoop`, `opensnoop`, `biolatency`, `tcpconnect`, `tcpretrans`, `profile`.
- **bpftool** — inspect loaded programs/maps (`bpftool prog list`, `bpftool map list`).
- **libbpf + CO-RE** — compile once, run everywhere via `vmlinux.h` BTF.

## bpftrace Examples
```bash
bpftrace -e 'tracepoint:syscalls:sys_enter_openat { printf("%s %s\n", comm, str(args->filename)); }'
bpftrace -e 'kprobe:do_sys_open { @[comm] = count(); }'
bpftrace -e 'profile:hz:99 { @[stack] = count(); }'
bpftrace -e 'kprobe:vfs_read { @bytes[comm] = sum(args->count); }'
```

## bcc Tools
```bash
execsnoop            # new processes as they exec
opensnoop            # files being opened
biolatency 1         # disk I/O latency histogram
tcplife              # TCP session lifetimes
cpudist              # CPU-time distribution per process
memleak -p $(pidof myapp)   # user-space leak detection
```

## bpftool
```bash
bpftool prog list
bpftool map list
bpftool map dump id <map_id>
bpftool prog pin id <id> /sys/fs/bpf/my_prog
```

## Networking (XDP / TC)
```bash
# Load XDP program (root)
ip link set dev eth0 xdp obj xdp_drop.o sec xdp
ip link show dev eth0

# TC classifier (root)
tc qdisc add dev eth0 ingress
tc filter add dev eth0 ingress bpf da obj tc_filter.o sec classifier
```

## Development (libbpf + clang)
```bash
# Generate BTF vmlinux.h
bpftool btf dump file /sys/kernel/btf/vmlinux format c > vmlinux.h
# Compile
clang -target bpf -O2 -g -c prog.c -o prog.o
```

Programs must be licensed (`char LICENSE[] SEC("license") = "GPL";`) and declare maps with `struct { __uint(type, BPF_MAP_TYPE_HASH); ... } my_map SEC(".maps");`.

## Resources
- https://ebpf.io — official site
- https://www.brendangregg.com/ebpf.html — BPF Performance Tools
- https://docs.cilium.io — Cilium (eBPF networking/security)
