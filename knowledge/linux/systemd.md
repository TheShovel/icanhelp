# systemd (System & Service Manager)

## Unit Management
```
systemctl start <unit>       — start a unit
systemctl stop <unit>        — stop a unit
systemctl restart <unit>     — restart a unit
systemctl reload <unit>      — reload config (SIGHUP)
systemctl enable <unit>      — enable at boot
systemctl disable <unit>     — disable at boot
systemctl enable --now <unit> — enable and start
systemctl status <unit>      — show status + recent logs
systemctl is-active <unit>   — check if running
systemctl is-enabled <unit>  — check boot enable
systemctl mask <unit>        — prevent any activation
systemctl unmask <unit>      — reallow activation
systemctl daemon-reload      — reload unit files
systemctl cat <unit>         — show unit file content
systemctl edit <unit>        — override unit config
systemctl revert <unit>      — undo overrides
```

## System State
```
systemctl list-units                            — all active units
systemctl list-units --failed                   — failed units
systemctl list-unit-files                       — all installed unit files
systemctl list-dependencies <unit>              — dependency tree
systemctl list-sockets                          — socket units
systemctl list-timers                           — timer units
systemctl get-default                           — current target
systemctl set-default multi-user.target         — set boot target (CLI)
systemctl set-default graphical.target          — set boot target (GUI)
```

## Power Commands
```
systemctl poweroff         — shutdown + power off
systemctl reboot           — reboot
systemctl reboot --firmware-setup — reboot into UEFI
systemctl suspend          — suspend to RAM
systemctl hibernate        — suspend to disk
systemctl hybrid-sleep     — both suspend + hibernate
systemctl reboot --force   — hard reboot
```

## Journalctl (Logs)
```
journalctl                        — all logs (pager)
journalctl -u <unit>              — logs for specific unit
journalctl -u <unit> -f           — follow logs live
journalctl -u <unit> --since "1h" — last hour
journalctl -u <unit> --since "yesterday" — since yesterday
journalctl -k                     — kernel logs
journalctl -n 50                  — last 50 lines
journalctl -p err                 — priority err and above
journalctl --no-pager             — disable pager
journalctl --vacuum-size=100M     — trim log size
journalctl --vacuum-time=7d       — keep 7 days
journalctl --disk-usage           — show log disk usage
journalctl --verify               — check journal integrity
```

## Common Targets
- `poweroff.target` — shut down
- `reboot.target` — reboot
- `halt.target` — halt (no poweroff)
- `emergency.target` — single-user emergency shell
- `rescue.target` — basic system + rescue shell
- `multi-user.target` — CLI multi-user (no GUI)
- `graphical.target` — GUI (multi-user + display manager)
- `suspend.target` — suspend to RAM
- `hibernate.target` — hibernate to disk

## Unit File Locations
- `/usr/lib/systemd/system/` — distro-provided units
- `/etc/systemd/system/` — admin/override units (higher priority)
- `/run/systemd/system/` — runtime-generated units (highest priority)
- `~/.config/systemd/user/` — user-service units

## Unit File Anatomy (Service)
```ini
[Unit]
Description=My Service
Documentation=man:something(1)
After=network.target
Wants=some.service
Requires=other.service
BindsTo=target.service
Conflicts=conflicting.service

[Service]
Type=simple           # default: forks, oneshot, notify, dbus, idle
ExecStart=/usr/bin/myapp --flag
ExecStop=/usr/bin/stop-myapp
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure    # always, on-success, on-failure, on-abnormal, on-abort, on-watchdog
RestartSec=5s
User=myuser
Group=mygroup
Environment=VAR=value
EnvironmentFile=/etc/sysconfig/myapp
WorkingDirectory=/opt/myapp
LimitNOFILE=65536
TimeoutStartSec=30s
TimeoutStopSec=10s
StandardOutput=journal
StandardError=journal
ProtectSystem=full
PrivateTmp=true
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

## Timer Units (systemd Cron)
```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Weekly backup

[Timer]
OnCalendar=weekly
Persistent=true
RandomizedDelaySec=1h

[Install]
WantedBy=timers.target
```
- `systemctl list-timers` — list all active timers
- `systemctl start backup.service` — manually trigger (without timer)
- `systemctl enable --now backup.timer` — enable timer

## Useful Environment Variables
- `$SYSTEMD_PAGER` — set to `cat` to disable pager
- `$SYSTEMD_COLORS` — set to `0` to disable colors
- `$SYSTEMD_DEBUG` — enable debug logging

## Drop-in Overrides
Instead of editing unit files directly:
```
systemctl edit myunit.service
# Creates /etc/systemd/system/myunit.service.d/override.conf
```
Then add overrides:
```ini
[Service]
Environment=EXTRA=value
```
Run `systemctl daemon-reload` after editing.
