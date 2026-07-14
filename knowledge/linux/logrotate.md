# Logrotate - Log File Rotation

`logrotate` is not wrapped by `sys` — use it directly. It runs from a systemd timer/service; `logrotate -d` is a safe dry-run.

## Config files
- `/etc/logrotate.conf` — main config (includes `/etc/logrotate.d/*`)
- `/etc/logrotate.d/` — one drop-in per service
- `/var/lib/logrotate/status` — state database

## Global options
```
weekly            # daily / monthly / yearly
rotate 4          # keep N rotations
create            # new empty file after rotation
dateext           # append date (e.g. nginx-20240115.gz)
compress          # gzip
delaycompress     # compress from next rotation
missingok         # ignore missing files
notifempty        # skip empty files
```

## Common directives
- **Frequency**: `daily`, `weekly`, `monthly`, `yearly`
- **Size**: `size 100M`, `minsize 50M`, `maxsize 100M`
- **Compression**: `compress`, `nocompress`, `compresscmd /usr/bin/xz`, `compressext .xz`
- **Creation**: `create 0640 www-data adm`, `nocreate`, `copytruncate`
- **Scripts**: `prerotate/endscript`, `postrotate/endscript`, `firstaction/endscript`, `lastaction/endscript`

## Example (nginx)
```
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 http log
    sharedscripts
    postrotate
        systemctl reload nginx >/dev/null 2>&1 || true
    endscript
}
```

## Commands
```bash
logrotate -d /etc/logrotate.conf   # dry-run, no changes
logrotate -d /etc/logrotate.d/nginx
logrotate -f /etc/logrotate.conf   # force rotation
logrotate -v /etc/logrotate.conf   # verbose
cat /var/lib/logrotate/status      # state
```

## Troubleshooting
- **Permission denied**: `ls -l /var/log/myapp/ /etc/logrotate.d/myapp`; fix owner/mode.
- **Not rotating**: check file exists and isn't empty (`notifempty`); test with `logrotate -d`.
- **Old archives**: `find /var/log -name "*.gz" -mtime +90 -delete`
