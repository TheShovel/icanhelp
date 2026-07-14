# systemd-oomd - Out of Memory Daemon

## Overview
- `systemd-oomd` — systemd out-of-memory daemon
- Monitors memory pressure and kills processes
- Uses cgroup memory events for detection
- Available in systemd v247+

## Installation

### Enable systemd-oomd
```bash
systemctl enable --now systemd-oomd

# Check status
systemctl status systemd-oomd

# Check version (needs 247+)
systemd --version
```

### Default Configuration
- Installed at `/usr/lib/systemd/oomd.conf`
- Override in `/etc/systemd/oomd.conf`
- Or use drop-ins in `/etc/systemd/oomd.conf.d/`

## Configuration

### oomd.conf Options
```
# /etc/systemd/oomd.conf
[OOM]
DefaultMemoryPressureDurationSec=30s
DefaultMemoryPressureThresholdSec=30s
DefaultMemoryPressureThresholdForIgnoredProcesses=50.0
```

### Memory Pressure
- `DefaultMemoryPressureDurationSec=30s` — duration before kill
- Monitors memory.pressure_level in cgroup v1
- Or memory.events in cgroup v2

### Pressure Thresholds
- Percentage of memory under pressure
- Configurable per process or group
- Default 50% for ignored processes (desktop apps)

## Memory Pressure Events

### Check Pressure
```bash
# cgroup v2
cat /sys/fs/cgroup/system.slice/memory.events

# cgroup v1
cat /sys/fs/cgroup/memory/memory.pressure_level

# Monitor events
systemd-analyze oom  # shows OOM events
```

### Pressure Levels
- low — available memory but reclaim needed
- medium — actively reclaiming
- critical — near OOM

## systemd-oomd Controls

### Enable/Disable
- `systemctl enable --now systemd-oomd` — enable
- `systemctl disable --now systemd-oomd` — disable
- `systemctl mask systemd-oomd` — prevent start

### Service Management
- `systemctl reload systemd-oomd` — reload config
- `systemctl restart systemd-oomd` — restart
- `oomctl` — control utility

### oomctl Commands
- `oomctl` — show configuration
- `oomctl --check` — check if running
- `oomctl --dump` — dump internal state

## Default Monitors

### Built-in Monitors
- Desktop session monitors (user apps)
- systemd service monitors
- User scope monitors

### Monitor Types
- `user` — user sessions
- `system` — system services
- `root` — root system.slice

### Default Settings
```
# System services
DefaultMemoryPressureDurationSec=10s
DefaultMemoryPressureThreshold=90.0%

# User sessions
DefaultMemoryPressureDurationSec=30s
DefaultMemoryPressureThreshold=50.0%
```

## Custom Monitors

### oomd Monitor Files
- `/etc/systemd/oomd.conf.d/*.conf` — additional monitors
- Use `Monitor` section for custom rules

### Custom Monitor Example
```ini
# /etc/systemd/oomd.conf.d/database.conf
[Monitor]
Type=user
User=mysql
MemoryPressureDurationSec=60s
MemoryPressureThreshold=70.0
```

## Process Selection

### Kill Candidates
- Memory-hungry processes
- Processes with high RSS
- Not root or systemd processes
- Not in ignored groups

### Ignored Processes
- systemd services (configurable)
- root processes
- Real-time processes
- Processes with OOMScoreAdjust=-1000

### OOM Score
- `/proc/*/oom_score_adj` — adjustment
- `-1000` — immune to OOM
- `1000` — likely to be killed
- systemd services: 0 by default

### Set OOM Score
```bash
# In service file
[Service]
OOMScoreAdjust=500  # More likely to be killed

# Or manually
echo 500 > /proc/1234/oom_score_adj
```

## Memory Pressure Monitoring

### Check Current Pressure
```bash
# Monitor pressure
cat /sys/fs/cgroup/memory.pressure_level

# Continuous monitoring
while true; do
    cat /sys/fs/cgroup/system.slice/memory.events
    sleep 1
done
```

