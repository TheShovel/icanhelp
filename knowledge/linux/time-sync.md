# Linux Time & Date Management

## systemd-timesyncd (Modern Default)

```bash
# Check status
timedatectl status

# Show time sync info
timedatectl timesync-status
timedatectl show-timesync --all

# List NTP servers
timedatectl show-timesync --property=Servers

# Configure NTP servers
# /etc/systemd/timesyncd.conf
[Time]
NTP=pool.ntp.org time.google.com
FallbackNTP=ntp.ubuntu.com

# Restart service
sudo systemctl restart systemd-timesyncd
sudo systemctl enable --now systemd-timesyncd

# Check synchronization
timedatectl show --property=Synchronized
```

## chrony (Advanced NTP)

```bash
# Install
sudo apt install chrony
sudo dnf install chrony

# Check status
chronyd -Q
chronyc tracking
chronyc sources
chronyc sourcestats

# Configure servers
# /etc/chrony/chrony.conf
pool pool.ntp.org iburst
server time.google.com iburst

# Allow network access
allow 192.168.0.0/24

# Manual sync
chronyc makestep
chronyc wait-ready

# Force resync
sudo systemctl restart chronyd
```

## Manual Time Setting

```bash
# Set time (system clock)
sudo timedatectl set-time "2024-01-15 14:30:00"

# Set timezone
timedatectl set-timezone America/New_York
timedatectl set-timezone Europe/London

# List timezones
timedatectl list-timezones | grep -E "New_York|London"

# Interactive selection
sudo dpkg-reconfigure tzdata            # Debian/Ubuntu
sudo timedatectl set-timezone <zone>

# Set NTP sync
timedatectl set-ntp true
timedatectl set-ntp false
```

## RTC (Hardware Clock)

```bash
# Check RTC status
timedatectl | grep "RTC"

# Set RTC to system time
sudo hwclock --systohc

# Set system time to RTC
sudo hwclock --hctosys

# Show RTC time
sudo hwclock --show

# RTC in UTC vs local
timedatectl set-local-rtc 0              # RTC in UTC (recommended)
timedatectl set-local-rtc 1              # RTC in local time (Windows dual-boot)

# Check drift
sudo hwclock --adjust                    # Adjust for drift
cat /etc/adjtime                         # Drift file
```

## Timezone Information

```bash
# Check current timezone
cat /etc/timezone
ls -l /etc/localtime

# Show timezone info
zdump -v /usr/share/zoneinfo/America/New_York

# Quick timezone check
TZ='America/New_York' date

# Convert between timezones
TZ='UTC' date
TZ='America/New_York' date
TZ='Asia/Tokyo' date

# List available
timedatectl list-timezones | grep -i "america\|europe"
```

## Time Synchronization Sources

```bash
# Check which NTP server is used
timedatectl timesync-status --property=ServerName
chronyc sources -v

# NTP pool servers
pool.ntp.org                             # Global pool
time.google.com                          # Google
time.cloudflare.com                      # Cloudflare
time.nist.gov                            # NIST

# Regional pools
# Europe: 0.europe.pool.ntp.org
# North America: 0.north-america.pool.ntp.org
# Asia: 0.asia.pool.ntp.org
```

## systemd Timezone Management

```bash
# Create custom timezone
# /usr/share/zoneinfo/Custom/MyZone
# Copy from existing and modify

# Local time symlink
ls -l /etc/localtime
# /etc/localtime -> ../usr/share/zoneinfo/America/New_York

# Timezone data
sudo apt install tzdata
sudo dnf reinstall tzdata

# Update timezone database
sudo tzupdate                            # Auto-detect timezone
```

## NTP Clients

### ntp (Traditional)
```bash
# Install
sudo apt install ntp
sudo dnf install ntp

# Check status
systemctl status ntp
ntpq -p

# Force sync
sudo ntpd -gq

# Configuration
# /etc/ntp.conf
server pool.ntp.org iburst
server time.google.com iburst

# Note: ntp is deprecated, prefer chrony
```

### sntp (Simple client)
```bash
sudo sntp -S pool.ntp.org               # Sync once
sntp -s pool.ntp.org                  # Query only
```

