# Logrotate - Log File Rotation

## Configuration Files
- `/etc/logrotate.conf` — main configuration
- `/etc/logrotate.d/` — drop-in configurations (one per service)
- `/var/lib/logrotate/status` — rotation state database
- `/etc/logrotate.conf` includes `/etc/logrotate.d/*`

## Global Options
```
# /etc/logrotate.conf
weekly                    # rotate weekly (daily, monthly, yearly)
rotate 4               # keep 4 rotations
create                 # create new empty file after rotation
dateext              # append date to rotated file (e.g., nginx-20240115.gz)
compress             # compress with gzip
delaycompress        # compress from second rotation onward
missingok            # ignore missing log files
notifempty         # don't rotate empty files
```

## Logrotate Directives

### Rotation Frequency
- `daily` — rotate every day
- `weekly` — rotate once per week
- `monthly` — rotate once per month
- `yearly` — rotate once per year
- `rotate N` — keep N rotations (number)

### Compression
- `compress` — use gzip compression
- `compresscmd /usr/bin/xz` — specify compression command
- `compressext .xz` — specify extension
- `compressoptions -9` — compression options
- `delaycompress` — don't compress most recent
- `nocompress` — disable compression
- `nodelaycompress` — compress immediately

### File Creation
- `create mode owner group` — create new file after rotation
- `create 0640 www-data adm` — specific permissions
- `nocreate` — don't create new file
- `copy` — copy original then truncate
- `copytruncate` — copy then truncate (no create)

### Size Based
- `size 100M` — rotate when > 100MB
- `size 1G` — rotate when > 1GB
- `minsize 50M` — rotate when >= 50MB and time reached
- `maxsize 100M` — rotate when > 100MB regardless of time
- `maxage 30` — remove rotations older than 30 days

### Post-Rotation
- `postrotate` — script after rotation
- `prerotate` — script before rotation
- `lastaction` — after all rotations and postrotate scripts
- `firstaction` — before any rotations
- `endscript` — end of script block

## Basic Configuration Examples

### Nginx Logs
```
# /etc/logrotate.d/nginx
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    prerotate
        if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
            run-parts /etc/logrotate.d/httpd-prerotate; \
        fi
    endscript
    postrotate
        invoke-rc.d nginx rotate >/dev/null 2>&1 || true
    endscript
}
```

### Apache Logs
```
# /etc/logrotate.d/apache2
/var/log/apache2/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root adm
    sharedscripts
    postrotate
        if invoke-rc.d apache2 status > /dev/null 2>&1; then \
            invoke-rc.d apache2 reload > /dev/null 2>&1; \
        fi
    endscript
}
```

### Generic Application
```
# /etc/logrotate.d/myapp
/var/log/myapp/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    create 0644 myapp myapp
}
```

### Size-Based Rotation
```
# /etc/logrotate.d/large-logs
/var/log/bigapp/*.log {
    size 500M
    rotate 3
    compress
    missingok
    notifempty
    postrotate
        systemctl reload bigapp.service > /dev/null 2>&1 || true
    endscript
}
```

## Commands

### Manual Operations
- `logrotate -d /etc/logrotate.conf` — debug mode (dry-run)
- `logrotate -f /etc/logrotate.conf` — force rotation
- `logrotate -f /etc/logrotate.d/nginx` — force specific config
- `logrotate -v /etc/logrotate.conf` — verbose output
- `logrotate -s /tmp/status /etc/logrotate.conf` — custom state file

### Check Configuration
```bash
logrotate -d /etc/logrotate.d/nginx    # Check nginx config
logrotate -d /etc/logrotate.conf       # Check all configs
logrotate -d -f /etc/logrotate.d/nginx # Debug forced rotation
```

### Remove Old Logs
- `logrotate -m /etc/logrotate.conf` — remove old logs only
- `find /var/log -name "*.gz" -mtime +90 -delete` — clean old archives

## Advanced Patterns

### Multiple Groups
```
# Rotate different patterns separately
/var/log/app/*.log /var/log/app/error.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 0644 app app
}
```

### Date Format
```
dateext
dateformat .%Y-%m-%d
# Creates: nginx-access.log.2024-01-15.gz
```

### Extension Patterns
```
/var/log/app/*.log {
    daily
    rotate 10
    compress
    extension .log
    dateext
    dateformat -%Y%m%d
}
```

### Mail on Rotation
```
/var/log/important/*.log {
    weekly
    rotate 4
    compress
    mail admin@example.com
    mailfirst
    notifempty
}
```

### Copy Without Truncate
```
/var/log/app/state.log {
    daily
    rotate 7
    copy
    # For logs that need to stay in place
}
```

## Troubleshooting

### Common Issues

#### Permission Denied
```bash
# Check ownership
ls -l /var/log/myapp/
ls -l /etc/logrotate.d/myapp

# Fix permissions
chown myapp:myapp /var/log/myapp/
chmod 0644 /etc/logrotate.d/myapp
```

#### Config Errors
```bash
# Test syntax
logrotate -d /etc/logrotate.d/myapp

# Verbose output
logrotate -dv /etc/logrotate.d/myapp

# Check for errors in cron
grep logrotate /var/log/syslog
```

#### Missing State File
```bash
# Recreate state file
touch /var/lib/logrotate/status
logrotate -f /etc/logrotate.d/nginx
```

#### Log Not Rotating
```bash
# Check if file exists
ls -la /var/log/myapp/

# Check if empty (notifempty)
> /var/log/myapp/app.log

# Force rotation
logrotate -f /etc/logrotate.d/myapp
```

### Debug Script
```bash
#!/bin/bash
# Test all logrotate configs
for config in /etc/logrotate.d/*; do
    echo "Testing $config"
    logrotate -d "$config" 2>&1 | head -20
done
```

## Systemd Timer Alternative

### logrotate.timer
```
# /etc/systemd/system/logrotate.timer
[Unit]
Description=Daily logrotate

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

### logrotate.service
```
# /etc/systemd/system/logrotate.service
[Unit]
Description=Log rotation
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/sbin/logrotate /etc/logrotate.conf
```

### cron vs systemd
- `cron.daily/logrotate` — traditional cron
- `systemd timer` — modern alternative
- Both work; systemd timers provide better logging