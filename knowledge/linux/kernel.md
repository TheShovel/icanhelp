# Linux Kernel & Hardware

## Kernel Info
```
uname -r                    — kernel release
uname -a                    — all kernel info
cat /proc/version           — kernel version + gcc
cat /proc/cmdline           — boot parameters
ls /boot/                   — list kernel images + initramfs
hostnamectl                 — system info (systemd)
```

## Kernel Modules
```
lsmod                       — list loaded modules
modinfo <module>            — show module info
modprobe <module>           — load module with dependencies
modprobe -r <module>        — remove module
insmod /path/to/module.ko   — load module file directly
rmmod <module>              — remove module
depmod                      — rebuild module dependencies
```
Module config: `/etc/modprobe.d/*.conf`
Blacklist syntax: `blacklist module_name`
Options syntax: `options module_name param=value`

## Kernel Parameters (/proc/sys)
```
sysctl -a                   — list all parameters
sysctl net.ipv4.ip_forward=1 — enable IP forwarding
sysctl vm.swappiness=10     — reduce swap tendency
sysctl kernel.hostname=myhost
sysctl -p /etc/sysctl.conf  — load from file
```
Persistent: `/etc/sysctl.conf` or `/etc/sysctl.d/*.conf`

Common tweaks:
```
net.ipv4.ip_forward = 1
net.ipv6.conf.all.disable_ipv6 = 1
vm.swappiness = 10
vm.vfs_cache_pressure = 50
kernel.numa_balancing = 0
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
```

## CPU
```
cat /proc/cpuinfo            — detailed CPU info
lscpu                        — CPU architecture summary
cpuid                        — CPU feature flags
nproc                        — number of cores
taskset -c 0-3 cmd          — pin to cores 0-3
stress --cpu 4              — stress test CPU
```
CPU governors (frequency scaling):
```
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
cpupower frequency-set -g performance  # performance, powersave, ondemand, schedutil
```

## Memory
```
free -h                      — RAM + swap usage
free -h -w                   — with buffers/cache columns
cat /proc/meminfo            — detailed memory stats
vmstat 1                     — memory, swap, I/O stats
slabtop                      — kernel slab allocator usage
```
Memory types:
- `MemTotal` — total physical RAM
- `MemAvailable` — approx usable memory (includes reclaimable cache)
- `Buffers` — raw disk block buffers
- `Cached` — page cache (can be reclaimed)
- `SwapTotal` — total swap space

Check OOM score: `cat /proc/PID/oom_score`

## Storage / Block Devices
```
lsblk                        — tree of block devices
lsblk -f                     — with filesystem + UUID
blkid                        — UUID + filesystem type
fdisk -l /dev/sda            — partition table
parted /dev/sda print        — detailed partition layout
smartctl -a /dev/sda         — S.M.A.R.T. health (install smartmontools)
smartctl -t short /dev/sda   — short self-test
hdparm -t /dev/sda           — read speed test
dd if=/dev/zero bs=1M count=1000 of=/tmp/test — write speed test
```

## PCI Devices
```
lspci                        — list all PCI devices
lspci -v                     — verbose
lspci -vvv                   — very verbose
lspci -k                     — kernel driver in use
lspci -nn                    — with numeric IDs
lspci | grep -i vga          — GPU info
setpci -s 00:02.0 COMMAND=3 — set PCI config register
```

## USB Devices
```
lsusb                        — list USB devices
lsusb -v                     — verbose
lsusb -t                     — tree view
usb-devices                  — detailed device info
usbreset /dev/bus/usb/001/002 — reset USB device
```

## GPU
```
lspci | grep -E "VGA|3D"    — detect GPU
glxinfo -B                   — OpenGL info
glxgears                     — OpenGL test
vulkaninfo                   — Vulkan info
nvidia-smi                   — NVIDIA GPU stats
nvidia-smi -l 1              — live GPU monitor
nvtop                        — htop for NVIDIA/AMD (install)
radeontop                    — AMD GPU monitor
clinfo                       — OpenCL info
```

## Hardware Info
```
dmidecode                    — DMI/SMBIOS info (BIOS, motherboard, RAM)
dmidecode -t memory          — RAM module details
dmidecode -t processor       — CPU info
lshw                         — full hardware tree
lshw -short                  — hardware summary
lscpu                        — CPU architecture
lsmem                        — memory layout
inxi -F                      — full system info
hwinfo                       — hardware probing
```

## Power Management
```
acpi -V                      — battery + thermal info
upower -i /org/freedesktop/UPower/devices/battery_BAT0
tlp stat                     — TLP power management status
powertop                     — power consumption analysis
cpupower frequency-info       — CPU frequency info
```
Tools: `tlp`, `powertop`, `auto-cpufreq`, `slimbookbattery`

## Kernel Boot Parameters (kernel command line)
- `quiet` — suppress boot messages
- `splash` — show splash screen
- `nomodeset` — use basic framebuffer (fix boot issues with GPU)
- `acpi=off` — disable ACPI
- `acpi=force` — force ACPI on unsupported hardware
- `nolapic` / `noapic` — disable APIC (fix IRQ issues)
- `pci=noacpi` — disable ACPI for PCI
- `single` — single-user mode
- `init=/bin/bash` — drop to bash shell directly
- `systemd.unit=rescue.target` — rescue mode
- `mem=4G` — limit RAM to 4GB (test memory issues)
- `maxcpus=1` — use only 1 CPU core
- `noresume` — skip resume from suspend
- `rd.debug` — debug initramfs
