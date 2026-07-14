# cgroups (Control Groups) v1 and v2

## cgroups Overview
- cgroup v1 — legacy hierarchy (multiple controllers)
- cgroup v2 — unified hierarchy (single mount)
- systemd uses cgroup v2 by default (since v226)
- Controllers: cpu, memory, io, pids, cpuset, devices, freezer

## Check cgroup Version
- `stat -fc %T /sys/fs/cgroup` — shows cgroup type
- `ls /sys/fs/cgroup/` — if single mount, it's v2
- `cat /proc/cgroups` — available controllers
- `cat /proc/self/cgroup` — current process cgroup

## systemd Integration

### Systemd Units
- `systemctl status service` — shows cgroup info
- `systemctl show service | grep CPUQuota` — check limits
- `systemd-run --scope -p CPUQuota=50% command` — run with limits
- `systemd-run --scope -p MemoryMax=1G command` — memory limit

### Service Limits
```ini
# /etc/systemd/system/myapp.service
[Service]
ExecStart=/usr/bin/myapp
CPUQuota=50%
MemoryMax=1G
TasksMax=500
IOWeight=50
```

### Slice Limits
```ini
# /etc/systemd/system/myapp.slice
[Slice]
CPUQuota=200%
MemoryMax=4G
TasksMax=2000
```

## cgroups v2 Commands

### Check Status
- `systemd-cgls` — show hierarchy tree
- `systemd-cgls scope` — only scopes
- `systemd-cgls service` — only services
- `systemd-cgtop` — real-time top
- `systemd-cgtop --iterations=1` — single snapshot

### Property Management
- `systemctl set-property service Property=value` — set limit
- `systemctl show service --property=CPUQuota` — get limit
- `systemctl show service` — all properties

### Examples
```bash
# Set CPU limit
systemctl set-property nginx.service CPUQuota=25%

# Set memory
systemctl set-property nginx.service MemoryMax=512M

# Reset to default
systemctl set-property nginx.service CPUQuota=
```

## cgroups v1 Commands

### Mount Points
- `/sys/fs/cgroup/cpu/` — CPU controller
- `/sys/fs/cgroup/memory/` — memory controller
- `/sys/fs/cgroup/blkio/` — block I/O
- `/sys/fs/cgroup/cpuset/` — CPU sets
- `/sys/fs/cgroup/devices/` — device access
- `/sys.fs_cgroup/freezer/` — freeze/unfreeze

### Manual Management
```bash
# Create cgroup
mkdir /sys/fs/cgroup/cpu/myapp

# Set CPU limit
echo 50000 > /sys/fs/cgroup/cpu/myapp/cpu.cfs_quota_us  # 50% = 50000/100000

# Add process
echo $PID > /sys/fs/cgroup/cpu/myapp/cgroup.procs

# Check
cat /sys/fs/cgroup/cpu/myapp/cpu.stat
```

## CPU Controllers

### CPU Quota
- `CPUQuota=50%` — limit to 50% of one core
- `CPUQuota=200%` — limit to 2 cores
- `CPUWeight=100` — relative weight (1-10000)

### CPU Set
- `CPUAffinity=0-3` — in service file
- `cpuset.cpus="0,1"` — in cgroup
- `cpuset.mems="0"` — NUMA nodes

### Examples
```bash
# systemd-run with CPU limit
systemd-run --scope -p CPUQuota=25% stress

# Manual CPU cgroup v1
mkdir /sys/fs/cgroup/cpu/limited
echo 25000 > /sys/fs/cgroup/cpu/limited/cpu.cfs_quota_us
stress & echo $! > /sys/fs/cgroup/cpu/limited/cgroup.procs
```

## Memory Controllers

### Memory Limits
- `MemoryMax=1G` — hard limit
- `MemoryHigh=800M` — reclaim threshold
- `MemorySwapMax=512M` — swap limit
- `MemoryLimit=2G` — alias for MemoryMax (deprecated)

### Memory Stats
- `/sys/fs/cgroup/memory/memory.usage_in_bytes`
- `/sys/fs/cgroup/memory/memory.stat`
- `memory.current` — v2 current usage
- `memory.peak` — v2 peak usage

### Examples
```bash
# systemd-run with memory
systemd-run --scope -p MemoryMax=512M -p MemorySwapMax=0 myapp

# Check memory stats
cat /sys/fs/cgroup/memory/current.scope/memory.stat
# cache, rss, rss_huge, mapped_file, pgsteal, etc.
```

## I/O Controllers

### I/O Weight
- `IOWeight=50` — relative weight
- `StartupIOWeight=100` — startup priority
- `IODeviceWeight="/dev/sda 200"` — device-specific
- `IOReadBandwidthMax="/dev/sda 10M"` — read limit
- `IOWriteBandwidthMax="/dev/sda 5M"` — write limit

### I/O Stats
- `io.stat` — v2 I/O stats
- `/sys/fs/cgroup/blkio/blkio.io_serviced` — v1
- `/sys/fs/cgroup/blkio/blkio.io_service_bytes` — bytes by operation

### Examples
```bash
# systemd-run with I/O limits
systemd-run --scope -p IOWriteBandwidthMax="/dev/sdb 1M" myapp

# Check I/O
cat /sys/fs/cgroup/io.scope/io.stat
```

