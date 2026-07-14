# CPU Frequency Scaling and Power Management

## CPU Frequency Overview
- `cpupower frequency-info` — current frequency and governor
- `lscpu | grep MHz` — CPU frequency range
- `cat /proc/cpuinfo | grep MHz` — per-core current frequency

## Governors
### Available Governors
- `performance` — maximum frequency always
- `powersave` — minimum frequency always
- `ondemand` — scales with load (default on some distros)
- `conservative` — gradual scaling (older)
- `schedutil` — scheduler-driven scaling (modern default)

### Check Current Governor
```bash
cpupower frequency-info --governors
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
cat /sys/devices/system/cpu/cpufreq/policy*/scaling_governor
```

### Set Governor
```bash
# All CPUs
cpupower frequency-set -g performance

# Specific CPU
echo performance > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

# Make permanent
echo 'GRUB_CMDLINE_LINUX="intel_pstate=disable"' >> /etc/default/grub
# For acpi-cpufreq driver
```

## CPU Frequency Tools

### cpupower
- `cpupower frequency-info` — frequency info
- `cpupower frequency-set -g ondemand` — set governor
- `cpupower frequency-set -u 2.4GHz` — set max frequency
- `cpupower frequency-set -d 1.2GHz` — set min frequency
- `cpupower monitor` — frequency monitoring
- `cpupower idle-info` — CPU idle states
- `cpupower idle-set -D 0` — disable deepest C-state

### turbostat
- `turbostat` — real-time frequency and power
- `turbostat --interval 5` — update every 5 seconds
- `turbostat --csv` — CSV output
- Requires `msr` kernel module (`modprobe msr`)

### i7z
- `i7z` — Intel CPU info (desktop only)
- `i7z -S` — C-state residency

## Frequency Scaling Drivers

### intel_pstate (Modern Intel)
- Default for Intel Sandy Bridge and newer
- Provides only `performance` and `powersave` governors
- `cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_driver`

### acpi-cpufreq (Legacy/Broadcom)
- For older Intel and AMD CPUs
- All governors available
- Enable in GRUB: `intel_pstate=disable`

### amd-pstate (Newer AMD)
- Recent AMD Ryzen and EPYC
- Similar to intel_pstate

## Kernel Parameters

### Intel Pstate Parameters
- `intel_pstate=disable` — use acpi-cpufreq instead
- `intel_pstate=passive` — enable acpi-cpufreq simultaneously
- `intel_pstate=active` — force intel_pstate (default)

### CPU Idle Parameters
- `idle=poll` — prevent sleeping (testing)
- `idle=halt` — use halt instruction only
- `intel_idle.max_cstate=1` — limit C-states
- `processor.max_cstate=1` — general C-state limit

### Frequency Limits
- `intel_ocp_cpu_frequency_min=1` — minimum frequency ratio
- `intel_ocp_cpu_frequency_max=0` — maximum frequency ratio

## Thermal Management

### Temperature Monitoring
```bash
# Intel
cat /sys/devices/platform/coretemp.0/hwmon/hwmon*/temp*_input

# AMD
cat /sys/devices/platform/k10temp/hwmon/hwmon*/temp*_input

# All sensors
sensors
sensors -u  # Unscaled
```

### Thermal Throttling
```bash
# Check throttling
dmesg | grep -i "thermal throttle"

# Temperature limits
cat /sys/class/thermal/thermal_zone*/temp
```

## Power Management

### powertop
- `powertop` — interactive power tuning
- `powertop --auto-tune` — apply tunings
- `powertop --html=report.html` — HTML report
- `powertop --csv=report.csv` — CSV report

### TLP (Linux Advanced Power Management)
```bash
# Install
apt install tlp tlp-rdw

# Status
tlp-stat -s

# Configuration
# /etc/tlp.conf
TLP_ENABLE=1
CPU_SCALING_GOVERNOR_ON_BAT=powersave
CPU_SCALING_GOVERNOR_ON_AC=performance
```

### laptop-mode-tools
- Alternative to TLP
- `/etc/laptop-mode/laptop-mode.conf`
- `laptop_mode status` — check status

## Performance Testing

### CPU Frequency Impact
```bash
# Check performance difference
for gov in performance powersave ondemand; do
    echo $gov | tee /sys/devices/system/cpu/cpufreq/policy0/scaling_governor
    sysbench cpu --cpu-max-prime=20000 run | grep "events per second"
done
```

### Benchmark Commands
```bash
# Single thread
sysbench cpu --cpu-max-prime=50000 --threads=1 run

# Multi-thread
sysbench cpu --cpu-max-prime=50000 --threads=$(nproc) run

# Memory bandwidth
sysbench memory run --memory-block-size=1K --memory-total-size=10G

# Events per second comparison
```

## Virtualization and Containers

### CPU Pinning
```bash
# Pin to specific cores
taskset -c 0-3 command

# Check affinity
taskset -p $PID

# systemd service
# /etc/systemd/system/myapp.service
[Service]
ExecStart=/usr/bin/myapp
CPUAffinity=0-3
```

### CPU Shares (Cgroups)
```bash
# systemd slice
# /etc/systemd/system/myapp.slice
[Slice]
CPUShares=512

# Manual cgroup
echo 512 > /sys/fs/cgroup/cpu/myapp/cpu.shares
```

## Monitoring Scripts

### Frequency Monitor
```bash
#!/bin/bash
while true; do
    echo "$(date +%H:%M:%S) $(cat /sys/devices/system/cpu/cpufreq/policy0/scaling_governor) $(cat /sys/devices/system/cpu/cpufreq/policy0/scaling_cur_freq 2>/dev/null || echo N/A)"
    sleep 1
done
```

### Temperature Alert
```bash
#!/bin/bash
TEMP=$(sensors | grep "Core 0" | awk '{print $3}' | tr -d '+°C')
if [ "$TEMP" -gt 80 ]; then
    echo "Warning: CPU temperature ${TEMP}°C"
fi
```

## Troubleshooting

### Governor Not Available
```bash
# Check driver
cat /sys/devices/system/cpu/cpufreq/policy0/scaling_driver

# Load acpi-cpufreq
modprobe acpi-cpufreq

# Blacklist conflicting
echo "blacklist intel_pstate" >> /etc/modprobe.d/blacklist.conf
```

### Frequency Stuck
```bash
# Check thermal throttling
dmesg | grep -i throttle

# Check BIOS limits
cat /sys/devices/system/cpu/cpu*/cpufreq/cpuinfo_max_freq

# Check scaling limits
cat /sys/devices/system/cpu/cpufreq/policy0/scaling_max_freq
```

### Performance Issues
```bash
# Check current governor
cpupower -c all frequency-info

# Check frequency boost
cat /sys/devices/system/cpu/cpufreq/boost  # Intel turbo boost

# Disable boost for consistent performance
echo 0 > /sys/devices/system/cpu/cpufreq/boost
```

## Distribution Specific

### Debian/Ubuntu
- `apt install linux-cpupower`
- `/etc/default/cpupower` — cpupower settings

### RHEL/CentOS/Fedora
- `dnf install kernel-tools`
- `/etc/sysconfig/cpupower` — cpupower settings

### Arch Linux
- `pacman -S cpupower`
- Enable service: `systemctl enable --now cpupower.service`