# Hardware Monitoring

Live monitoring of temperatures, fans, disks, and power. For device discovery see `hardware-info.md`.

## Sensors (lm-sensors)
```bash
sensors                      # all sensor readings (tested: works)
sensors -u                   # raw unscaled values
sensors -j                   # JSON output
sensors | grep -i fan        # fan speeds
# First-time setup (root): sensors-detect --auto
```

## Thermal Zones
```bash
ls /sys/class/thermal/thermal_zone*
cat /sys/class/thermal/thermal_zone*/temp
cat /sys/class/thermal/thermal_zone*/type
# CPU throttle counter
cat /sys/devices/system/cpu/cpu*/thermal_throttle/core_throttle_count
```

## GPU Monitoring
```bash
# NVIDIA (proprietary)
nvidia-smi                   # all info
nvidia-smi -l 1              # continuous (1s)
nvidia-smi -q -d TEMPERATURE

# AMD (sysfs, requires amdgpu)
cat /sys/class/drm/card0/device/gpu_busy_percent
cat /sys/class/drm/card0/device/hwmon/hwmon0/temp1_input

# Intel
intel_gpu_top                # real-time
```

## Disk Monitoring (SMART)
```bash
smartctl -a /dev/sda         # full SMART info (tested: present)
smartctl -H /dev/sda         # health check
smartctl -t short /dev/sda   # run short self-test
smartctl -l selftest /dev/sda
nvme smart-log /dev/nvme0    # NVMe
hdparm -Tt /dev/sda          # cached/disk read speed (root)
```

## Fan Control
```bash
# lm-sensors based
sensors | grep -i fan
pwmconfig                    # configure (interactive, root)
systemctl enable --now fancontrol

# Manual PWM (root)
echo 200 | tee /sys/class/hwmon/hwmon2/pwm1
echo 1 | tee /sys/class/hwmon/hwmon2/pwm1_enable
```

## Power Consumption
```bash
powertop                     # interactive analysis (root)
powertop --html=report.html  # HTML report
watch -n 1 'cat /sys/class/power_supply/BAT*/power_now'   # discharge rate
cat /sys/class/power_supply/BAT*/capacity                # battery %
```

## USB Monitoring
```bash
lsusb -t                     # tree (tested: works)
lsusb -v | grep MaxPower     # power draw per device
# Autosuspend state
for dev in /sys/bus/usb/devices/*/power/control; do echo "$dev: $(cat $dev)"; done
```

## Kernel Hardware Logging
```bash
journalctl -k                # kernel messages (tested: works)
dmesg | grep -i "error\|fail\|pci\|usb"   # (needs root in sandbox)
dmesg -T                     # with timestamps
udevadm monitor              # live device events (root)
```
