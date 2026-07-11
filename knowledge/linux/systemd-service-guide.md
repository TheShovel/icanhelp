# Linux Systemd Service Guide

## Service Unit Structure
```ini
[Unit]
Description=My Application
Documentation=https://example.com/docs
After=network.target postgresql.service
Requires=postgresql.service
Wants=redis.service
Before=nginx.service

[Service]
Type=simple
User=myapp
Group=myapp
WorkingDirectory=/opt/myapp
Environment=ENV=production
EnvironmentFile=-/etc/myapp/.env
ExecStart=/opt/myapp/bin/myapp
ExecStartPre=/opt/myapp/bin/migrate
ExecStop=/bin/kill -TERM $MAINPID
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
StartLimitIntervalSec=60
StartLimitBurst=3
TimeoutStartSec=60
TimeoutStopSec=30
KillMode=mixed
KillSignal=SIGTERM
SendSIGHUP=no
SyslogIdentifier=myapp
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=yes
PrivateTmp=yes
PrivateDevices=yes
ProtectHome=yes
ProtectSystem=strict
ReadWritePaths=/opt/myapp/data /var/log/myapp
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
RestrictNamespaces=yes
LockPersonality=yes
MemoryDenyWriteExecute=yes
SystemCallFilter=@system-service
SystemCallErrorNumber=EPERM

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096
MemoryLimit=512M
CPUQuota=200%

[Install]
WantedBy=multi-user.target
```

## Service Types

| Type | Behavior | Use Case |
|------|----------|----------|
| `simple` | Default, process stays in foreground | Most services |
| `forking` | Parent exits, child runs in background | Traditional daemons |
| `oneshot` | Runs once, exits | Setup scripts |
| `dbus` | Acquires D-Bus name | D-Bus services |
| `notify` | Sends READY=1 via sd_notify | Services with startup notification |
| `idle` | Runs after all jobs dispatched | Low priority |

## Exec Directives

```ini
# Main command (required for non-oneshot)
ExecStart=/path/to/executable arg1 arg2

# Run before ExecStart
ExecStartPre=/path/to/pre-start.sh

# Run after ExecStart (for notify type)
ExecStartPost=/path/to/post-start.sh

# Run on stop
ExecStop=/path/to/stop.sh

# Run on reload (systemctl reload)
ExecReload=/path/to/reload.sh

# Multiple commands
ExecStartPre=/bin/mkdir -p /run/myapp
ExecStartPre=/bin/chown myapp:myapp /run/myapp
ExecStart=/opt/myapp/bin/myapp

# Shell features (use /bin/sh -c)
ExecStart=/bin/sh -c 'cd /opt/myapp && ./myapp >> /var/log/myapp.log 2>&1'

# Environment expansion
ExecStart=${MYAPP_BIN}/myapp
```

## Environment & Configuration

```ini
# Direct environment variables
Environment=VAR1=value1
Environment=VAR2=value2

# From file (one VAR=value per line, # comments)
EnvironmentFile=/etc/myapp/config.env

# Optional file (ignore if missing)
EnvironmentFile=-/etc/myapp/local.env

# Override at runtime
systemctl set-environment VAR=value
systemctl unset-environment VAR
```

## Restart Policies

```ini
# When to restart
Restart=no                    # Never (default)
Restart=on-success            # Exit code 0
Restart=on-failure            # Non-zero exit, signal
Restart=on-abnormal           # Signal, timeout
Restart=on-abort              # Uncaught signal
Restart=on-watchdog           # Watchdog timeout
Restart=always                # Any exit

# Delay between restarts
RestartSec=5                  # Fixed 5s
RestartSec=5s 10s 30s         # Exponential backoff
RestartSec=5s                 # Or just one value

# Rate limiting
StartLimitIntervalSec=60      # Time window
StartLimitBurst=3             # Max restarts in window
StartLimitAction=reboot-force # Action if exceeded: none, reboot, reboot-force, poweroff, poweroff-force
```

## Socket Activation

```ini
# mysocket.socket
[Unit]
Description=MyApp Socket

[Socket]
ListenStream=8080
ListenStream=[::]:8080
Accept=yes          # One service per connection (default: no)
MaxConnections=100

[Install]
WantedBy=sockets.target
```

