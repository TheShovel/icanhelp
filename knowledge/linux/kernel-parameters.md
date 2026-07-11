# Linux Kernel Parameters (sysctl)

## Viewing Parameters

```bash
# View all parameters
sysctl -a

# View specific parameter
sysctl vm.swappiness

# View with descriptions
sysctl -a | less
```

## Persistent Configuration

```bash
# /etc/sysctl.d/99-custom.conf (recommended location)
vm.swappiness = 10
vm.vfs_cache_pressure = 50
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
vm.overcommit_memory = 1
vm.overcommit_ratio = 50

# Network
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_max_tw_buckets = 2000000
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.ipv4.tcp_mtu_probing = 1

# Security
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
kernel.yama.ptrace_scope = 1
kernel.unprivileged_bpf_disabled = 1
kernel.kexec_load_disabled = 1
kernel.sysrq = 0
kernel.perf_event_paranoid = 3
kernel.kptr_restrict = 2
kernel.dmesg_restrict = 1

# Filesystem
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 8192
fs.nr_open = 1048576

# Virtual memory
vm.max_map_count = 262144
```

```bash
# Apply changes
sysctl --system

# Or apply single file
sysctl -p /etc/sysctl.d/99-custom.conf
```

## Key Parameters by Category

### Virtual Memory

| Parameter | Default | Recommended | Description |
|-----------|---------|-------------|-------------|
| `vm.swappiness` | 60 | 10 (desktop), 1 (server) | Swap aggressiveness (0-200) |
| `vm.vfs_cache_pressure` | 100 | 50 | Reclaim dentry/inode cache |
| `vm.dirty_ratio` | 20 | 15 | Max dirty memory % before write |
| `vm.dirty_background_ratio` | 10 | 5 | Background writeback threshold |
| `vm.dirty_expire_centisecs` | 3000 | 1500 | Max age of dirty data (centisecs) |
| `vm.dirty_writeback_centisecs` | 500 | 250 | Writeback interval |
| `vm.overcommit_memory` | 0 | 1 | 0=heuristic, 1=always, 2=never |
| `vm.overcommit_ratio` | 50 | 50 | % of RAM for overcommit (mode 2) |
| `vm.max_map_count` | 65530 | 262144 | Max memory map areas (Elasticsearch needs 262144) |
| `vm.min_free_kbytes` | auto | 65536 | Minimum free RAM (KB) |

### Network Stack

| Parameter | Default | Recommended | Description |
|-----------|---------|-------------|-------------|
| `net.core.somaxconn` | 128 | 65535 | Max pending connections |
| `net.core.netdev_max_backlog` | 1000 | 5000 | Packet queue per interface |
| `net.core.rmem_max` | 212992 | 67108864 | Max receive buffer |
| `net.core.wmem_max` | 212992 | 67108864 | Max send buffer |
| `net.ipv4.tcp_rmem` | 4096 87380 6291456 | 4096 87380 67108864 | TCP receive buffer (min/default/max) |
| `net.ipv4.tcp_wmem` | 4096 16384 4194304 | 4096 65536 67108864 | TCP send buffer |
| `net.ipv4.tcp_fin_timeout` | 60 | 15 | TIME_WAIT timeout (seconds) |
| `net.ipv4.tcp_tw_reuse` | 0 | 1 | Reuse TIME_WAIT sockets |
| `net.ipv4.tcp_fastopen` | 1 | 3 | TCP Fast Open (1=client, 2=server, 3=both) |
| `net.ipv4.tcp_max_syn_backlog` | 128 | 8192 | Max SYN backlog |
| `net.ipv4.tcp_slow_start_after_idle` | 1 | 0 | Disable slow start after idle |
| `net.ipv4.tcp_mtu_probing` | 0 | 1 | Enable MTU probing |
| `net.ipv4.ip_forward` | 0 | 1 | Enable IP forwarding |
| `net.ipv4.conf.all.rp_filter` | 1 | 1 | Reverse path filtering |
| `net.ipv4.conf.all.accept_redirects` | 1 | 0 | Disable ICMP redirects |
| `net.ipv4.conf.all.send_redirects` | 1 | 0 | Don't send redirects |
| `net.ipv6.conf.all.disable_ipv6` | 0 | 1 | Disable IPv6 (if not needed) |

