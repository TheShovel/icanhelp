# Linux Cron & Systemd Timers

## Cron

### Crontab Syntax
```bash
# * * * * *  command
# ┬ ┬ ┬ ┬ └─ Day of week (0-7) (Sun=0 or 7)
# ┬ ┬ ┬ └──── Month (1-12)
# ┬ ┬ └────── Day of month (1-31)
# ┬ └──────── Hour (0-23)
# └────────── Minute (0-59)

# Examples
0 2 * * *     /backup.sh                    # Daily 2 AM
*/15 * * * *  /check.sh                     # Every 15 min
0 0 * * 0     /weekly.sh                    # Weekly Sunday
0 0 1 * *     /monthly.sh                   # Monthly 1st
@reboot       /startup.sh                   # On boot
@yearly       /yearly.sh                    # Yearly Jan 1 0:00
@monthly      /monthly.sh                   # Monthly 1st 0:00
@weekly       /weekly.sh                    # Weekly Sun 0:00
@daily        /daily.sh                     # Daily 0:00
@hourly       /hourly.sh                    # Hourly :00
```

### Crontab Management
```bash
crontab -e              # Edit user crontab
crontab -l              # List user crontab
crontab -r              # Remove user crontab
crontab -u user -e      # Edit other user's crontab (root)

# System crontabs
/etc/crontab            # System crontab (has USER field)
/etc/cron.d/            # Drop-in files (has USER field)
/etc/cron.{hourly,daily,weekly,monthly}/  # run-parts directories
```

### Cron Environment
```bash
# Cron runs with minimal env: SHELL=/bin/sh, PATH=/usr/bin:/bin, HOME=/home/user
# Always use full paths in commands
PATH=/usr/local/bin:/usr/bin:/bin
SHELL=/bin/bash
MAILTO="user@example.com"   # Email output (empty = no mail)

# In script, source environment
source /etc/profile
source ~/.bashrc
```

### Cron Logging
```bash
# Systemd journal (systemd-cron)
journalctl -u cron -f

# Traditional syslog
grep CRON /var/log/syslog
grep CRON /var/log/cron

# Capture output in crontab
* * * * * /cmd >> /var/log/mycmd.log 2>&1
```

### Common Issues
```bash
# Jobs not running
# - Check cron daemon: systemctl status cron
# - Check cron logs: journalctl -u cron
# - Command path: use full /usr/bin/command
# - Permissions: script must be executable
# - Environment: source ~/.bashrc or set PATH
# - Newline at end of crontab file required

# Output not emailed
# - Install mailutils/mailx
# - Set MAILTO in crontab
# - Check mail: mail or /var/mail/user
```

## Systemd Timers (Modern Replacement)

### Timer Unit (`/etc/systemd/system/mytimer.timer`)
```ini
[Unit]
Description=Run my script daily
Requires=myscript.service

[Timer]
# Calendar events (systemd.time format)
OnCalendar=daily                    # Daily 00:00
OnCalendar=*-*-* 02:30:00           # Daily 02:30
OnCalendar=Mon *-*-* 03:00:00       # Mondays 03:00
OnCalendar=*-*-1 04:00:00           # 1st of month 04:00
OnCalendar=Sat,Sun *-*-* 05:00:00   # Weekends 05:00
OnCalendar=*-01,07-*-1 06:00:00     # Jan 1 & Jul 1 06:00

# Monotonic timers (relative to boot/activation)
OnBootSec=15min                     # 15 min after boot
OnUnitActiveSec=1h                  # 1h after last activation
OnUnitInactiveSec=30min             # 30min after last deactivation
OnStartupSec=10min                  # 10 min after manager start

# Accuracy
AccuracySec=1min                    # Default 1min, use 1s for precision
RandomizedDelaySec=15min            # Random delay 0-15min (prevent thundering herd)

Persistent=true                     # Run immediately if missed (cron @reboot behavior)

[Install]
WantedBy=timers.target
```