```ini
# mysocket@.service (template)
[Unit]
Description=MyApp Worker

[Service]
ExecStart=/opt/myapp/bin/worker
StandardInput=socket
```

```bash
systemctl enable --now mysocket.socket
# systemd listens on port 8080, starts mysocket@.service on connection
```

## Timer Units (Cron Replacement)

```ini
# myapp-backup.timer
[Unit]
Description=Daily backup timer
Requires=myapp-backup.service

[Timer]
OnCalendar=daily                  # Daily at midnight
OnCalendar=*-*-* 02:30:00         # Daily 2:30 AM
OnCalendar=Mon..Fri 09:00:00      # Weekdays 9 AM
OnCalendar=*-*-1 00:00:00         # 1st of month
OnCalendar=Sat,Sun *-*-* 10:00:00 # Weekends 10 AM
OnBootSec=15min                   # 15 min after boot
OnUnitActiveSec=1h                # 1h after last activation
OnUnitInactiveSec=30min           # 30min after last deactivation
Persistent=true                   # Run immediately if missed
RandomizedDelaySec=15min          # Random delay 0-15min
AccuracySec=1min                  # Default 1min

[Install]
WantedBy=timers.target
```

```ini
# myapp-backup.service (oneshot)
[Unit]
Description=Backup database

[Service]
Type=oneshot
ExecStart=/opt/myapp/bin/backup.sh
User=myapp
```

```bash
systemctl enable --now myapp-backup.timer
systemctl list-timers --all
```

## Drop-in Overrides

```bash
# Create override directory
systemctl edit myservice
# Creates /etc/systemd/system/myservice.d/override.conf

# Or manually
mkdir -p /etc/systemd/system/myservice.d/
cat > /etc/systemd/system/myservice.d/override.conf <<'EOF'
[Service]
MemoryLimit=1G
Environment=EXTRA_VAR=value
EOF

systemctl daemon-reload
systemctl restart myservice
```

## Common Patterns

### Application with Migrations
```ini
[Service]
Type=simple
ExecStartPre=/opt/myapp/bin/migrate up
ExecStart=/opt/myapp/bin/server
ExecStop=/opt/myapp/bin/migrate down  # Optional rollback
```

### Multiple Workers
```ini
# myapp@.service (template)
[Service]
Type=simple
ExecStart=/opt/myapp/bin/worker --id=%i
```

```bash
systemctl enable --now myapp@1 myapp@2 myapp@3 myapp@4
```

### Dependency on Mount
```ini
[Unit]
Requires=mnt-data.mount
After=mnt-data.mount
```

```ini
# mnt-data.mount
[Unit]
Description=Data mount

[Mount]
What=/dev/sdb1
Where=/mnt/data
Type=ext4
Options=defaults,noatime
```

### Watchdog
```ini
[Service]
Type=notify
WatchdogSec=30
ExecStart=/opt/myapp/bin/server

# Application must call sd_notify(0, "WATCHDOG=1") every <30s
# If not, systemd restarts it
```

## Logging & Debugging

```bash
# Follow logs
journalctl -u myservice -f

# Last 100 lines
journalctl -u myservice -n 100

# Since timestamp
journalctl -u myservice --since "1 hour ago"
journalctl -u myservice --since "2024-01-15 10:00:00"

# By priority
journalctl -u myservice -p err

# Output formats
journalctl -u myservice -o json
journalctl -u myservice -o short-precise
journalctl -u myservice -o cat

# Filter by field
journalctl _SYSTEMD_UNIT=myservice _PID=1234

# Disk usage
journalctl --disk-usage
journalctl --vacuum-time=30d
journalctl --vacuum-size=500M
```

### Log Forwarding
```ini
[Service]
StandardOutput=journal
StandardError=journal
SyslogIdentifier=myapp
# Or forward to syslog
# StandardOutput=syslog
# StandardError=syslog
# SyslogFacility=daemon
# SyslogLevel=info
```

## Security Hardening Checklist

