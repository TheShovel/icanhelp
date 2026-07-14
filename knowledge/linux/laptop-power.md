# Linux Laptop & Power Management

## Power Profiles (verified)
```bash
powerprofilesctl list              # available profiles
powerprofilesctl set performance   # or balanced / power-saver
```

## Battery (verified)
```bash
upower -e                                   # list devices
upower -i /org/freedesktop/UPower/devices/battery_BAT0
cat /sys/class/power_supply/BAT0/capacity   # % charge
cat /sys/class/power_supply/BAT0/status     # Charging/Discharging
```

## CPU Frequency / Governors
```bash
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors
# Set (install cpupower: sudo pacman -S cpupower)
sudo cpupower frequency-set -g powersave
```

## Thermal (verified)
```bash
sensors                          # lm-sensors (sudo pacman -S lm_sensors)
cat /sys/class/thermal/thermal_zone*/temp
cat /sys/devices/system/cpu/cpu*/thermal_throttle/core_throttle_count
```

## Suspend / Hibernate
```bash
systemctl suspend
cat /sys/power/state             # freeze mem disk
cat /sys/power/mem_sleep         # [deep] shallow
sys swap status                  # swap needed for hibernate (>= RAM)
```
Hibernate needs `resume=UUID=...` in kernel cmdline + a swap partition/file.

## Brightness
```bash
ls /sys/class/backlight/
cat /sys/class/backlight/*/max_brightness
echo 500 | sudo tee /sys/class/backlight/*/brightness
# Or: sudo pacman -S brightnessctl; brightnessctl s 50%
```

## USB Power Management
```bash
lsusb -t
cat /sys/bus/usb/devices/*/power/control
echo auto | sudo tee /sys/bus/usb/devices/*/power/control
```

## Troubleshooting
- **Wake loops**: `cat /proc/acpi/wakeup`; disable with `echo XHC | sudo tee /proc/acpi/wakeup`.
- **Battery not detected**: `sudo modprobe battery`; check `dmesg | grep -i acpi`.
- **Fan always on**: check `sensors`; ensure `thermald` running.

> TLP and Powertop are alternatives (`sudo pacman -S tlp powertop`); `powerprofilesctl` covers most laptops.
