# Linux Hardware Monitoring

## Sensors (lm-sensors)

```bash
# Install
sudo apt install lm-sensors
sudo dnf install lm_sensors

# Detect sensors
sudo sensors-detect --auto            # Answer yes to all prompts

# View temperatures
sensors                            # All sensors
sensors -u                         # Raw values
sensors -j                         # JSON output

# Specific sensors
sensors coretemp-isa-0000            # CPU temp
sensors asus-isa-0a00                # ASUS motherboard

# Fan speeds
sensors | grep -i fan
```

## Hardware Information

```bash
# CPU info
lscpu
cat /proc/cpuinfo
cat /proc/cpuinfo | grep "model name" | head -1

# Memory info
free -h
cat /proc/meminfo
sudo dmidecode -t memory             # Module details

# Motherboard
sudo dmidecode -t baseboard
sudo dmidecode -t system
sudo dmidecode -t bios

# PCI devices
lspci -v
lspci -nn                          # With vendor IDs
lspci -k                           # Kernel driver

# USB devices
lsusb -v
lsusb -t                          # Tree view

# Block devices
lsblk -f                          # Filesystems
lsblk -m                          # Mount points
lsblk -o NAME,SIZE,TRAN,TYPE,MOUNTPOINT,MODEL

# Hardware tree
lshw -short
sudo lshw
sudo lshw -json
```

## GPU Monitoring

### NVIDIA
```bash
# Install tools
sudo apt install nvidia-utils

# Query GPU
nvidia-smi                         # All info
nvidia-smi -q -d MEMORY           # Memory only
nvidia-smi -q -d TEMPERATURE      # Temperature
nvidia-smi -q -d PERFORMANCE     # Performance state
nvidia-smi -l 1                   # Continuous (1s refresh)

# Processes
nvidia-smi pmon                   # Process monitor
nvidia-smi topo -m                # Topology matrix

# Set persistence mode
sudo nvidia-smi -pm 1              # Enable
sudo nvidia-smi -pl 150           # Power limit (W)
sudo nvidia-smi -ac 5000,1590    # Memory/core clocks
```

### AMD
```bash
# AMD GPU (modern)
cat /sys/class/drm/card0/device/gpu_busy_percent
cat /sys/class/drm/card0/device/power_dpm_force_performance_level
echo high | sudo tee /sys/class/drm/card0/device/power_dpm_force_performance_level

# Temperature
cat /sys/class/drm/card0/device/hwmon/hwmon0/temp1_input
# Or via sensors if amdgpu module loaded

# Power consumption
cat /sys/class/drm/card0/device/hwmon/hwmon0/power1_average
```

### Intel
```bash
# Intel GPU
sudo intel_gpu_top                    # Real-time monitor
cat /sys/class/drm/card0/intel_gpu_frequency

# Check RC6 (power saving)
cat /sys/kernel/debug/dri/0/i915_parameters
```

## Disk Monitoring

```bash
# SMART status
sudo smartctl -a /dev/sda            # All SMART info
sudo smartctl -H /dev/sda           # Health check
sudo smartctl -c /dev/sda           # Capabilities
sudo smartctl -A /dev/sda           # Attributes
sudo smartctl -l selftest /dev/sda  # Self-test logs

# Run self-test
sudo smartctl -t short /dev/sda
sudo smartctl -t long /dev/sda
sudo smartctl -l selftest /dev/sda  # Check progress

# NVMe drives
sudo nvme smart-log /dev/nvme0
sudo nvme error-log /dev/nvme0
sudo nvme get-feature /dev/nvme0 -H  # Features

# Temperature
hddtemp /dev/sda
sudo smartctl -A /dev/nvme0 | grep "temperature"

# Performance testing
sudo hdparm -Tt /dev/sda             # Cache/disk speed
sudo hdparm -I /dev/sda              # Drive info
```

## Fan Control

### Automatic (lm-sensors)
```bash
# Check fan chips
sensors | grep -i fan

# Fan control service
sudo apt install fancontrol
sudo pwmconfig                      # Configure fans (interactive)
sudo sensors -u                     # Check PWM values

# Start service
sudo systemctl enable fancontrol
sudo systemctl start fancontrol

# Manual PWM
echo 200 | sudo tee /sys/class/hwmon/hwmon2/pwm1
echo 1 | sudo tee /sys/class/hwmon/hwmon2/pwm1_enable
```

