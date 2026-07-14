# systemd Timers (cron replacement)

Each timer pairs a `.timer` unit with a `.service` unit that does the work. Logs go to the journal (use `sys log show backup.service`), and `Persistent=` catches runs missed while the machine was off. See `cron-systemd-timers.md` for a cron→timer migration guide.

## Timer unit
```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily backup

[Timer]
OnCalendar=*-*-* 03:00:00   # daily at 3am
Persistent=true               # run if missed while off
RandomizedDelaySec=900        # jitter up to 15 min
Unit=backup.service           # service to trigger (defaults to same name)

[Install]
WantedBy=timers.target
```
```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Backup job

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
```

## OnCalendar specs
- Keywords: `daily` / `weekly` / `monthly` / `yearly`
- `*-*-* 03:30:00` — every day 3:30am
- `Mon *-*-* 09:00:00` — every Monday 9am
- `*-*-01 00:00:00` — first of month
- `*:0/15` — every 15 minutes
- `Mon..Fri 18:00` — weekdays 6pm
- `2024-01-01..2024-12-31` — date range

## Monotonic timers (relative to boot/activation)
- `OnBootSec=15min` — 15 min after boot
- `OnUnitActiveSec=1h` — 1h after last activation
- `OnUnitInactiveSec=30min` — 30min after last deactivation
- `AccuracySec=1min` — coalescing window (use `1s` for precision)

Validate a spec without creating a unit:
```bash
systemd-analyze calendar "Mon..Fri 18:00"
systemd-analyze calendar --iterations=10 "daily"
```

## Managing timers (native `systemctl`)
```bash
sudo systemctl daemon-reload                  # after editing units
sudo systemctl enable --now backup.timer     # enable + start (sys svc has no --now)
systemctl list-timers --all             # next run times (incl. inactive)
systemctl status backup.timer            # current state
systemctl start backup.service           # run the job now (bypass timer)
sys log show backup.service              # view job output
```

## vs cron
- cron: one line in crontab, output emailed, no native logging.
- timer: native journal logging, `Persistent` catches missed runs, `AccuracySec` controls drift, can require network via `Wants=network-online.target`.
