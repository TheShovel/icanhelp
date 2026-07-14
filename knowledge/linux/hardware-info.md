# Hardware Information and Discovery

## CPU Information
- `lscpu` — CPU architecture, cores, threads, flags
- `cat /proc/cpuinfo` — detailed CPU info (model, cache, flags)
- `nproc` — number of processing units
- `hwloc-ls` — CPU topology visualization
- `lscpu --parse` — parseable CPU topology

## Memory Information
- `free -h` — memory usage (human readable)
- `free -h --si` — use powers of 1000 (MB, GB)
- `cat /proc/meminfo` — detailed memory statistics
- `dmidecode -t memory` — DIMM slot info (requires root)
- `lsmem` — list memory blocks and zones

## Storage Devices
- `lsblk` — block devices (disks, partitions)
- `lsblk -f` — with filesystem info
- `lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,ROTA` — SSD vs HDD detection
- `lsblk -d` — top-level devices only
- `fdisk -l` — partition table (requires root)
- `fdisk -l /dev/sda` — specific disk
- `gdisk -l /dev/sda` — GPT partition info
- `parted -l` — partition info for all disks

## PCI Devices
- `lspci` — PCI devices (graphics, network, storage)
- `lspci -v` — verbose with kernel drivers
- `lspci -nn` — numeric IDs (vendor:device)
- `lspci -d 8086:1234` — filter by ID
- `lspci -s 00:1f.2` — specific slot
- `lspci -k` — kernel driver in use

## USB Devices
- `lsusb` — USB devices
- `lsusb -v` — verbose info
- `lsusb -t` — tree view of USB topology
- `lsusb -D /dev/bus/usb/001/005` — device details
- `usb-devices` — USB device tree

## Hardware Information Tools

### dmidecode
- `dmidecode` — all DMI/SMBIOS info (root required)
- `dmidecode -t system` — system info (manufacturer, product)
- `dmidecode -t bios` — BIOS info
- `dmidecode -t processor` — CPU info
- `dmidecode -t memory` — memory modules
- `dmidecode -t baseboard` — motherboard info

### lshw (Hardware Lister)
- `lshw` — all hardware (root for complete info)
- `lshw -short` — brief overview
- `lshw -class disk` — only disk drives
- `lshecode -class network` — network devices
- `lshw -class display` — graphics cards
- `lshw -json` — JSON output
- `lshw -html` — HTML output

### inxi
- `inxi -F` — full system info
- `inxi -Fxx` — extra verbose
- `inxi -c 0` — no color
- `inxi -v 8` — very verbose

## Sensors and Monitoring

### lm-sensors
```bash
# Install and detect
apt install lm-sensors
sensors-detect  # Answer yes to all probes

# Show sensors
sensors
sensors -u     # Unscaled values
sensors -f     # Fahrenheit
sensors -j     # JSON output
```

### Sensor Chip Types
- `coretemp` — Intel CPU temperature
- `nct6775` — Super I/O (motherboard)
- `it87` — ITE Super I/O
- `k10temp` — AMD CPU temperature
- `nouveau` — NVIDIA GPU (open source)

### GPU Monitoring
```bash
# NVIDIA (proprietary)
nvidia-smi  # GPU stats
nvidia-smi -l 1  # Continuous updates

# NVIDIA (open source)
nouveau-monitor

# AMD/Intel (open source)
intel_gpu_top
radeontop
```

## Firmware and BIOS

### UEFI Firmware
- `efibootmgr` — UEFI boot entries
- `efibootmgr -v` — detailed entries
- `efibootmgr -c -L "Linux" -l "\vmlinuz.efi"` — create entry
- `efivars` — UEFI variables (/sys/firmware/efi/efivars/)
- `efivar -l` — list UEFI variables (efivar package)

### BIOS Information
- `dmidecode -t bios` — BIOS version and date
- `dmidecode -s bios-version` — just version
- `dmidecode -s bios-release-date` — release date