```ini
[Service]
# Run as non-root
User=myapp
Group=myapp
DynamicUser=yes           # Creates transient user (systemd 235+)

# Filesystem
ProtectSystem=strict      # Read-only /usr, /boot, /etc
ReadWritePaths=/var/lib/myapp /var/log/myapp
ProtectHome=yes           # No access to /home, /root
PrivateTmp=yes            # Private /tmp, /var/tmp
PrivateDevices=yes        # No device access
PrivateNetwork=yes        # No network (if not needed)
PrivateUsers=yes          # User namespace
PrivateIPC=yes            # Private IPC namespace

# Capabilities
CapabilityBoundingSet=CAP_NET_BIND_SERVICE  # Only bind low ports
AmbientCapabilities=CAP_NET_BIND_SERVICE

# System calls
SystemCallFilter=@system-service
SystemCallErrorNumber=EPERM

# Kernel
LockPersonality=yes
MemoryDenyWriteExecute=yes
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
RestrictNamespaces=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes
ProtectProc=invisible     # Hide other processes in /proc
ProcSubset=pid            # Only show own PID in /proc

# Other
NoNewPrivileges=yes       # Prevent privilege escalation
RestrictRealtime=yes
RestrictSUIDSGID=yes
RemoveIPC=yes
```

## Systemd-analyze

```bash
# Boot time
systemd-analyze
systemd-analyze blame
systemd-analyze critical-chain
systemd-analyze plot > boot.svg

# Service time
systemd-analyze verify myservice.service
systemd-analyze security myservice.service
```

## Troubleshooting

```bash
# Service status
systemctl status myservice
systemctl is-active myservice
systemctl is-enabled myservice
systemctl is-failed myservice

# Failed units
systemctl --failed

# Debug startup
systemd-analyze verify /etc/systemd/system/myservice.service
systemctl cat myservice
systemctl show myservice

# View all config (including drop-ins)
systemctl cat myservice

# Reload daemon
systemctl daemon-reload

# Reset failed state
systemctl reset-failed myservice

# Mask (prevent start)
systemctl mask myservice
systemctl unmask myservice

# Resource usage
systemd-cgtop
systemd-cgls
```

## User Services (systemd --user)

```bash
# Enable linger for user services at boot
loginctl enable-linger $USER

# User service directory
~/.config/systemd/user/

# Manage
systemctl --user status myservice
systemctl --user enable --now myservice

# Environment
systemctl --user show-environment
systemctl --user import-environment PATH DISPLAY
```

## Container Integration

```ini
# For podman/docker containers
[Unit]
Description=MyApp Container
After=network.target

[Service]
Type=simple
Restart=always
RestartSec=10
ExecStartPre=-/usr/bin/podman rm -f myapp
ExecStart=/usr/bin/podman run --rm --name myapp \
  -p 8080:8080 \
  -v /opt/myapp/data:/data \
  -e ENV=production \
  myregistry/myapp:latest
ExecStop=/usr/bin/podman stop -t 10 myapp

[Install]
WantedBy=multi-user.target
```

```bash
# Or use podman generate systemd
podman run -d --name myapp myimage
podman generate systemd --name myapp --files --new
# Creates container-myapp.service
systemctl enable --now container-myapp.service
```

## Boot Process

```
BIOS/UEFI
    ↓
Bootloader (GRUB/systemd-boot)
    ↓
Kernel + initramfs
    ↓
systemd (PID 1)
    ↓
1. local-fs.target (mount /, /boot, etc)
2. swap.target
3. sysinit.target (basic initialization)
    - systemd-journald
    - systemd-udevd
    - systemd-tmpfiles
    - sysctl
    - kernel modules
4. basic.target
    - sockets, timers, paths
    - syslog
5. multi-user.target (or graphical.target)
    - NetworkManager
    - sshd
    - custom services
    - getty@tty1
```

## Best Practices

1. **Use Type=simple** for most services
2. **Set User/Group** - never run as root
3. **Use Restart=on-failure** with RestartSec
4. **Add security hardening** - start strict, relax as needed
5. **Use EnvironmentFile** for configuration directories** - /etc/myapp/
6. **Set resource limits** - MemoryLimit, CPUQuota, LimitNOFILE
7. **Use StandardOutput=journal** - centralized logging
8. **Test with systemd-analyze verify** and **systemd-analyze security**
9. **Document dependencies** - After, Requires, Wants
10. **Use drop-ins** for overrides - don't edit vendor units