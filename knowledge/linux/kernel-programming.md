# Linux Kernel & Hardware (Quick Reference)

Quick kernel/hardware commands. For modules see `kernel-modules.md`, for sysctl see `kernel-parameters.md`.

## Kernel Info
```bash
uname -r                     # kernel release
uname -a                     # all info (tested: works)
cat /proc/version            # version + gcc (tested: works)
cat /proc/cmdline            # boot parameters (tested: works)
hostnamectl                  # system info (systemd) (tested: works)
```

## CPU / Memory
```bash
lscpu                        # CPU summary (tested: works)
nproc                        # core count (tested: works)
cat /proc/cpuinfo            # detailed CPU info (tested: works)
free -h                      # RAM + swap (tested: works)
cat /proc/meminfo            # detailed memory stats (tested: works)
vmstat 1                     # memory/swap/IO/CPU (tested: works)
```

`/proc/meminfo` fields: `MemTotal`, `MemAvailable` (usable incl. reclaimable cache), `Buffers`, `Cached`, `SwapTotal`. Check OOM score: `cat /proc/PID/oom_score`.

## Storage / Block Devices
```bash
sys disk list                # block device tree + fs/UUID (lsblk -f)
sys disk usage               # usage per mount (df -h)
# Native detail (not wrapped by sys):
blkid                        # UUID + fstype
fdisk -l /dev/sda            # partition table (root)
smartctl -a /dev/sda         # SMART health (tested: present)
```

## PCI / USB
```bash
lspci                        # all PCI devices (tested: works)
lspci -k                     # kernel driver in use (tested: works)
lspci -nn                    # numeric IDs
lspci | grep -i vga          # GPU
lsusb                        # USB devices (tested: works)
lsusb -t                     # tree (tested: works)
```

## GPU
```bash
lspci | grep -E "VGA|3D"     # detect GPU
glxinfo -B                   # OpenGL info (mesa)
nvidia-smi                   # NVIDIA stats
nvtop                        # NVIDIA/AMD monitor (install)
radeontop                    # AMD monitor
vulkaninfo                   # Vulkan info
```

## Hardware Info
```bash
dmidecode -t memory          # RAM modules (root)
dmidecode -t processor       # CPU
lshw -short                  # hardware summary (root for full)
lsmem                        # memory layout (tested: works)
inxi -F                      # full system info (install)
```

## Power Management
```bash
acpi -V                      # battery + thermal (if installed)
upower -i /org/freedesktop/UPower/devices/battery_BAT0
powertop                     # power analysis (root)
cpupower frequency-info      # CPU freq (see cpu-frequency.md)
```

## Kernel Boot Parameters (GRUB)
Common `GRUB_CMDLINE_LINUX_DEFAULT` values:
- `quiet splash` — suppress boot messages / splash
- `nomodeset` — basic framebuffer (GPU boot issues)
- `acpi=off` / `acpi=force` — disable/force ACPI
- `nolapic` / `noapic` — fix IRQ issues
- `systemd.unit=rescue.target` — rescue mode
- `init=/bin/bash` — drop to shell
- `mem=4G` — limit RAM (memory testing)
- `maxcpus=1` — single core

After editing: `grub-mkconfig -o /boot/grub/grub.cfg` (or `update-grub`).
