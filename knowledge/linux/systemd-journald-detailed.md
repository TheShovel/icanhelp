# systemd-journald (System Logging)

`systemd-journald` is systemd's logging service: binary, structured, optionally persistent. Common queries use `sys log` (see `systemd.md`); this file covers journald configuration, fields, formats, and maintenance.

## Configuration
- `/etc/systemd/journald.conf` — main config
- `/etc/systemd/journald.conf.d/*.conf` — drop-in overrides
- `/usr/lib/systemd/journald.conf.d/` — vendor defaults
```
# /etc/systemd/journald.conf
[Journal]
Storage=persistent       # persistent (/var/log/journal), volatile (/run), none, auto
Compress=yes
Seal=yes                # cryptographic integrity
MaxRetentionSec=1month
MaxFileSec=1week
SystemMaxUse=1G         # max disk space for system journal
SystemMaxFileSize=100M   # max single file
ForwardToSyslog=yes
ForwardToWall=yes
```
Enable persistent storage: `sudo mkdir -p /var/log/journal` then `sudo systemctl restart systemd-journald`.

## journalctl field filtering
```
journalctl _SYSTEMD_UNIT=nginx.service PRIORITY=3   # unit + priority
journalctl _PID=1234
journalctl _UID=1000
journalctl _COMM=sshd
journalctl -t sshd             # by syslog identifier
journalctl -o verbose          # show all fields of an entry
```
Common fields: `_PID`, `_UID`, `_GID`, `PRIORITY` (0=emerg..7=debug), `SYSLOG_IDENTIFIER`, `MESSAGE`, `_BOOT_ID`, `_MACHINE_ID`, `_SYSTEMD_UNIT`.

## Output formats
- `-o short` (default), `-o short-iso`, `-o short-monotonic`
- `-o verbose` — all fields
- `-o json`, `-o json-pretty` — pipe to `jq`
- `-o cat` — message text only
- `-o export` — export format

## Maintenance — use `sys log`
```bash
sys log disk                  # size on disk
sys log vacuum 100M           # trim to size
```
Raw equivalents:
```
journalctl --disk-usage
journalctl --verify           # integrity check
journalctl --vacuum-size=100M
journalctl --vacuum-time=1month
journalctl --vacuum-files=100
```

## Custom logging
```bash
logger "Application event"                 # via syslog
logger -t myapp "Something happened"
logger --journald METADATA_KEY=val "Message"
echo "Message" | systemd-cat -t myapp           # to journal
echo "Error"   | systemd-cat -p err -t myapp
```

## Access control
- `/var/log/journal/` — root only by default
- `/run/log/journal/` — world readable
- Add a user to the journal group: `sudo usermod -aG systemd-journal alice`
- User vs system: `journalctl --user` / `journalctl --system`

## Troubleshooting
```
sys svc status systemd-journald
sys log disk
sudo journalctl --verify           # integrity check (no sys verb)
# Missing persistent logs?
ls /var/log/journal || sudo mkdir -p /var/log/journal
```
