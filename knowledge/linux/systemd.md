# systemd (System & Service Manager)

Canonical reference for common systemd commands. Prefer the `sys` wrapper for service and log operations — it auto-detects distro quirks (e.g. the `ssh` vs `sshd` unit name). Other `systemd-*.md` files cover specific subsystems.

## Service management — use `sys svc` (all distros)
```bash
sys svc status nginx            # status + recent logs (unit name auto-detected)
sys svc start nginx
sys svc stop nginx
sys svc restart nginx
sys svc enable nginx            # enable at boot
sys svc disable nginx
sys svc mask nginx              # prevent any activation
sys svc unmask nginx
```
Raw equivalent: `sudo systemctl status|start|stop|restart|enable|disable|mask|unmask <unit>`.

`sys svc` has no `reload` verb — for config reload use native `sudo systemctl reload <unit>` (e.g. `sudo systemctl reload sshd`).

## System state (native `systemctl`)
```bash
systemctl list-units --type=service        # active units
systemctl --failed                         # failed units
systemctl list-unit-files --type=service   # installed + enable state
systemctl list-dependencies <unit>
systemctl get-default                      # current boot target
systemctl daemon-reload                    # after editing unit files
systemctl cat <unit>                       # show unit file
systemctl edit <unit>                      # drop-in override (creates .d/override.conf)
```

## Power commands (native)
```bash
systemctl poweroff / reboot / suspend / hibernate / hybrid-sleep
systemctl reboot --firmware-setup          # into UEFI/BIOS
```

## Logs — use `sys log` (all distros)
```bash
sys log show                 # all logs
sys log show nginx           # logs for a unit
sys log follow               # follow live
sys log follow nginx
sys log errors               # priority err and above, this boot
sys log boot                 # current boot
sys log disk                 # journal size on disk
sys log vacuum 100M          # trim journal to 100M
```
Raw equivalent: `sudo journalctl`, `sudo journalctl -u <unit>`, `sudo journalctl -p err -b`, `sudo journalctl --vacuum-size=100M`.

Advanced journalctl (native, not wrapped):
```bash
journalctl -u <unit> --since "1h"        # time filter
journalctl -b -1                          # previous boot
journalctl --list-boots
journalctl -o json -u nginx | jq '.MESSAGE'
journalctl --verify
```

## Common targets
`poweroff.target`, `reboot.target`, `emergency.target`, `rescue.target`, `multi-user.target` (CLI), `graphical.target` (GUI), `suspend.target`, `hibernate.target`.

## Unit file locations (priority high→low)
- `/etc/systemd/system/` — admin overrides (highest)
- `/run/systemd/system/` — runtime-generated
- `/usr/lib/systemd/system/` — package-provided (lowest)
- `~/.config/systemd/user/` — user-service units

## Distro service-name gotchas
- **SSH**: `sshd.service` on Arch, `ssh.service` on Ubuntu/Debian. `sys svc status ssh` works on both via the alias.
- **Networking**: Ubuntu Desktop uses `NetworkManager`; Ubuntu Server uses `systemd-networkd` or NetworkManager; Arch ships nothing enabled by default.
- **Logging**: Arch is journald-only; Ubuntu also writes `/var/log/syslog`.

## Unit file anatomy (service)
```ini
[Unit]
Description=My Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/myapp --flag
Restart=on-failure
User=myuser
Environment=VAR=value

[Install]
WantedBy=multi-user.target
```
See `systemd-service-guide.md` for writing units and `systemd-deep.md` for socket activation, cgroups, and hardening.

## systemd-analyze (safe, no service changes)
```bash
systemd-analyze                         # total boot time
systemd-analyze blame                   # per-unit startup time
systemd-analyze verify /etc/systemd/system/my.service  # syntax check
systemd-analyze security my.service     # exposure audit
```
