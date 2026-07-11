# Linux Systemd - Complete Guide

## Overview
systemd is the init system and service manager for modern Linux distributions. It provides parallel startup, on-demand activation, and dependency-based service control.

## Core Concepts

### Unit Types
| Type | Extension | Purpose |
|------|-----------|---------|
| Service | `.service` | Daemons, processes |
| Socket | `.socket` | IPC, network sockets |
| Device | `.device` | Kernel devices |
| Mount | `.mount` | Filesystem mount points |
| Automount | `.automount` | On-demand mounting |
| Swap | `.swap` | Swap files/partitions |
| Target | `.target` | Synchronization points |
| Path | `.path` | Path-based activation |
| Timer | `.timer` | Scheduled activation |
| Slice | `.slice` | Resource grouping |
| Scope | `.scope` | External processes |

### Unit File Locations (Priority Order)
```text
/etc/systemd/system/           # Admin overrides (highest)
/run/systemd/system/           # Runtime units
/usr/lib/systemd/system/       # Package units (lowest)
~/.config/systemd/user/        # User units
```

## Service Unit Configuration

### Basic Service
```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Application
Documentation=https://example.com/docs
After=network.target postgresql.service
Wants=postgresql.service
Requires=redis.service

[Service]
Type=simple
User=myapp
Group=myapp
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/bin/server
ExecStartPre=/opt/myapp/bin/migrate
ExecReload=/bin/kill -HUP $MAINPID
ExecStop=/bin/kill -TERM $MAINPID
Restart=on-failure
RestartSec=5
StartLimitIntervalSec=60
StartLimitBurst=3

# Environment
Environment=APP_ENV=production
EnvironmentFile=-/etc/myapp/config.env
EnvironmentFile=-/etc/myapp/secrets.env

# Security
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/myapp /var/log/myapp
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_BIND_SERVICE

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096
MemoryMax=512M
CPUQuota=200%

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=myapp

[Install]
WantedBy=multi-user.target
```

### Service Types
```ini
Type=simple          # Default: stays running, main process = service
Type=forking         # Traditional daemon: parent exits, child runs
Type=oneshot         # Runs once, exits (use RemainAfterExit=yes)
Type=dbus            # D-Bus service
Type=notify          # Sends READY=1 via sd_notify()
Type=idle            # Waits until all jobs dispatched
```

### Example: Forking Service (nginx)
```ini
[Service]
Type=forking
PIDFile=/run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t
ExecStart=/usr/sbin/nginx
ExecReload=/usr/sbin/nginx -s reload
ExecStop=/usr/sbin/nginx -s quit
```

### Example: Oneshot with RemainAfterExit
```ini
[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/bin/setup-firewall
ExecStop=/usr/local/bin/teardown-firewall
```

## Socket Activation

### Socket Unit
```ini
# /etc/systemd/system/myapp.socket
[Unit]
Description=MyApp Socket

[Socket]
ListenStream=8080
ListenStream=[::]:8080
Accept=yes
MaxConnections=100

[Install]
WantedBy=sockets.target
```

### Service Unit (Socket-Activated)
```ini
# /etc/systemd/system/myapp@.service
[Unit]
Description=MyApp Worker

[Service]
ExecStart=/opt/myapp/bin/worker
StandardInput=socket
```

## Timer Units (Cron Replacement)

### Basic Timer
```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily Backup

[Timer]
OnCalendar=daily
OnCalendar=*-*-* 02:30:00
Persistent=yes
RandomizedDelaySec=15m
AccuracySec=1h

[Install]
WantedBy=timers.target
```

### Calendar Expressions
```text
OnCalendar=*-*-* 00:00:00        # Daily midnight
OnCalendar=Mon *-*-* 00:00:00    # Weekly Monday midnight
OnCalendar=*-*-01 00:00:00       # Monthly 1st day
OnCalendar=*-*-* 02:00:00/30     # Every 30 minutes
OnCalendar=Mon..Fri 09:00:00     # Weekdays 9 AM
OnCalendar=Sat,Sun 10:00:00      # Weekends 10 AM
```

### Timer with Associated Service
```ini
# backup.service
[Unit]
Description=Backup Service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
```

```bash
# Enable and start
systemctl enable --now backup.timer
```

## Target Units (Runlevels)

### Common Targets
```text
multi-user.target      # Traditional runlevel 3 (text mode)
graphical.target       # Traditional runlevel 5 (GUI)
emergency.target       # Emergency shell
rescue.target          # Single-user mode
network-online.target  # Network fully configured
shutdown.target        # System shutdown
reboot.target          # System reboot
```

### Custom Target
```ini
# /etc/systemd/system/myapp.target
[Unit]
Description=MyApp Stack
Requires=myapp.service myapp-worker.service
After=myapp.service myapp-worker.service
```

## Drop-in Configuration (Overrides)

### Create Drop-in
```bash
systemctl edit myapp.service
# Creates /etc/systemd/system/myapp.service.d/override.conf
```

### Override Example
```ini
# /etc/systemd/system/myapp.service.d/override.conf
[Service]
MemoryMax=1G
CPUQuota=300%
Environment=DEBUG=1
```

## Resource Control (cgroups v2)

### CPU
```ini
[Service]
CPUQuota=200%           # 2 CPU cores
CPUShares=1024          # Relative weight (default 1024)
CPUAffinity=0 1         # Specific CPU cores
```

### Memory
```ini
[Service]
MemoryMax=512M          # Hard limit
MemoryHigh=400M         # Throttle threshold
MemorySwapMax=1G        # Swap limit
MemoryLimit=512M        # Legacy alias
```

