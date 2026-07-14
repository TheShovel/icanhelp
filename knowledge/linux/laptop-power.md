# Linux Laptop & Power Management

## Power Management Daemons

### TLP (Recommended for most laptops)
```bash
# Install
sudo apt install tlp tlp-rdw          # Debian/Ubuntu
sudo dnf install tlp                  # Fedora

# Check status
sudo tlp-stat -s                       # System summary
sudo tlp-stat -b                       # Battery
sudo tlp-stat -c                       # Configuration
sudo tlp-stat -t                       # Temperatures
sudo tlp-stat -g                       # GPU
sudo tlp-stat -p                       # PCI devices

# Enable/disable
sudo tlp start
sudo tlp stop
```

### Powertop
```bash
sudo apt install powertop
sudo powertop                          # Interactive tuner
sudo powertop --auto-tune                # Apply tunings
sudo powertop --calibrate              # One-time calibration
# Make permanent: add to /etc/rc.local or systemd service
```

### auto-cpufreq (CPU frequency)
```bash
pip install auto-cpufreq
auto-cpufreq --install                  # Install as service
auto-cpufreq --stats                    # Show statistics
```

## CPU Frequency Scaling (Governors)

```bash
# Check current
cpupower frequency-info
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Available governors
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors

# Set governor
sudo cpupower frequency-set -g performance
sudo cpupower frequency-set -g powersave
sudo cpupower frequency-set -g conservative
sudo cpupower frequency-set -g ondemand
sudo cpupower frequency-set -g schedutil

# Make permanent (systemd)
# /etc/systemd/system/cpu-governor@.service
[Unit]
Description=CPU Governor %i
After=multi-user.target

[Service]
Type=oneshot
ExecStart=/usr/bin/cpupower frequency-set -g %i

[Install]
WantedBy=multi-user.target

# Then: systemctl enable cpu-governor@performance.service
```

## Battery Management

### Battery Status
```bash
# upower (high-level)
upower -i /org/freedesktop/UPower/devices/battery_BAT0
upower -i /org/freedesktop/UPower/devices/battery_BAT1
upower -m                               # Monitor changes

# Raw values
cat /sys/class/power_supply/BAT0/capacity
cat /sys/class/power_supply/BAT0/status
cat /sys/class/power_supply/BAT0/energy_now
cat /sys/class/power_supply/BAT0/energy_full
cat /sys/class/power_supply/BAT0/power_now

# Calculate charge rate
echo "scale=2; $(cat /sys/class/power_supply/BAT0/energy_now) / $(cat /sys/class/power_supply/BAT0/energy_full) * 100" | bc

# acpi (tool)
acpi -V                                 # All power info
acpi -b                                 # Battery only
watch -n 1 acpi -V
```

### Battery Calibration
```bash
# Full discharge + charge cycle
# 1. Charge to 100%
# 2. Let drain to 5% (keep working)
# 3. Charge to 100% without interruption
# Or use tools:

sudo apt install battery-stats
batstat                              # Show stats
sudo modprobe battery recalibrate      # If supported

# ThinkPad specific
sudo apt install tp-smapi-dkms
echo 1 | sudo tee /sys/devices/platform/smapi/BAT0/force_charge
```

## Thermal Management

### Check Temperatures
```bash
# sensors (requires lm-sensors)
sudo apt install lm-sensors
sudo sensors-detect
sensors
sensors -u                          # Raw values
sensors -j                          # JSON output
watch -n 1 sensors

# Thermal zones
ls /sys/class/thermal/thermal_zone*
cat /sys/class/thermal/thermal_zone*/temp

# GPU temperature
nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits
cat /sys/class/drm/card0/device/gpu_busy_percent

# Fan control
sudo apt install fancontrol
sudo pwmconfig                      # Configure fans
sudo sensors -u                   # Check PWM values
```