### Service Unit (`/etc/systemd/system/myscript.service`)
```ini
[Unit]
Description=My backup script
# No [Install] needed - timer handles enabling

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
# Environment
Environment=BACKUP_PATH=/mnt/backup
EnvironmentFile=/etc/default/backup
# Logging
StandardOutput=journal
StandardError=journal
# Security hardening
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/mnt/backup
NoNewPrivileges=true
```

### Timer Management
```bash
systemctl daemon-reload
systemctl enable --now myscript.timer
systemctl list-timers --all         # List all timers
systemctl list-timers --all --no-pager
systemctl status myscript.timer
systemctl status myscript.service

# Debug
systemctl cat myscript.timer
systemctl show myscript.timer
journalctl -u myscript.service -f
```

### Calendar Event Syntax (systemd.time)
```bash
# Examples
daily                    # 00:00 daily
weekly                   # Mon 00:00
monthly                  # 1st 00:00
yearly                   # Jan 1 00:00
*-*-* 00:00:00           # Daily midnight
Mon *-*-* 00:00:00       # Weekly Monday
*-*-1 00:00:00           # Monthly 1st
*-1-1 00:00:00           # Yearly Jan 1
Mon,Fri *-*-* 00:00:00   # Mon & Fri
*-*-1/2 00:00:00         # Every 2 days
*-*-* 00:00:00/12        # Every 12 hours
*-*-* 00:00:00+5min      # 5 min after midnight

# Test calendar expressions
systemd-analyze calendar "daily"
systemd-analyze calendar "Mon *-*-* 03:00:00"
```

### Timer vs Cron
| Feature | Cron | Systemd Timer |
|---------|------|---------------|
| Precision | ~1 min | 1 sec (AccuracySec) |
| Logging | Syslog/mail | Journal (structured) |
| Dependencies | None | Full systemd deps |
| Random delay | Manual | RandomizedDelaySec |
| Missed runs | Lost | Persistent=yes |
| Timezone | System TZ | Per-timer TZ= |
| Monitoring | Manual | systemctl list-timers |

### Timer Debugging
```bash
# Next activation time
systemctl list-timers --all | grep myscript

# Show next 10 activations
systemd-analyze calendar --iterations=10 "daily"

# Test service without timer
systemctl start myscript.service

# Check timer status
systemctl show myscript.timer -p NextElapseUSecRealtime,LastTriggerUSec

# Timer generated service override
systemctl edit myscript.timer
# Add: [Timer] Persistent=true
```

## Anacron (Legacy, for non-24/7 systems)
```bash
# /etc/anacrontab
# period  delay  job-id  command
1       5      cron.daily   run-parts /etc/cron.daily
7       10     cron.weekly  run-parts /etc/cron.weekly
@monthly 15   cron.monthly run-parts /etc/cron.monthly

# Runs if system was off during scheduled time
# Check: /var/spool/anacron/cron.daily (timestamp)
```

## Common Patterns

### Backup with Timer
```ini
# /etc/systemd/system/backup.service
[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
Environment=RESTIC_REPOSITORY=/mnt/backup
Environment=RESTIC_PASSWORD_FILE=/etc/restic/password

# /etc/systemd/system/backup.timer
[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=30min
```

### Log Rotation with Timer
```ini
# /etc/systemd/system/logrotate.timer
[Timer]
OnCalendar=daily
Persistent=true
```

### Cleanup Old Files
```bash
# /usr/local/bin/cleanup.sh
find /var/log -name "*.log" -mtime +30 -delete
find /tmp -type f -atime +7 -delete
journalctl --vacuum-time=30d
```

```ini
# /etc/systemd/system/cleanup.timer
[Timer]
OnCalendar=daily
Persistent=true
```

## Monitoring Timers
```bash
# All timers status
systemctl list-timers --all --no-pager

# Failed timers
systemctl list-timers --all --state=failed

# Timer metrics
systemctl show myscript.timer -p LastTriggerUSec,NextElapseUSec

# Journal for timer-triggered services
journalctl -u myscript.service --since "1 hour ago"
```