## Audio Hardware
- `lspci | grep -i audio` — audio controllers
- `aplay -l` — ALSA playback devices
- `arecord -l` — ALSA capture devices
- `cat /proc/asound/cards` — sound cards
- `amixer` — mixer controls

## Network Hardware
- `ethtool eth0` — NIC driver and features
- `ethtool -i eth0` — driver info
- `ethtool -k eth0` — offload features
- `ethtool -S eth0` — driver statistics
- `mii-tool eth0` — PHY link status
- `mii-tool -v eth0` — verbose PHY info

## SCSI/SATA Devices
- `lsblk -S` — SCSI devices with transport
- `sginfo -l` — SCSI devices
- `smartctl -a /dev/sda` — SMART info
- `smartctl -H /dev/sda` — health status
- `smartctl -c /dev/sda` — capabilities

## Battery and Power
- `upower -i /org/freedesktop/UPower/devices/battery_BAT0` — detailed
- `upower -e` — list all power devices
- `acpi -V` — ACPI info (battery, thermal)
- `acpi -b` — battery only
- `acpi -t` — thermal zones
- `cat /sys/class/power_supply/BAT0/capacity` — battery percent

## Display Hardware
- `xrandr --listproviders` — GPU providers
- `xrandr --prop` — detailed output info
- `lshw -class display` — graphics hardware
- `glxinfo | grep "OpenGL renderer"` — GPU renderer

## Input Devices
- `xinput list` — X11 input devices
- `xinput list --id-only` — just IDs
- `xinput test 12` — test device events
- `lsinput` — all input devices

## System Management

### IPMI (Server Management)
- `ipmitool chassis status` — chassis power
- `ipmitool sdr` — sensor readings
- `ipmitool lan print` — network config
- `ipmitool user list 1` — users
- `ipmitool sol activate` — serial-over-LAN

### IPMI Tool Commands
```bash
# Power control
ipmitool chassis power status
ipmitool chassis power on
ipmitool chassis power off
ipmitool chassis power reset

# Boot device
ipmitool chassis bootdev pxe
ipmitool chassis bootdev disk

# Serial console
ipmitool sol info 1
ipmitool sol activate
ipmitool sol deactivate
```

### Serial Console
- `ttyS0`, `ttyS1` — serial ports
- `dmesg | grep tty` — serial port detection
- `setserial -g /dev/ttyS0` — port parameters
- `stty -F /dev/ttyS0 115200` — set baud rate

## Hardware Database
- `/usr/share/hwdata/pci.ids` — PCI vendor/device IDs
- `/usr/share/hwdata/usb.ids` — USB vendor/product IDs
- `update-pciids` — update PCI database
- `update-usbids` — update USB database

## Benchmark Tools

### Disk Benchmarks
- `hdparm -Tt /dev/sda` — cached/random reads
- `hdparm -I /dev/sda` — drive info
- `dd if=/dev/zero of=test bs=1G count=1 oflag=dsync` — write speed
- `dd if=test of=/dev/null bs=1G count=1 iflag=direct` — read speed

### CPU Benchmarks
- `sysbench cpu --cpu-max-prime=10000 run` — CPU performance
- `stress --cpu $(nproc) --timeout 60s` — CPU stress test

### Memory Benchmarks
- `sysbench memory run` — memory speed
- `mbw -n 10 1024` — memory bandwidth

## Hardware Troubleshooting

### Device Not Detected
```bash
# Check kernel messages
dmesg | grep -i "error\|fail"
dmesg | tail -50

# Check PCI
lspci -nn
lspci -k

# Check USB
lsusb -v

# Check modules
lsmod | grep driver_name
```

### Driver Issues
```bash
# Check loaded modules
lsmod

# Load module
modprobe module_name

# Blacklist module
echo "blacklist module_name" >> /etc/modprobe.d/blacklist.conf
update-initramfs -u  # Debian/Ubuntu

# Check module info
modinfo module_name
```

### Hardware Conflicts
```bash
# Check IRQ conflicts
cat /proc/interrupts

# Check I/O ports
cat /proc/ioports

# Check DMA
cat /proc/dma
```