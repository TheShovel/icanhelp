# Cron Best Practices and Advanced Usage

## Cron Directories

### cron.d vs crontab
- `/etc/crontab` — system crontab
- `/etc/cron.d/*` — package/system crons
- `/etc/cron.daily/*` — daily scripts
- `/etc/cron.hourly/*` — hourly scripts
- `/etc/cron.weekly/*` — weekly scripts
- `/etc/cron.monthly/*` — monthly scripts
- `/var/spool/cron/crontabs/*` — user crontabs

### crontab Format
```
# m h dom mon dow user command
# * * * * * user command
*/5 * * * * root /usr/local/bin/backup.sh
0 2 * * * alice /home/alice/bin/daily.sh
```

### Field Explanation
- minute (0-59)
- hour (0-23)
- day of month (1-31)
- month (1-12)
- day of week (0-7, 0 and 7 = Sunday)
- user (in /etc/crontab and /etc/cron.d/)
- command — program to execute

## Advanced Scheduling

### Special Strings
- `@reboot` — when cron starts
- `@yearly` or `@annually` — 0 0 1 1 *
- `@monthly` — 0 0 1 * *
- `@weekly` — 0 0 * * 0
- `@daily` or `@midnight` — 0 0 * * *
- `@hourly` — 0 * * * *

### Step Values
- `*/5 * * * *` — every 5 minutes
- `0-59/5 * * * *` — every 5 minutes (same)
- `1,15,30,45 * * * *` — specific minutes
- `0 9-17 * * 1-5` — business hours
- `0 8,16 * * 1-5` — twice on weekdays

### List Values
```
# Every 2 hours during work hours
0 8-18/2 * * 1-5 command

# Multiple time windows
0 8-12,14-18 * * 1-5 command
```

## Environment Variables

### System crontab
```
# /etc/crontab
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=admin@example.com
SHELL=/bin/bash
```

### User crontab
```bash
# In crontab file
PATH=/home/alice/bin:/usr/bin:/bin
MAILTO=
SHELL=/bin/zsh
```

### Variables in crontab
- `MAILTO=""` — disable mail
- `MAILTO="[email protected]"` — custom recipient
- `HOME=/home/alice` — home directory
- `LOGNAME=username` — login name

## Shell Environment

### Problem: Minimal Environment
```bash
# Cron runs with minimal environment
# PATH is usually /usr/bin:/bin only
# Many variables not set
```

### Solution: Full Environment
```bash
# Source profile
0 2 * * * alice . $HOME/.profile; /home/alice/bin/backup.sh

# Or in script
#!/bin/bash
source /etc/profile
source ~/.profile
# actual script content
```

### Recommended: Explicit Environment
```bash
# /etc/cron.d/myapp
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=
0 2 * * * app . /home/app/.bashrc; /home/app/bin/daily.sh
```

## Locking and Concurrency

### Prevent Overlaps
```bash
# Using flock
*/5 * * * * root flock -n /run/backup.lock /usr/local/bin/backup.sh

# In script with trap
#!/bin/bash
exec 200>/run/myscript.lock || exit 1
flock -n 200 || exit 1
# Script content here
flock -u 200
```

### Alternative: PID File
```bash
# In script
PIDFILE=/run/myapp.pid
if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE"); then
    echo "Already running"
    exit 1
fi
echo $$ > "$PIDFILE"
trap "rm -f $PIDFILE" EXIT
```

## Logging and Output

### Redirect Output
```bash
# Discard output
*/5 * * * * root /usr/local/bin/backup.sh >/dev/null 2>&1

# Log to file
0 2 * * * alice /home/alice/bin/backup.sh >> /var/log/backup.log 2>&1

# Log with timestamp
0 2 * * * alice /home/alice/bin/backup.sh 2>&1 | ts >> /var/log/backup.log
```

### Log Rotation
```
# /etc/logrotate.d/cron-backup
/var/log/backup.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
}
```

### journalctl Integration
```bash
# Send to journal
0 2 * * * root /usr/local/bin/backup.sh | systemd-cat -t backup

# With priority
0 2 * * * root /usr/local/bin/backup.sh | systemd-cat -p err -t backup
```

## Security Best Practices

### Use Dedicated Users
```bash
# Create service user
useradd -r -s /usr/sbin/nologin -d /var/lib/backup backup

# Run backup as backup user
0 2 * * * backup /usr/local/bin/backup.sh
```

### Secure Scripts
```bash
# Script ownership
chown root:root /usr/local/bin/backup.sh
chmod 755 /usr/local/bin/backup.sh

# Config ownership
chown root:root /etc/backup.conf
chmod 600 /etc/backup.conf
```

### Avoid Sensitive Data in crontab
```bash
# Bad: password in crontab
# * * * * * curl -u user:pass https://...

# Good: use file
# * * * * * curl --config /etc/backup.curl https://...
```

