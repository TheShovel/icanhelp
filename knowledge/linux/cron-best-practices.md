# Cron Best Practices

Practical advice for reliable cron jobs. Crontab syntax and the cron→systemd-timer
migration are in `cron-systemd-timers.md`.

## Use dedicated users
Create a dedicated system account for the job (no login shell, no home):
```bash
# system account (native useradd — sys user add makes a normal login user)
useradd -r -s /usr/sbin/nologin -d /var/lib/backup backup
# then schedule it:  0 2 * * * backup /usr/local/bin/backup.sh
```
Own scripts as root, mode `0755`; configs `0600`:
```
chown root:root /usr/local/bin/backup.sh && chmod 755 /usr/local/bin/backup.sh
chown root:root /etc/backup.conf && chmod 600 /etc/backup.conf
```

## Avoid secrets in crontab
```
# Bad:  * * * * * curl -u user:pass https://...
# Good: * * * * * curl --config /etc/backup.curl https://...
```

## Locking (prevent overlaps)
```
# flock
*/5 * * * * root flock -n /run/backup.lock /usr/local/bin/backup.sh
```
Or in the script:
```bash
exec 200>/run/myscript.lock || exit 1
flock -n 200 || exit 1
trap "rm -f $LOCK" EXIT
```

## Logging & output
```
# discard
*/5 * * * * root /usr/local/bin/backup.sh >/dev/null 2>&1
# to a file
0 2 * * * alice /home/alice/bin/backup.sh >> /var/log/backup.log 2>&1
# to the journal
0 2 * * * root /usr/local/bin/backup.sh | systemd-cat -t backup
0 2 * * * root /usr/local/bin/backup.sh | systemd-cat -p err -t backup
```
Rotate logs:
```
# /etc/logrotate.d/cron-backup
/var/log/backup.log { weekly rotate 4 compress missingok notifempty }
```

## Error handling in scripts
```bash
#!/bin/bash
set -euo pipefail          # exit on error, unset var, pipe failure
/usr/bin/find /data -name "*.tmp" -delete
if ! /usr/local/bin/backup; then
    echo "Backup failed" >&2
    exit 1
fi
```
Retry / timeout:
```
*/5 * * * * root for i in 1 2 3; do /usr/local/bin/backup.sh && break || sleep 60; done
0 2 * * * alice timeout 30m /home/alice/bin/backup.sh
```

## Explicit environment
Cron's `PATH` is minimal. Set it in the crontab or source a profile:
```
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=
0 2 * * * app . /home/app/.bashrc; /home/app/bin/daily.sh
```

## Monitoring
```
ls -la /var/spool/cron/crontabs/     # last-modified check
sys svc status cronie                # watch the cron daemon (unit: cronie/cron/crond)
sys log follow cronie                # follow cron daemon logs
ps aux | grep backup.sh              # detect overlaps
```

## Anacron for laptops
For machines that sleep/hibernate, use anacron (see `cron-systemd-timers.md`)
or a systemd timer with `Persistent=true` so missed runs execute on wake.

## Example backup script
```bash
#!/bin/bash
set -euo pipefail
exec >> /var/log/backup.log 2>&1
DATE=$(date +%Y%m%d)
tar -czf "/backup/data-$DATE.tar.gz" /data/
find /backup -name "*.tar.gz" -mtime +30 -delete
```