### Thermal Throttling
```bash
# Check if thermal throttling is active
dmesg | grep -i "thermal"
cat /sys/devices/system/cpu/cpu*/thermal_throttle/core_throttle_count
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_cur_freq

# Intel-specific
cat /sys/devices/system/cpu/intel_pstate/status
grep -i . /sys/devices/system/cpu/intel_pstate/*

# AMD-specific
cat /sys/devices/system/cpu/cpufreq/boost  # 1=active, 0=disabled
```

## Suspend & Hibernate

### Check Support
```bash
# Test suspend
systemctl suspend

# Check hibernate
cat /sys/power/disk                      # Should show "test testproc [shutdown] reboot"
cat /sys/power/state                     # Should show "freeze standby mem disk"
cat /sys/power/mem_sleep                 # Should show "[deep] shallow"
```

### Swap Requirements for Hibernate
```bash
# Swap must be >= RAM size (or use swap file)
swapon --show
lsblk                                    # Check swap partition

# Swap file for hibernate
sudo fallocate -l 16G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Get UUID
sudo blkid /swapfile
# Add to /etc/fstab and GRUB kernel parameters:
# resume=UUID=xxx resume_offset=xxx
```

### Debug Suspend Issues
```bash
# Check what wakes the system
sudo dmesg | grep -i "wakeup"
cat /proc/acpi/wakeup                     # Devices that can wake

# Disable specific wakeup source
echo XHC | sudo tee /proc/acpi/wakeup     # XHCI (USB) wake

# Check systemd sleep config
cat /etc/systemd/sleep.conf               # May need AllowSuspend=yes
```

## Laptop-Specific Hardware

### ThinkPad
```bash
# Install thinkpad tools
sudo apt install tp-smapi-dkms thinkfan
sudo dnf install acpi-thinkpad

# Battery charge thresholds (ThinkPad)
echo 40 | sudo tee /sys/devices/platform/smapi/BAT0/start_charge_thresh
echo 80 | sudo tee /sys/devices/platform/smapi/BAT0/stop_charge_thresh

# TrackPoint settings
echo 250 | sudo tee /sys/devices/platform/i8042/serio1/sensitivity
echo 120 | sudo tee /sys/devices/platform/i8042/serio1/speed
echo 1 | sudo tee /sys/devices/platform/i8042/serio1/press_to_select

# ThinkFan config (/etc/thinkfan.conf)
sensors
# hwmon acpi_tps0 {
#     176     0       45
#     180     1       50
#     185     2       55
#     190     3       60
#     195     4       65
#     200     5       70
#     210     6       75
#     220     7       80
# }
```

### ASUS Laptops
```bash
# Install ASUS tools
sudo apt install asus-utils
sudo modprobe asus-nb-wmil
sudo modprobe asus-laptop

# Fan control
sudo apt install nbfc
nbfc config-get                      # List configs
nbfc config-set "ASUS VivoBook"
nbfc start
```

### Dell Laptops
```bash
# Dell SMBIOS
sudo apt install libsmbios-utils
sudo smbios-sys-info                 # System info
sudo smbios-ipmi-config              # IPMI config

# Fan control (if supported)
sudo ipmitool sensor list
sudo ipmitool sdr                    # Sensor data repository
```

## Power Profiles Daemon

```bash
# Install
sudo apt install power-profiles-daemon

# Check status
powerprofilesctl                       # Show current profile
powerprofilesctl list                  # Available profiles

# Set profile
powerprofilesctl set performance
powerprofilesctl set balanced
powerprofilesctl set power-saver

# Integration with DEs
# GNOME: Settings → Power → Power Profile
# KDE: System Settings → Power Management → Power Profile
```

## Display Brightness

```bash
# Find backlight
ls /sys/class/backlight/

# Set brightness
echo 500 | sudo tee /sys/class/backlight/*/brightness

# Check max
cat /sys/class/backlight/*/max_brightness

# Tools
sudo apt install brightnessctl
brightnessctl s 50%
brightnessctl g                       # Get current
brightnessctl s 700                   # Set to 700

# Redshift (color temperature)
redshift -O 3500                     # 3500K
redshift -x                         # Reset
redshift -l 51.5:-0.1               # Manual location
```

