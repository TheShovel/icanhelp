# cgroups (Control Groups)

cgroup v2 (unified hierarchy) is the default on systemd systems. Check version: `stat -fc %T /sys/fs/cgroup` → `cgroup2fs` = v2.

## Check Version & State
```bash
stat -fc %T /sys/fs/cgroup    # cgroup2fs = v2 (tested: works)
cat /proc/cgroups             # available controllers
cat /proc/self/cgroup         # current process cgroup
cat /sys/fs/cgroup/cgroup.subtree_control   # enabled controllers (tested: works)
```

## systemd Integration
```bash
sys svc status service        # shows cgroup + recent logs
systemctl show service | grep -E "CPUQuota|Memory|Tasks"   # limits
systemd-cgls                   # hierarchy tree (tested: works)
systemd-cgtop                  # real-time top (tested: works; no --no-pager flag)
systemd-cgtop --iterations=1   # single snapshot (tested: works)
```

Run a command with limits (transient scope):
```bash
systemd-run --scope -p CPUQuota=50% command
systemd-run --scope -p MemoryMax=1G command
systemd-run --scope -p TasksMax=500 command
```

Set/clear a service limit persistently:
```bash
systemctl set-property nginx.service CPUQuota=25%
systemctl set-property nginx.service MemoryMax=512M
systemctl set-property nginx.service CPUQuota=    # reset
```

## Service / Slice Limits
```ini
# /etc/systemd/system/myapp.service
[Service]
CPUQuota=50%          # 50% of one core; 200% = 2 cores
MemoryMax=1G          # hard limit
MemoryHigh=800M       # reclaim threshold
TasksMax=500
IOWeight=50

# /etc/systemd/system/myapp.slice
[Slice]
CPUQuota=200%
MemoryMax=4G
```

## Controllers (v2)
- **CPU**: `CPUQuota=50%`, `CPUWeight=100` (1-10000), `AllowedCPUs=0,1`
- **Memory**: `MemoryMax`, `MemoryHigh`, `MemorySwapMax`
- **IO**: `IOWeight`, `IOReadBandwidthMax="/dev/sda 10M"`, `IOWriteBandwidthMax="/dev/sda 5M"`
- **PIDs**: `TasksMax=1000`
- **Devices**: `DevicePolicy=closed`, `DeviceAllow="/dev/sdb rwm"`
- **cpuset**: `AllowedCPUs=0,1`, `MemoryNodes=0`
- **freezer**: `systemctl freeze service` / `systemctl thaw service`

## Manual cgroup v2
```bash
mkdir /sys/fs/cgroup/myapp
echo $PID > /sys/fs/cgroup/myapp/cgroup.procs
cat /sys/fs/cgroup/myapp/cpu.stat
cat /sys/fs/cgroup/myapp/memory.current
cat /sys/fs/cgroup/myapp/io.stat
```

## Monitoring & Troubleshooting
```bash
systemctl show nginx | grep -E "(Memory|CPU|Tasks)"
cat /sys/fs/cgroup/system.slice/nginx.service/memory.current
journalctl -k | grep -i "oom_reaper\|killed process"
cat /proc/$PID/cgroup        # which cgroup a process is in
```

## Force v2 (if needed)
GRUB `GRUB_CMDLINE_LINUX_DEFAULT`: `systemd.unified_cgroup_hierarchy=1` or `cgroup_no_v1=all`. Then `grub-mkconfig -o /boot/grub/grub.cfg`.

## Containers
```bash
docker run --memory=500m --cpus=0.5 nginx
docker inspect nginx | grep Cgroup
```