## PID Controllers

### PID Limits
- `TasksMax=1000` — max processes/threads
- `TasksMin=100` — reserved slots (v2)

### Examples
```bash
# systemd-run with pid limit
systemd-run --scope -p TasksMax=100 stress --fork 200

# Check current
cat /sys/fs/cgroup/pids.current
```

## Device Controllers

### Device Access
- `DeviceAllow="/dev/sda rwm"` — device access
- `DevicePolicy=closed` — deny all by default
- `DevicePolicy=strict` — systemd-managed only

### Examples
```ini
[Service]
DevicePolicy=closed
DeviceAllow="/dev/sdb rwm"
DeviceAllow="/dev/input/event*"
```

## cpuset Controllers

### CPU Sets
- `cpuset.cpus="0-3"` — CPUs 0,1,2,3
- `cpuset.mems="0"` — NUMA node 0

### Examples
```bash
# systemd-run with cpuset
systemd-run --scope -p AllowedCPUs=0,1 -p MemoryNodes=0 myapp

# Manual cpuset
mkdir /sys/fs/cgroup/cpuset/myapp
echo 0-1 > /sys/fs/cgroup/cpuset/myapp/cpuset.cpus
echo 0 > /sys/fs/cgroup/cpuset/myapp/cpuset.mems
```

## freezer Controllers

### Freeze/Unfreeze
- `systemctl freeze service` — freeze process
- `systemctl thaw service` — unfreeze
- `echo frozen > /sys/fs/cgroup/freezer/myapp/freezer.state` — manual

### Examples
```bash
# Freeze process tree
systemctl freeze nginx.service

# Check status
cat /sys/fs/cgroup/freezer/nginx.service/cgroup.freeze
# 0 = thawed, 1 = frozen
```

## systemd-run Examples

### One-shot Commands
```bash
# Run with resource limits
systemd-run --scope -p MemoryMax=500M -p CPUQuota=25% command

# Run in transient service
systemd-run --unit=mytask.service command

# Run with nice level
systemd-run --scope -p CPUSchedulingPolicy=idle command

# Run with I/O priority
systemd-run --scope -p IOSchedulingClass=3 -p IOSchedulingPriority=7 command
```

### Interactive
```bash
# Interactive with limits
systemd-run --scope --pty -p MemoryMax=1G bash
```

## cgroup v2 Subtrees

### Create Subgroup
```bash
# Create nested group
mkdir /sys/fs/cgroup/myapp
echo $PID > /sys/fs/cgroup/myapp/cgroup.procs

# Add child group
mkdir /sys/fs/cgroup/myapp/backend
```

### Delegation
```bash
# Delegate to user
echo +memory +cpu > /sys/fs/cgroup/user.slice/user-$UID.slice/cgroup.subtree_control
```

## Monitoring

### cgtop Alternative
```bash
# systemd-cgtop equivalent
watch -n 1 'systemd-cgls | head -30'

# Detailed stats
find /sys/fs/cgroup -name memory.current -exec sh -c 'echo "{}:"; cat "{}"' \;
```

### Script Monitoring
```bash
# Check all services
for svc in /sys/fs/cgroup/system.slice/*.service; do
    echo "$svc: $(cat $svc/memory.current 2>/dev/null || echo N/A)"
done
```

## Troubleshooting

### Check Limits
```bash
# Current limits
systemctl show nginx | grep -E "(Memory|CPU|Tasks)"

# Actual usage
cat /sys/fs/cgroup/system.slice/nginx.service/memory.current

# OOM kills
journalctl -k | grep -i "oom_reaper\|killed process"
```

### Common Issues
```bash
# Process not respecting limits
# Check which cgroup
cat /proc/$PID/cgroup

# Check controller enabled
mount | grep cgroup

# Check tree control
cat /sys/fs/cgroup/cgroup.subtree_control
```

### Memory Pressure
```bash
# Check memory events
cat /sys/fs/cgroup/system.slice/memory.events

# Events: low, medium, critical, etc.
```

## Migration v1 to v2

### Unified Hierarchy
- v2: single mount at `/sys/fs/cgroup`
- v1: multiple mounts per controller
- systemd manages migration automatically

### Compatibility
- `systemd.cgrouptop` — uses unified
- Legacy tools still work on v2 (with warnings)
- `/etc/cgconfig.conf` still parsed by some tools

### Force v2
```bash
# Kernel cmdline
systemd.unified_cgroup_hierarchy=1

# Or disable v1 controllers
GRUB_CMDLINE_LINUX="cgroup_no_v1=all"
```

## Configuration Files

### systemd Defaults
```
# /etc/systemd/system.conf
DefaultMemoryMax=infinity
DefaultTasksMax=infinity
DefaultCPUQuota=
```

### Default Limits
```ini
# /etc/systemd/system.conf.d/limits.conf
[Manager]
DefaultMemoryMax=4G
DefaultTasksMax=2000
```

## Docker/LXC Integration

### Docker
```bash
# Docker uses cgroups
docker run --memory=500m --cpus=0.5 nginx

# Check container cgroups
docker inspect nginx | grep Cgroup
```

### LXC
```bash
# LXC config
lxc.cgroup2.memory.max = 1G
lxc.cgroup2.cpu.max = 50000 100000
```