## USB Power Management

```bash
# Check autosuspend
lsusb -t
cat /sys/bus/usb/devices/*/power/control

# Disable autosuspend for device
echo on | sudo tee /sys/bus/usb/devices/1-1/power/control

# Allow runtime PM
echo auto | sudo tee /sys/bus/usb/devices/*/power/control

# Check current draw
sudo lsusb -v | grep -i "maxpower"
```

## NVMe Power States

```bash
# Check power states
sudo nvme id-ctrl /dev/nvme0 | grep -A 20 "psd"

# Set power limit
sudo nvme set-feature /dev/nvme0 -f 0x02 -v 0x7fff -s 0  # Max power

# Check temperature
sudo nvme smart-log /dev/nvme0 | grep "temperature"

# Idle timeout
echo 5min | sudo tee /sys/block/nvme0n1/device/power/d0_l_energy  # if supported
```

## Wi-Fi Power Saving

```bash
# Check current
iwconfig wlan0 | grep "Power Management"

# Disable power save
sudo iwconfig wlan0 power off

# Enable power save
sudo iwconfig wlan0 power on

# Permanent via udev
# /etc/udev/rules.d/80-wifi-powersave.rules
ACTION=="add", SUBSYSTEM=="net", KERNEL=="wlan*" RUN+="/usr/bin/iwconfig %k power on"

# Or via module parameters
# /etc/modprobe.d/iwlwifi.conf
options iwlwifi power_save=Y
options iwlwifi swcrypto=Y
```

## Audio Power Saving

```bash
# Intel HD audio
# /etc/modprobe.d/audio.conf
options snd_hda_intel power_save=1
options snd_hda_intel power_save_controller=N

# Check powersave
cat /sys/module/snd_hda_intel/parameters/power_save

# PulseAudio
pactl set-sink-input-mute $(pactl list sink-inputs short | cut -f1) mute
```

## Kernel Parameters for Power Saving

```bash
# Add to GRUB /etc/default/grub
GRUB_CMDLINE_LINUX="... \
    processor.max_cstate=1 \            # CPU C-states
    intel_idle.max_cstate=0 \         # Intel idle driver
    pcie_aspm=force \                 # PCIe ASPM
    nvme_core.default_ps_max_latency_us=0 \  # NVMe power states
    usbcore.autosuspend=1 \           # USB autosuspend
    mem_sleep_default=deep \          # Deep sleep
    snd_hda_intel.power_save=1 \      # Audio powersave
    i915.enable_dc=2 \               # Intel GPU display power
    nvidia.NVreg_RegistryDwords='PowerMizerEnable=0x1' \  # NVIDIA
"

# Update grub
sudo update-grub
```

## Common Issues & Fixes

### Battery Not Detected
```bash
# Check ACPI
dmesg | grep -i "acpi"
sudo modprobe battery
sudo modprobe sbshc                      # Samsung laptops

# Reinstall firmware
sudo apt install --reinstall firmware-misc-nonfree
```

### Fan Always Running
```bash
# Check thermald
sudo apt install thermald
sudo systemctl enable --now thermald

# Check sensors
sudo sensors-detect
sudo service kmod start

# Reset fan control
echo 0 | sudo tee /sys/devices/platform/applesmc.768/fan*_min
```

### Suspend Loops
```bash
# Disable lid switch
sudo loginctl lock-session
# Or: /etc/systemd/logind.conf → HandleLidSwitch=ignore

# Check wake triggers
cat /proc/acpi/wakeup | grep enabled

# Blacklist problematic modules
# /etc/modprobe.d/blacklist.conf
blacklist nouveau                           # NVIDIA open source
blacklist nvidia_uvm
```

### System Won't Boot After Battery Died
```bash
# BIOS reset
# Remove battery + power cable, hold power button 30 seconds

# CMOS battery replacement (if legacy BIOS)
```