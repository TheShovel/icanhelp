# Linux Logging: journald, rsyslog, logrotate

## systemd-journald — use `sys log` (all distros)
```bash
sys log show                 # all logs
sys log show nginx           # by unit
sys log follow nginx         # follow live
sys log errors               # errors only, this boot
sys log boot                 # current boot
sys log disk                 # journal size on disk
sys log vacuum 1G            # trim journal to 1G
```
Raw equivalents: `sudo journalctl`, `sudo journalctl -u nginx`, `sudo journalctl -p err -b`, `sudo journalctl --vacuum-size=1G`.

### Fields & advanced (native journalctl)
```bash
journalctl -F _SYSTEMD_UNIT        # list values
journalctl _SYSTEMD_UNIT=nginx.service _PID=1234
journalctl _COMM!=systemd
journalctl -o json -u nginx | jq '.MESSAGE'
journalctl --since "1 hour ago" --until "12:00:00"
```

### Persistent storage
```bash
sudo mkdir -p /var/log/journal
# /etc/systemd/journald.conf: Storage=persistent
sudo systemctl restart systemd-journald
```
See `systemd-journald-detailed.md` for full config and formats.

## rsyslog (install: `sys pkg install rsyslog`)
```conf
# /etc/rsyslog.conf
module(load="imuxsock")   # local
module(load="imklog")      # kernel
module(load="imjournal")   # journal
kern.*      /var/log/kern.log
auth.*      /var/log/auth.log
*.*          /var/log/syslog
```
```bash
rsyslogd -N1                      # test config
sudo systemctl status rsyslog
```

## logrotate (not wrapped)
```bash
logrotate -d /etc/logrotate.conf  # dry-run
logrotate -d /etc/logrotate.d/nginx
logrotate -f /etc/logrotate.conf  # force
cat /var/lib/logrotate/status
```
Key options: `daily/weekly/monthly`, `rotate N`, `size 100M`, `compress`, `delaycompress`, `missingok`, `notifempty`, `create 0640 user group`, `copytruncate`, `postrotate/endscript`. See `logrotate.md`.

## Analysis
```bash
sys log show nginx -g "error" --since "1 hour ago"
journalctl -u nginx -o cat | awk '/error/'
lnav /var/log/syslog              # log navigator (install)
```