### Thinkpad Fan Control
```bash
sudo apt install tp-smapi-dkms thinkfan

# Check fan levels
cat /proc/acpi/ibm/fan

# Set fan level
echo level 1 | sudo tee /proc/acpi/ibm/fan
echo level 7 | sudo tee /proc/acpi/ibm/fan  # Maximum
echo full_speed | sudo tee /proc/acpi/ibm/fan

# ThinkFan config (/etc/thinkfan.conf)
sensors
hwmon tpacpi:
  176 0 45
  180 1 50
  185 2 55
  190 3 60
  195 4 65
  200 5 70
  210 6 75
  220 7 80
```

## Thermal Management

### Check Thermal Zones
```bash
# List thermal zones
ls /sys/class/thermal/thermal_zone*

# Read temperatures
cat /sys/class/thermal/thermal_zone*/temp
cat /sys/class/thermal/thermal_zone*/type

# CPU throttling
cat /sys/devices/system/cpu/cpu*/thermal_throttle/core_throttle_count

# Intel thermal
sudo apt install thermald
sudo systemctl enable --now thermald
```

### CPU Frequency & Throttling
```bash
# Current frequency
cat /proc/cpuinfo | grep MHz
lscpu | grep MHz

# CPU stats
sudo turbostat --interval 5           # Intel
watch -n 1 'grep -E "cpu MHz|core throttle" /proc/cpuinfo'

# Check turbo boost
cat /sys/devices/system/cpu/intel_pstate/no_turbo
echo 1 | sudo tee /sys/devices/system/cpu/intel_pstate/no_turbo  # Disable

# AMD
cat /sys/devices/system/cpu/cpufreq/boost
echo 0 | sudo tee /sys/devices/system/cpu/cpufreq/boost  # Disable only for non-root tasks
```

## Power Consumption Monitoring

```bash
# powertop
sudo apt install powertop
sudo powertop                        # Interactive
sudo powertop --html=report.html     # HTML report (without sudo)
sudo powertop --csv=report.csv       # CSV data

# Measure process power
sudo powertop --pid $(pgrep firefox)

# Battery discharge rate
watch -n 1 'cat /sys/class/power_supply/BAT*/power_now'

# Overall system power (if supported)
cat /sys/power/capability
```

## USB Monitoring

```bash
# USB devices
lsusb -v | grep -E "MaxPower|Product"

# Power draw
sudo lsusb -v | grep MaxPower

# USB devices tree
lsusb -t

# Check autosuspend
for dev in /sys/bus/usb/devices/*/power/control; do
    echo "$dev: $(cat $dev)"
done
```

## Network Hardware Monitoring

```bash
# PCIe bandwidth
sudo lspci -vv | grep -i "LnkCap\|LnkSta"

# Network stats
cat /proc/net/dev
sar -n DEV 1 5                       # Network stats (sysstat)

# Network errors
ethtool -S eth0
cat /proc/interrupts | grep -E "eth|wlan"

# Wireless signal
iw wlan0 station dump
watch -n 1 'cat /proc/net/wireless'
```

## Kernel Hardware Logging

```bash
# Check hardware logs
journalctl -k                       # Kernel messages
dmesg | grep -i "error\|fail\|pci\|usb"
dmesg -T                           # With timestamps

# Hardware events
sudo dmesg -w                       # Live kernel log
sudo udevadm monitor                 # Device events
sudo udevadm monitor --kernel        # Kernel events only
```

## Performance Monitoring Tools

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs
sudo apt install sysstat dstat atop
sudo apt install glances

# Continuous monitoring
htop                                # CPU/Memory
iotop -ao                          # I/O by process
nethogs                            # Network by process

# System stats
vmstat 1                           # VM stats
iostat -x 1                        # Disk I/O
sar -u 1                           # CPU stats (sysstat)

# Hardware counters
perf top                           # Function-level profiler
perf stat command                  # Run and measure
perf record -g command           # Profile run
```

## Sensor Setup Script

```bash
# One-time setup
#!/bin/bash
sudo sensors-detect --auto
sudo apt install -y fancontrol lm-sensors
sudo pwmconfig
sudo systemctl enable fancontrol

# Add to ~/.bashrc
alias check-sensors='sensors | grep -E "Core|temp|fan"'
alias check-power='cat /sys/class/power_supply/BAT*/capacity'
```

## Hardware Alerts Script

```bash
# Monitoring script
#!/bin/bash
TEMP=$(sensors | grep "Core 0" | awk '{print $3}' | tr -d '+°C')
if [ "$TEMP" -gt 80 ]; then
    notify-send "CPU Hot" "Core 0: ${TEMP}°C"
fi

# Check disk health
for disk in /dev/sd?; do
    sudo smartctl -H $disk | grep "PASSED\|FAILED"
done
```