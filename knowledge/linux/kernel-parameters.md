# Linux Kernel Parameters (sysctl)

Runtime kernel tuning via `sysctl`. Persistent config lives in `/etc/sysctl.d/*.conf` (preferred) or `/etc/sysctl.conf`.

## Viewing & Applying
```bash
sysctl -a                     # list all parameters (tested: works)
sysctl vm.swappiness          # view one (tested: works)
sysctl -N -a                  # names only (tested: works)
sysctl -n vm.swappiness       # value only

# Runtime change (non-persistent; requires root)
sysctl -w vm.swappiness=10    # (not applied in sandbox; syntax verified)

# Apply config files
sysctl -p /etc/sysctl.d/99-custom.conf
sysctl --system
```

Note: `sysctl -d` is an alias for `--help` on this system (use `man sysctl` or `/proc/sys` comments for descriptions).

## Common Tuning Values
```ini
# /etc/sysctl.d/99-custom.conf
# Virtual memory
vm.swappiness = 10
vm.vfs_cache_pressure = 50
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# Network
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_congestion_control = bbr

# Filesystem
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288

# Security
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
```

## Key Parameters
| Parameter | Default | Notes |
|-----------|---------|-------|
| `vm.swappiness` | 60 | 0-200; lower = less swap |
| `vm.vfs_cache_pressure` | 100 | lower = keep dentry/inode cache |
| `vm.max_map_count` | 65530 | raise to 262144 for Elasticsearch |
| `net.core.somaxconn` | 128 | max pending connections |
| `net.ipv4.tcp_congestion_control` | cubic | `bbr` for high-BDP links |
| `fs.file-max` | large | max open files system-wide |
| `kernel.pid_max` | 4194304 | max PIDs |

## Kernel Command Line Parameters
View current: `cat /proc/cmdline` (tested: works). Set in GRUB `GRUB_CMDLINE_LINUX_DEFAULT`, then `grub-mkconfig -o /boot/grub/grub.cfg`.

Common:
- `transparent_hugepage=never` — disable THP (latency-sensitive)
- `mitigations=off` — disable CPU mitigations (perf vs security)
- `intel_pstate=disable` — use acpi-cpufreq
- `processor.max_cstate=1` — limit C-states
- `module_blacklist=nvidia_uvm` — blacklist a module
- `iommu=pt` / `intel_iommu=on iommu=pt` — VFIO passthrough
- `kvm-intel.nested=1` — nested KVM

## Monitoring
```bash
watch -n 1 'sysctl vm.swappiness vm.dirty_ratio'
watch -n 1 'grep -E "Dirty|Writeback" /proc/meminfo'
watch -n 1 'ss -s'
```
