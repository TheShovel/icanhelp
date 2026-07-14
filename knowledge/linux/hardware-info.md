# Hardware Information & Discovery

## CPU
```bash
lscpu                        # architecture, cores, threads, flags (tested: works)
lscpu --parse=CPU,CORE,SOCKET   # parseable topology (tested: works)
cat /proc/cpuinfo            # detailed per-core info (tested: works)
nproc                        # number of processing units (tested: works)
```

## Memory
```bash
free -h                      # usage, human readable (tested: works)
cat /proc/meminfo            # detailed statistics (tested: works)
lsmem                       # memory blocks and zones (tested: works)
dmidecode -t memory         # DIMM slot info (requires root; denied in sandbox)
```

## Storage
```bash
sys disk list                # block devices tree + fs/UUID (lsblk -f)
sys disk usage               # usage per mount (df -h)
# Native detail (not wrapped by sys):
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,ROTA   # ROTA=1 → HDD, 0 → SSD
lsblk -d                     # top-level devices only
fdisk -l                     # partition tables (requires root)
```

## PCI / USB
```bash
lspci                        # all PCI devices (tested: works)
lspci -nn                    # numeric vendor:device IDs
lspci -k                     # kernel driver in use (tested: works)
lspci -s 00:1f.2             # specific slot
lsusb                        # USB devices (tested: works)
lsusb -t                     # tree view (tested: works)
lsusb -v                     # verbose
```

## System / Firmware
```bash
hostnamectl                 # system info (systemd) (tested: works)
dmidecode -t system         # manufacturer/product (requires root)
dmidecode -t bios           # BIOS version/date
efibootmgr -v               # UEFI boot entries
```

## Sensors & GPU
```bash
sensors                     # temperatures/fans (lm-sensors) (tested: works)
sensors -j                  # JSON output
nvidia-smi                  # NVIDIA GPU stats (proprietary driver)
intel_gpu_top               # Intel GPU (open source)
radeontop                   # AMD GPU
glxinfo | grep "OpenGL renderer"   # active GPU renderer
```

## Network Hardware
```bash
ethtool eth0                # NIC driver/features (replace eth0)
ethtool -i eth0             # driver info
ethtool -S eth0             # driver statistics
```

## Disk Health (SMART)
```bash
smartctl -a /dev/sda        # full SMART info (tested: present)
smartctl -H /dev/sda        # health status
smartctl -c /dev/sda        # capabilities
nvme smart-log /dev/nvme0   # NVMe
```

## Battery / Power
```bash
upower -i /org/freedesktop/UPower/devices/battery_BAT0
acpi -V                     # battery + thermal (if installed)
cat /sys/class/power_supply/BAT0/capacity   # battery %
```

## Audio Hardware
```bash
lspci | grep -i audio
aplay -l                    # ALSA playback devices
arecord -l                  # ALSA capture devices
cat /proc/asound/cards
```

## Hardware Database
- `/usr/share/hwdata/pci.ids` — PCI vendor/device IDs
- `/usr/share/hwdata/usb.ids` — USB IDs
- `update-pciids` / `update-usbids` — refresh databases