### I/O
```ini
[Service]
IOWeight=100            # Relative I/O weight (10-1000)
IOReadBandwidthMax=/dev/sda 10M
IOWriteBandwidthMax=/dev/sda 5M
IOReadIOPSMax=/dev/sda 1000
IOWriteIOPSMax=/dev/sda 500
```

### Tasks
```ini
[Service]
TasksMax=4096           # Max tasks/threads
```

## Security Hardening

### Namespaces & Capabilities
```ini
[Service]
# Namespaces
PrivateTmp=yes          # Private /tmp
PrivateDevices=yes      # Private /dev
PrivateNetwork=yes      # No network access
PrivateUsers=yes        # User namespace
PrivateIPC=yes          # Private IPC
ProtectControlGroups=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectKernelLogs=yes

# Filesystem
ProtectSystem=strict    # Read-only /usr, /boot, /etc
ProtectHome=yes         # No access to /home, /root
ReadWritePaths=/var/lib/myapp /var/log/myapp
InaccessiblePaths=/secret/data
ReadOnlyPaths=/etc/myapp

# Capabilities
CapabilityBoundingSet=CAP_NET_BIND_SERVICE CAP_DAC_OVERRIDE
AmbientCapabilities=CAP_NET_BIND_SERVICE
NoNewPrivileges=yes

# System calls
SystemCallFilter=@system-service
SystemCallErrorNumber=EPERM
SystemCallArchitectures=native
```

### Seccomp Profile
```ini
[Service]
# Custom seccomp
SeccompProfile=/etc/myapp/seccomp.json
```

```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {"names": ["read", "write", "open", "close"], "action": "SCMP_ACT_ALLOW"},
    {"names": ["execve"], "action": "SCMP_ACT_ERRNO", "errno": "EPERM"}
  ]
}
```

## Systemd Commands

### Service Management
```bash
# Start/stop/restart
systemctl start myapp
systemctl stop myapp
systemctl restart myapp
systemctl reload myapp          # SIGHUP
systemctl reload-or-restart myapp

# Enable/disable (boot)
systemctl enable myapp
systemctl disable myapp
systemctl enable --now myapp    # Enable and start

# Status
systemctl status myapp
systemctl is-active myapp
systemctl is-enabled myapp
systemctl is-failed myapp

# List
systemctl list-units --type=service
systemctl list-units --state=failed
systemctl list-unit-files --type=service
```

### Logs (journald)
```bash
# Follow logs
journalctl -u myapp -f

# Since boot
journalctl -u myapp -b

# Time range
journalctl -u myapp --since "1 hour ago"
journalctl -u myapp --since "2024-01-15 10:00" --until "2024-01-15 11:00"

# Priority filter
journalctl -u myapp -p err
journalctl -u myapp -p 3          # errors and above

# Output format
journalctl -u myapp -o json
journalctl -u myapp -o short-precise

# Disk usage
journalctl --disk-usage
journalctl --vacuum-size=100M
journalctl --vacuum-time=2weeks
```

### System Analysis
```bash
# Boot time
systemd-analyze
systemd-analyze blame
systemd-analyze critical-chain
systemd-analyze plot > boot.svg

# Unit dependencies
systemctl list-dependencies myapp
systemctl list-dependencies --reverse myapp

# Show unit file
systemctl cat myapp
systemctl show myapp
systemctl show myapp --property=FragmentPath,ExecMainStartTimestamp
```

### Power Management
```bash
systemctl suspend
systemctl hibernate
systemctl hybrid-sleep
systemctl reboot
systemctl poweroff
```

## Systemd-nspawn (Containers)

### Create Container
```bash
# From directory
systemd-nspawn -D /var/lib/machines/mycontainer -b

# From image
machinectl pull-tar --verify=no https://example.com/archlinux.tar.xz
systemd-nspawn -D /var/lib/machines/archlinux -b
```

### Network
```bash
# Host network
systemd-nspawn -D /path --network-veth --bind-ro=/etc/resolv.conf

# Private network
systemd-nspawn -D /path --network-bridge=br0
```

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check status
systemctl status myapp

# Check logs
journalctl -u myapp -xe

# Check unit file
systemctl cat myapp
systemd-analyze verify /etc/systemd/system/myapp.service
```

#### Dependency Issues
```bash
# Check what's required
systemctl list-dependencies myapp --reverse

# Check ordering
systemctl show myapp --property=After,Before,Wants,Requires
```

#### Resource Limits Not Applied
```bash
# Check cgroup
systemctl show myapp --property=ControlGroup
cat /sys/fs/cgroup/system.slice/myapp.service/memory.max
```

#### Socket Activation Issues
```bash
# Check socket
systemctl status myapp.socket
systemctl cat myapp.socket

# Test socket
systemd-socket-activate -l 8080 -- /opt/myapp/bin/server
```

### Debug Mode
```bash
# Enable debug logging
systemd-analyze set-log-level debug
systemd-analyze set-log-target journald

# Or boot with
systemd.log_level=debug systemd.log_target=journald
```

## Best Practices

1. **Use Type=notify** for services that support sd_notify
2. **Always set Restart=on-failure** for resilience
3. **Use drop-ins** instead of modifying package units
4. **Set resource limits** to prevent resource exhaustion
5. **Use PrivateTmp, ProtectSystem=strict** for security
6. **Use EnvironmentFile** for configuration separation
7. **Use systemd timers** instead of cron
8. **Use socket activation** for on-demand services
9. **Log to journal** (StandardOutput=journal)
10. **Test with systemd-analyze verify**

## Resources
- [systemd.io](https://systemd.io/)
- [Arch Wiki systemd](https://wiki.archlinux.org/title/systemd)
- [systemd Reference](https://www.freedesktop.org/software/systemd/man/latest/)
- [systemd Best Practices](https://docs.fedoraproject.org/en-US/quick-docs/systemd-tips-and-tricks/)