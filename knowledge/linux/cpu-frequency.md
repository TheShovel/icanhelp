# CPU Frequency Scaling & Power Management

## Check Current State
```bash
sys perf cpu                 # CPU model/cores/MHz summary (lscpu)
lscpu | grep -i mhz            # current/max frequency (tested: works)
cat /proc/cpuinfo | grep MHz   # per-core frequency (tested: works)
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor   # (tested: works)
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_driver
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq
# cpupower frequency-info   # (cpupower NOT installed in sandbox)
```

## Governors
- `performance` — always max frequency
- `powersave` — always min frequency
- `ondemand` — scales with load (older)
- `schedutil` — scheduler-driven, modern default

```bash
# List available
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors

# Set (live; requires root)
cpupower frequency-set -g performance
echo performance > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
echo performance | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

## Drivers
- `intel_pstate` — modern Intel (only `performance`/`powersave`); disable via GRUB `intel_pstate=disable` to use acpi-cpufreq
- `acpi-cpufreq` — older Intel/AMD, all governors
- `amd-pstate` — recent AMD Ryzen/EPYC

## Thermal & Throttling
```bash
sensors                      # all sensor readings (tested: works)
cat /sys/class/thermal/thermal_zone*/temp
dmesg | grep -i "thermal throttle"   # (needs root in sandbox)
cat /sys/devices/system/cpu/intel_pstate/no_turbo   # 0=boost on, 1=off (Intel)
cat /sys/devices/system/cpu/cpufreq/boost            # AMD turbo boost toggle
```

## Kernel Parameters (GRUB `GRUB_CMDLINE_LINUX_DEFAULT`)
- `intel_pstate=disable|passive|active`
- `intel_idle.max_cstate=1` / `processor.max_cstate=1` — limit C-states (latency)
- `idle=poll` — prevent sleep (testing only)
- `amd_pstate=active` — enable AMD p-state (kernel 6.3+)

After editing: `grub-mkconfig -o /boot/grub/grub.cfg` (or `update-grub`).

## Power Tools
- `powertop --auto-tune` — apply power savings (interactive: `powertop`)
- `tlp-stat -s` — TLP status (`tlp start`)
- `cpupower idle-info` / `cpupower monitor` — C-state / frequency monitoring (cpupower)

## CPU Pinning (Virtualization / Latency)
```bash
taskset -c 0-3 command
taskset -p $PID               # show affinity
# systemd service: CPUAffinity=0-3 in [Service]
```