## Error Handling

### Check Exit Codes
```bash
# In script
set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Pipe fails if any part fails

# Or in crontab
*/5 * * * * root /usr/local/bin/backup.sh || echo "Backup failed at $(date)" | mail admin
```

### Retry Logic
```bash
# Simple retry
*/5 * * * * root for i in 1 2 3; do /usr/local/bin/backup.sh && break || sleep 60; done
```

### Timeout
```bash
# Using timeout
0 2 * * * alice timeout 30m /home/alice/bin/backup.sh
```

## systemd-timers vs Cron

### Comparison Table
| Feature | Cron | systemd-timers |
|---------|------|----------------|
| Randomization | RandomDelay in crontab | RandomizedDelaySec= |
| Output capture | mail or redirect | journal by default |
| Dependencies | None | After=, Requires= |
| Calendar | standard cron format | calendar event format |
| Monotonic timers | No | OnActiveSec=, OnUnitActiveSec= |

### Calendar Format
```
# systemd OnCalendar formats
daily         # Every day
weekly        # Every week
monthly       # Every month
*:0/15       # Every 15 minutes
Mon..Fri 18:00 # Weekdays at 6pm
2024-01-01..2024-12-31 # Date range
```

## Debugging Cron

### Check Cron Logs
```bash
# Debian/Ubuntu
grep CRON /var/log/syslog

# RHEL/CentOS
grep CROND /var/log/cron

# systemd
journalctl -u cron.service
journalctl -u crond.service
```

### Test Crontab
```bash
# Check syntax
crontab -l | crontab -t

# Run manually
/run/usr/local/bin/backup.sh

# Run in cron environment
env -i bash -c 'PATH=/usr/bin:/bin; /home/alice/bin/backup.sh'
```

### Common Issues

#### Wrong PATH
```bash
# Always specify full path
# Bad:
* * * * * myapp --config /etc/myapp.conf

# Good:
* * * * * /usr/bin/myapp --config /etc/myapp.conf
```

#### Wrong Shell
```bash
# Explicitly set shell
SHELL=/bin/bash
*/5 * * * * root [[ -f /tmp/test ]] && /usr/bin/script.sh
```

#### No Mail
```bash
# Configure mail
MAILTO=admin@example.com

# Or check why mail fails
# Needs working MTA: postfix, exim, sendmail
```

## Alternative: anacron

### When to Use anacron
- Laptops that sleep/hiberate
- Systems not always on
- Daily/weekly/monthly jobs

### anacrontab Format
```
# period delay job-identifier command
7 10 backup.weekly /usr/local/bin/weekly-backup.sh
30 15 backup.monthly /usr/local/bin/monthly-backup.sh
```

## Best Practices Summary

### Script Checklist
```bash
#!/bin/bash
set -euo pipefail  # Strict mode

# Source environment explicitly
. /etc/profile
. ~/.profile

# Use full paths
/usr/bin/find /data -name "*.tmp" -delete

# Handle errors
if ! /usr/bin/backup; then
    echo "Backup failed" >&2
    exit 1
fi

# Log properly
exec >> /var/log/backup.log 2>&1
date
echo "Backup completed successfully"
```

### Crontab Checklist
- Use dedicated user
- Set proper PATH
- Redirect output appropriately
- Handle errors with mail/notify
- Use locking for long scripts
- Test with `run-parts --test`

### Monitoring
```bash
# Check last run
ls -la /var/spool/cron/crontabs/

# Monitor logs
journalctl -u cron -f

# Check for overlapping runs
ps aux | grep backup.sh
```

## Examples

### Backup Script
```bash
# /usr/local/bin/backup.sh
#!/bin/bash
set -euo pipefail
exec >> /var/log/backup.log 2>&1

DATE=$(date +%Y%m%d)
tar -czf "/backup/data-$DATE.tar.gz" /data/
find /backup -name "*.tar.gz" -mtime +30 -delete
```

### Monitoring Script
```bash
# /etc/cron.d/health
PATH=/usr/bin:/bin
*/10 * * * * root /usr/local/bin/health-check.sh | systemd-cat -t health
```

### Log Cleanup
```bash
# /etc/cron.daily/log-cleanup
#!/bin/bash
find /var/log -name "*.log" -size +100M -exec gzip {} \;
find /var/log -name "*.gz" -mtime +90 -delete
```

### System Updates (Debian)
```bash
# /etc/cron.weekly/apt-update
#!/bin/bash
apt update && apt -y upgrade && apt -y autoremove
```

### Database Backup (PostgreSQL)
```bash
# /etc/cron.d/pg-backup
PATH=/usr/bin:/bin
0 3 * * * postgres pg_dumpall | gzip > /backup/pg-$(date +\%Y\%m\%d).sql.gz
```