### Filesystem

| Parameter | Default | Recommended | Description |
|-----------|---------|-------------|-------------|
| `fs.file-max` | 9223372036854775807 | 2097152 | Max open files system-wide |
| `fs.nr_open` | 1048576 | 1048576 | Max files per process |
| `fs.inotify.max_user_watches` | 8192 | 524288 | Max inotify watches (IDE, webpack) |
| `fs.inotify.max_user_instances` | 128 | 8192 | Max inotify instances |
| `fs.aio-max-nr` | 65536 | 1048576 | Max async I/O operations |

### Kernel Security

| Parameter | Default | Recommended | Description |
|-----------|---------|-------------|-------------|
| `kernel.dmesg_restrict` | 0 | 1 | Restrict dmesg to root |
| `kernel.kptr_restrict` | 0 | 2 | Hide kernel pointers |
| `kernel.yama.ptrace_scope` | 0 | 1 | Restrict ptrace |
| `kernel.unprivileged_bpf_disabled` | 0 | 1 | Disable unprivileged eBPF |
| `kernel.kexec_load_disabled` | 0 | 1 | Disable kexec |
| `kernel.sysrq` | 16 | 0 | Disable SysRq (or 4 for limited) |
| `kernel.perf_event_paranoid` | 2 | 3 | Restrict perf events |
| `kernel.kptr_restrict` | 0 | 2 | Hide kernel symbols |
| `kernel.modules_disabled` | 0 | 1 | Disable module loading (after boot) |

### Scheduler & CPU

| Parameter | Default | Recommended | Description |
|-----------|---------|-------------|-------------|
| `kernel.sched_migration_cost_ns` | 500000 | 5000000 | Migration cost (ns) |
| `kernel.sched_autogroup_enabled` | 1 | 0 | Disable auto task groups (servers) |
| `kernel.sched_latency_ns` | 24000000 | 24000000 | Scheduler latency target |
| `kernel.sched_min_granularity_ns` | 3000000 | 3000000 | Min granularity |
| `kernel.watchdog_thresh` | 10 | 30 | Hard lockup detector threshold |

## Runtime Tuning

```bash
# View current value
sysctl vm.swappiness

# Change at runtime (non-persistent)
sysctl -w vm.swappiness=10

# View parameter description
sysctl -d vm.swappiness

# List all parameters matching pattern
sysctl -a | grep tcp_

# Show only names (no values)
sysctl -a -N
```

## Kernel Command Line Parameters

```bash
# View current cmdline
cat /proc/cmdline

# Common boot parameters
# /etc/default/grub -> GRUB_CMDLINE_LINUX_DEFAULT="..."

# Common parameters
# mitigations=off              # Disable CPU mitigations (performance)
# mitigations=auto             # Default, auto-detect
# transparent_hugepage=never   # Disable THP (latency-sensitive)
# transparent_hugepage=madvise # THP only for MADV_HUGEPAGE
# default_hugepagesz=1G hugepagesz=1G hugepages=16  # 1G hugepages
# intel_pstate=disable         # Disable Intel p-state (use acpi-cpufreq)
# amd_pstate=active            # Enable AMD p-state (kernel 6.3+)
# processor.max_cstate=1       # Limit C-states (latency)
# idle=poll                    # Poll idle (lowest latency)
# mce=ignore_ce                # Ignore correctable memory errors
# module_blacklist=module_name # Blacklist kernel module
# slab_nomerge                 # Disable slab merging (security)
# slub_debug=FZP               # SLUB debugging
# page_poison=1                # Page poisoning (security)
# init_on_alloc=1 init_on_free=1  # Zero memory on alloc/free
# slab_max_order=0             # Disable high-order allocations
# vsyscall=none                # Disable vsyscall mapping
# kvm-intel.nested=1           # Enable nested KVM (Intel)
# kvm-amd.nested=1             # Enable nested KVM (AMD)
# iommu=pt                     # Passthrough mode (VFIO)
# intel_iommu=on iommu=pt      # Intel VT-d
# amd_iommu=on iommu=pt        # AMD-Vi
```

