# Cron & Migrating to systemd Timers

Cron is the classic scheduler; systemd timers are the modern replacement with
journal logging, dependencies, and missed-run recovery. See `systemd-timers.md`
for timer syntax details.

## Crontab syntax
```
# * * * * *  command
# ┬ ┬ ┬ ┬ └─ Day of week (0-7, Sun=0 or 7)
# ┬ ┬ ┬ └──── Month (1-12)
# ┬ ┬ └────── Day of month (1-31)
# ┬ └──────── Hour (0-23)
# └────────── Minute (0-59)
0 2 * * *     /backup.sh                  # Daily 2 AM
*/15 * * * *  /check.sh                   # Every 15 min
0 0 * * 0     /weekly.sh                  # Weekly Sunday
@reboot       /startup.sh                 # On boot
@daily        /daily.sh                    # Daily 00:00
@hourly       /hourly.sh                  # Hourly :00
```

## Crontab management
```
crontab -e              # edit your crontab
crontab -l              # list it
crontab -r              # remove it
crontab -u user -e      # edit another user's (root only)
```
System crontabs (have a USER field): `/etc/crontab`, `/etc/cron.d/*`,
`/etc/cron.{hourly,daily,weekly,monthly}/` (run via run-parts).

## Cron service management
The cron daemon's unit name differs by distro — `cronie` (Arch), `cron`
(Debian/Ubuntu), `crond` (Fedora/RHEL). Use `sys svc` so the right unit is
picked automatically:
```
sys svc status  cronie   # check the daemon is running
sys svc enable  cronie   # enable at boot
sys svc start   cronie   # start now (sys svc has no --now flag)
sys svc restart cronie   # after editing /etc/cron.d or /etc/crontab
sys log follow  cronie   # watch cron runs in the journal
```

## Cron environment gotchas
- Cron runs with a minimal env: `SHELL=/bin/sh`, `PATH=/usr/bin:/bin`.
- Always use **full paths** in commands.
- Set env in the crontab or source a profile in the script:
```
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO="user@example.com"   # empty = no mail
0 2 * * * alice . $HOME/.profile; /home/alice/bin/daily.sh
```
- A trailing newline in the crontab is required.

## Migrating cron → timer
1. Move the command into a oneshot service:
```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Backup

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
```
2. Add a timer:
```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily backup

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true
RandomizedDelaySec=15min

[Install]
WantedBy=timers.target
```
3. Enable and start the timer:
```
sys svc enable  backup.timer
sys svc start   backup.timer
```
4. Logs now appear in the journal: `sys log show backup.service` (or
`sys log follow backup.service`).

### Mapping
| Cron | systemd timer |
|------|----------------|
| `0 2 * * *` | `OnCalendar=*-*-* 02:00:00` |
| `*/15 * * * *` | `OnCalendar=*-*-* *:00/15` |
| `@daily` | `OnCalendar=daily` |
| `@reboot` | `OnBootSec=1min` + `Persistent=true` |
| random delay | `RandomizedDelaySec=` |
| mail on output | journal by default (`sys log show …`) |
| missed run | `Persistent=true` |

Validate a calendar spec: `systemd-analyze calendar "*-*-* 02:00:00"`.

## Anacron (non-24/7 systems)
```bash
# /etc/anacrontab
# period  delay  job-id          command
1        5      cron.daily      run-parts /etc/cron.daily
7        10     cron.weekly     run-parts /etc/cron.weekly
@monthly 15     cron.monthly    run-parts /etc/cron.monthly
```
Runs jobs whose scheduled time was missed while the machine was off. Timers with
`Persistent=true` cover the same case for always-on-ish systems.

## Debugging
```
# systemd-based cron
sys svc status cronie          # daemon state
sys log show  cronie           # daemon logs
# traditional syslog
grep CRON /var/log/syslog
# run a job in a clean cron-like env
env -i PATH=/usr/bin:/bin /home/alice/bin/backup.sh
```