### Pressure Metrics
- `low` — memory available but reclaim needed
- `medium` — actively reclaiming pages
- `critical` — near OOM condition

## Integration with systemd

### Service Integration
```ini
# /etc/systemd/system/myapp.service
[Service]
OOMScoreAdjust=-500  # Less likely to be killed
MemoryHigh=4G        # Start reclaim at 4G
MemoryMax=8G         # Hard limit
```

### Slice Configuration
```ini
# /etc/systemd/system/omg.slice
[Slice]
MemoryHigh=512M
MemoryMax=1G
```

### User Services
```ini
# ~/.config/systemd/user/myapp.service
[Service]
OOMScoreAdjust=100
```

## systemd-oomd Events

### View Events
```bash
# In journal
journalctl -u systemd-oomd -f

# Filter OOM events
journalctl | grep -i "oom\|kill"

# Via systemd-analyze
systemd-analyze oom
```

### Event Information
- PID killed
- Process name
- Memory usage
- Trigger reason

## Troubleshooting

### Check Configuration
```bash
# Show config
oomctl

# Check if enabled
systemctl is-enabled systemd-oomd

# Check active monitors
oomctl --dump
```

### Debug Pressure
```bash
# Monitor pressure metrics
cat /sys/fs/cgroup/system.slice/memory.events

# Check for events
journalctl -u systemd-oomd --since "1 hour ago"

# Manual test
mkdir /tmp/test-cgroup
echo $$ > /tmp/test-cgroup/cgroup.procs
```

### Disable for Debugging
```bash
# Temporarily stop
systemctl stop systemd-oomd

# Or mask to prevent start
systemctl mask systemd-oomd

# Re-enable
systemctl unmask systemd-oomd
systemctl start systemd-oomd
```

## Performance Impact

### Monitoring Overhead
- Minimal impact (<1% CPU)
- Uses existing cgroup events
- No polling overhead

### Memory Overhead
- ~128KB memory
- Small per-cgroup overhead
- Negligible for most systems

## Alternative: earlyoom

### Compare to earlyoom
- `earlyoom` — user-space OOM killer
- `systemd-oomd` — integrated with systemd
- earlyoom uses RSS only
- systemd-oomd uses pressure levels

### earlyoom Setup
```bash
# Install
apt install earlyoom

# Configuration
# /etc/earlyoom.conf
EARLYOOM_DISABLE=0
EARLYOOM_MODE=fill
EARLYOOM_PERCENT=5
EARLYOOM_USERONLY=1
```

## Configuration Examples

### Conservative Settings
```
# /etc/systemd/oomd.conf
[OOM]
DefaultMemoryPressureDurationSec=60s
DefaultMemoryPressureThreshold=90.0%
```

### Aggressive Settings
```
# /etc/systemd/oomd.conf
[OOM]
DefaultMemoryPressureDurationSec=10s
DefaultMemoryPressureThreshold=30.0%
```

### Database Server
```ini
# /etc/systemd/oomd.conf.d/database.conf
[Monitor]
Type=user
User=mysql
MemoryPressureDurationSec=120s
MemoryPressureThreshold=95.0%
```

### Desktop Apps
```ini
# /etc/systemd/oomd.conf.d/desktop.conf
[Monitor]
Type=user
User=alice
MemoryPressureDurationSec=30s
MemoryPressureThreshold=40.0%
```

## Integration Testing

### Simulate Pressure
```bash
# Use systemd-run with limits
systemd-run --scope -p MemoryMax=100M stress --vm 1 --vm-bytes 200M

# Watch for kills
journalctl -f | grep -i kill
```

### Check Results
```bash
# See if process was killed
ps aux | grep stress

# Check OOM events
systemd-analyze oom
```

## Distribution Notes

### Debian/Ubuntu
- systemd-oomd package separate
- Not enabled by default in older versions

### RHEL/Fedora
- Enabled by default since systemd v247
- Part of systemd package

### Arch Linux
- Available in systemd package
- Manual enable required