# Linux Time & Date Management

Use `sys time` for the common operations — it wraps `timedatectl` on every distro. Run via `sys time ...` (sudo added automatically for set operations).

## Common operations (all distros)
```bash
sys time status            # local/UTC/RTC + synchronized
sys time set "2024-01-15 14:30:00"   # set the clock manually
sys time zone Europe/Bucharest       # set timezone
sys time ntp on           # enable NTP sync (off to disable)
sys time zones           # list available zones
```
Raw equivalents: `timedatectl status`, `sudo timedatectl set-time "..."`, `sudo timedatectl set-timezone ...`, `sudo timedatectl set-ntp true`, `timedatectl list-timezones`.

## systemd-timesyncd (default NTP client)
```bash
timedatectl timesync-status         # NTP server, poll interval
timedatectl show --property=Synchronized
sudo systemctl restart systemd-timesyncd
```
Config: `/etc/systemd/timesyncd.conf`
```
[Time]
NTP=pool.ntp.org time.google.com
FallbackNTP=ntp.ubuntu.com
```

## RTC (hardware clock)
```bash
timedatectl | grep RTC
sudo hwclock --systohc              # system -> RTC
sudo hwclock --hctosys              # RTC -> system
sudo timedatectl set-local-rtc 0    # UTC (recommended); 1 for Windows dual-boot
```

## Formats & conversion (universal)
```bash
date +%s
date -d @1704067200
date -Iseconds
TZ='America/New_York' date
zdump -v /usr/share/zoneinfo/Europe/Bucharest | head
```

## chrony (advanced NTP)
```bash
sudo sys pkg install chrony
chronyc tracking
chronyc sources
chronyc makestep
```

## Troubleshooting
```bash
timedatectl timesync-status --property=ServerName
sys log show systemd-timesyncd
sudo ss -ulnp | grep :123          # NTP port
```
- **Drift / dual-boot**: set RTC to UTC in Linux (`set-local-rtc 0`) or to local in Windows.
- **Blocked NTP**: check firewall (`sys firewall status`), DNS (`sys net dns`).
