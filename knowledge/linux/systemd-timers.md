# systemd Timers (cron replacement)

## Why timers over cron
- Logs go to journald (no mail needed), have monotonic/calendar accuracy, dependencies, and `OnBootSec`/`OnUnitActiveSec` semantics.
- Each timer pairs a `.timer` unit with a `.service` unit that does the work.

## Timer unit example
```
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily backup

[Timer]
OnCalendar=*-*-* 03:00:00     — daily at 3am
Persistent=true               — run if missed while off
RandomizedDelaySec=900        — jitter up to 15 min
Unit=backup.service           — service to trigger

[Install]
WantedBy=timers.target
```

## Common OnCalendar specs
- `daily` / `weekly` / `monthly` / `yearly` — built-in keywords
- `*-*-* 03:30:00` — every day 3:30am
- `Mon *-*-* 09:00:00` — every Monday 9am
- `*-*-01 00:00:00` — first of month
- `*:0/15` — every 15 minutes
- `OnBootSec=15min` — 15 min after boot
- `OnUnitActiveSec=1h` — 1h after last activation

## Managing timers
```
systemctl daemon-reload                 — after editing units
systemctl enable --now backup.timer     — enable + start
systemctl list-timers                   — show next run times
systemctl list-timers --all             — include inactive
systemctl status backup.timer           — current state
systemctl start backup.service          — run the job now
journalctl -u backup.service            — view job output
```

## Service unit the timer triggers
```
# /etc/systemd/system/backup.service
[Unit]
Description=Backup job

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
```

## Comparison with cron
- cron: simple line in crontab, output emailed, no native logging.
- timer: native journal logging, `Persistent` catches missed runs, `AccuracySec` controls drift, can require network via `Wants=network-online.target`.