```bash
# Update GRUB and regenerate
grub2-mkconfig -o /boot/grub2/grub.cfg  # Fedora/RHEL
update-grub                              # Debian/Ubuntu
```

## Viewing Runtime Values

```bash
# All parameters with descriptions
sysctl -a --values

# Specific subsystem
sysctl net.ipv4
sysctl vm
sysctl kernel
sysctl fs

# Show only names
sysctl -N -a

# Show with descriptions
sysctl -a -d
```

## Persistent Config Locations

```
/etc/sysctl.conf                    # Main (legacy)
/etc/sysctl.d/*.conf                # Drop-in directory (preferred)
/usr/lib/sysctl.d/*.conf            # Vendor defaults
/run/sysctl.d/*.conf                # Runtime defaults
```

Load order: `/etc/sysctl.d/*.conf` → `/run/sysctl.d/*.conf` → `/usr/lib/sysctl.d/*.conf` → `/etc/sysctl.conf`

## Performance Tuning Profiles

```bash
# tuned-adm profiles (RHEL/Fedora)
tuned-adm list
tuned-adm profile throughput-performance  # Throughput
tuned-adm profile latency-performance     # Latency
tuned-adm profile virtual-guest           # VM guest
tuned-adm profile powersave               # Power saving

# Check active profile
tuned-adm active
```

## Monitoring Current Values

```bash
# Watch specific parameters
watch -n 1 'sysctl vm.swappiness vm.dirty_ratio vm.dirty_background_ratio'

# Monitor dirty pages
watch -n 1 'grep -E "Dirty|Writeback" /proc/meminfo'

# Monitor TCP connections
watch -n 1 'ss -s'

# Monitor network buffers
watch -n 1 'cat /proc/net/sockstat'
```

## Applying Changes Safely

```bash
# Test parameter change
sysctl -w vm.swappiness=10
# Verify effect
# ... test workload ...
# Make permanent if satisfied
echo "vm.swappiness = 10" > /etc/sysctl.d/99-swappiness.conf
sysctl --system
```

## Common Tuning Scenarios

### High-Performance Web Server
```bash
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 30000
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_fin_timeout = 10
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fastopen = 3
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
```

### Database Server (PostgreSQL, MySQL, MongoDB)
```bash
vm.swappiness = 1
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
vm.max_map_count = 262144
vm.dirty_expire_centisecs = 1500
vm.dirty_writeback_centisecs = 100
fs.file-max = 2097152
fs.nr_open = 1048576
kernel.sched_autogroup_enabled = 0
```

### Low-Latency / Real-Time
```bash
kernel.sched_latency_ns = 10000000
kernel.sched_min_granularity_ns = 1000000
kernel.sched_migration_cost_ns = 5000000
kernel.sched_autogroup_enabled = 0
vm.swappiness = 1
vm.dirty_ratio = 10
vm.dirty_background_ratio = 3
```

### High-Throughput Network (10Gbps+)
```bash
net.core.netdev_max_backlog = 100000
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.core.rmem_default = 31457280
net.core.wmem_default = 31457280
net.ipv4.tcp_rmem = 8192 65536 67108864
net.ipv4.tcp_wmem = 8192 65536 67108864
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_timestamps = 1
net.ipv4.tcp_sack = 1
net.core.dev_weight = 64
```

## Verification Commands

```bash
# Check all applied settings
sysctl --system 2>&1 | grep -E "(error|Error)"

# Verify specific settings
sysctl -p /etc/sysctl.d/99-custom.conf

# Show differences from defaults
sysctl -a | diff -u /usr/lib/sysctl.d/00-system.conf - | head -100
```