## Time Debugging

```bash
# Check time sources
systemd-analyze blame | grep -i time

# Check time drift
sudo ntpdate -q pool.ntp.org              # Query without setting

# Check time offset
chronyc offset
ntpdate -q pool.ntp.org

# Monitor synchronization
watch -n 5 'timedatectl timesync-status'
watch -n 5 'chronyc sources -v'

# Check leap seconds
cat /sys/class/timezone/uieapmask
ls -l /usr/share/zoneinfo/right/
```

## Container Time Sync

```bash
# Docker - inherit host time
docker run --rm -v /etc/localtime:/etc/localtime:ro alpine date

# Docker - configure timezone
docker run --rm -e TZ=America/New_York alpine date

# podman
podman run --rm -v /etc/localtime:/etc/localtime:ro alpine date
```

## Time in Different Formats

```bash
# Epoch time
date +%s
date -d @1704067200

# RFC formats
date -Iseconds
date -Irfc3339
date -Imicrosoft

# Custom formats
date "+%Y-%m-%d %H:%M:%S"
date "+%s.%N"                            # With nanoseconds

# ISO 8601
date -I
date -Iseconds

# Copy to clipboard
date -Iseconds | xclip -selection clipboard
```

## Time Zone Conversion

```bash
# Convert timezones
TZ='America/New_York' date -d "2024-01-15 12:00 UTC"
TZ='Asia/Tokyo' date -d "2024-01-15 12:00 UTC"

# Using date with -d
date -d "2024-01-15 12:00:00 UTC"
date -d "2024-01-15 12:00:00 America/New_York"

# Using faketime
sudo apt install faketime
faketime '2024-01-15 12:00:00' date
```

## Scheduled Time Sync

```bash
# cron job (if not using systemd-timesyncd)
# /etc/cron.d/ntp-sync
*/15 * * * * root /usr/sbin/ntpdate pool.ntp.org >/dev/null 2>&1

# systemd timer (modern)
# /etc/systemd/system/ntp-sync.timer
[Unit]
Description=NTP sync timer

[Timer]
OnCalendar=*-*-* 00/15:00:00
Persistent=true

[Install]
WantedBy=timers.target

# /etc/systemd/system/ntp-sync.service
[Unit]
Description=Sync time with NTP

[Service]
Type=oneshot
ExecStart=/usr/sbin/ntpdate -s pool.ntp.org
```

## Hardware-Time Sync Issues

```bash
# Fix drifting RTC
# In BIOS/UEFI: check battery
sudo hwclock --systohc --utc

# Fast boot issues (Windows dual-boot)
# Windows sets RTC to local time
# Linux expects UTC
# Fix: set RTC to UTC in Linux or Windows

# CMOS battery dead
# Replace battery on motherboard
# Re-run hwclock --systohc after

# Check hardware clock drift
sudo hwclock --show
date
# If difference grows, RTC battery may be failing
```

## High Precision Time

```bash
# Check kernel tick rate
cat /proc/timer_list | head -20

# High resolution timers
cat /proc/timer_list | grep -E "hrtimer|it_real"

# PTP (Precision Time Protocol)
sudo apt install linuxptp
sudo ptp4l -i eth0

# Check timer resolution
cat /proc/timer_list | grep "hres"

# Disable tickless
# GRUB: nohz=off
```

## Time Synchronization Troubleshooting

```bash
# Check if NTP is blocked
sudo ntpdate -q pool.ntp.org
# If blocked: firewall, DNS, or network issue

# Check firewall
sudo ss -ulnp | grep :ntp
sudo nft list ruleset | grep 123                # NTP port 123

# Check DNS resolution
nslookup pool.ntp.org
dig pool.ntp.org

# Check systemd timesyncd
journalctl -u systemd-timesyncd
# Look for "Synchronized" or errors
```

## leap-seconds.list Update

```bash
# Check if leap seconds file exists
ls /usr/share/zoneinfo/leap-seconds.list

# Update leap seconds
sudo curl -o /usr/share/zoneinfo/leap-seconds.list \
    https://www.ietf.org/timezones/data/leap-seconds.list

# Restart NTP service
sudo systemctl restart chronyd
```