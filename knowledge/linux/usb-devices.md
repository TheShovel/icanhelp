# USB Device Management

## USB Device Discovery

### List USB Devices
- `lsusb` — list USB devices
- `lsusb -v` — verbose output
- `lsusb -t` — tree view of topology
- `lsusb -d 8086:1234` — filter by vendor:product
- `lsusb -s 1:2` — specific bus:device
- `lsusb -D /dev/bus/usb/001/005` — get full descriptor

### USB Device Details
```bash
# List all with full info
lsusb -v

# Specific device
lsusb -v -d 0781:5567  # SanDisk
lsusb -v -d 046d:c52b  # Logitech

# Tree view
lsusb -t
# Shows hierarchy: root hub → hub → device
```

### USB Topology
```
/:  Bus 01.Port 1: Dev 1, Class=root_hub, Driver=ehci_hcd
    |__ Port 2: Dev 5, Vendor=0781, ProdID=5567  # USB drive
    |__ Port 3: Dev 8, Vendor=046d, ProdID=c52b  # Logitech
```

## USB Device Files

### sysfs Interface
- `/sys/bus/usb/devices/` — USB device tree
- `/sys/bus/usb/devices/1-1.2/` — specific device path
- `/sys/bus/usb/devices/1-1.2/bDeviceProtocol` — device protocol
- `/sys/bus/usb/devices/1-1.2/idVendor` — vendor ID
- `/sys/bus/usb/devices/1-1.2/idProduct` — product ID
- `/sys/bus/usb/devices/1-1.2/product` — product name
- `/sys/bus/usb/devices/1-1.2/manufacturer` — maker name

### Check Device Attributes
```bash
# List attributes
ls /sys/bus/usb/devices/1-1.2/

# Get specific attribute
cat /sys/bus/usb/devices/1-1.2/product
cat /sys/bus/usb/devices/1-1.2/idVendor
cat /sys/bus/usb/devices/1-1.2/idProduct

# Speed
cat /sys/bus/usb/devices/1-1.2/speed  # 12M, 480M, 5000M
```

## USB Device Classes

### Common Classes
- `00 (Audio)` — audio devices
- `03 (HID)` — keyboards, mice
- `08 (Mass Storage)` — USB drives
- `09 (Hub)` — USB hubs
- `10 (CDC-Data)` — modems
- `E0 (Wireless Controller)` — WiFi, Bluetooth

### Check Device Class
```bash
# By parsing lsusb output
lsusb -v | grep -E "(bDeviceClass|iProduct|bInterfaceClass)"

# Via sysfs
cat /sys/bus/usb/devices/1-1.2/bDeviceClass
cat /sys/bus/usb/devices/1-1.2/bInterfaceClass
```

## USB Device Control

### Rescan Device
```bash
# Rescan bus
echo 1 > /sys/bus/usb/devices/1-1.2/authorized

# Reattach
echo 0 > /sys/bus/usb/devices/1-1.2/authorized
sleep 1
echo 1 > /sys/bus/usb/devices/1-1.2/authorized
```

### Power Control
```bash
# Suspend device
echo auto > /sys/bus/usb/devices/1-1.2/power/control

# Wakeup control
echo enabled > /sys/bus/usb/devices/1-1.2/power/wakeup
cat /sys/bus/usb/devices/1-1.2/power/wakeup

# Autosuspend delay
echo 2000 > /sys/bus/usb/devices/1-1.2/power/autosuspend_delay_ms
```

### Remove/Deactivate
```bash
# Soft remove
echo 1 > /sys/bus/usb/drivers/usb/unbind

# Or eject for storage
udisksctl unmount -b /dev/sdb1
udisksctl power-off -b /dev/sdb
```

## USB Device Rules

### udev Rules
- `/etc/udev/rules.d/50-usb.rules` — custom USB rules
- `/lib/udev/rules.d/60-input-id.rules` — input devices
- `/lib/udev/rules.d/80-net-setup-link.rules` — network

### USB udev Rule Syntax
```
SUBSYSTEM=="usb", ATTRS{idVendor}=="0781", ATTRS{idProduct}=="5567", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="tty", ATTRS{idVendor}=="067b", ATTRS{idProduct}=="2303", SYMLINK+="gps0"
```

### Common USB Rules
```
# /etc/udev/rules.d/99-usb-serial.rules
SUBSYSTEM=="tty", ATTRS{idVendor}=="067b", ATTRS{idProduct}=="2303", SYMLINK+="modem0"
SUBSYSTEM=="tty", ATTRS{idVendor}=="10c4", ATTRS{idProduct}=="ea60", SYMLINK+="gps0"

# /etc/udev/rules.d/99-usb-storage.rules
KERNEL=="sd*", SUBSYSTEM=="block", ENV{ID_BUS}=="usb", ENV{UDISKS_AUTO}="0"
```

### Apply udev Rules
```bash
# Trigger rules
udevadm trigger --action=add --subsystem-match=usb

# Reload rules
udevadm control --reload-rules
udevadm trigger

# Test rule
udevadm test /sys/bus/usb/devices/1-1.2/
```

## USB Serial Adapters

### Common Chips
- `FTDI (0403:6001)` — FT232, FT245
- `Silicon Labs (10c4:ea60)` — CP210x
- `Prolific (067b:2303)` — PL2303
- `CH341 (1a86:7523)` — CH340/CH341

### Check Serial Adapter
```bash
# Find adapter
lsusb | grep -i serial

# Check driver
dmesg | grep -i usb
dmesg | tail -50

# Verify device
ls -l /dev/ttyUSB*
```

### Serial Permissions
```bash
# Add user to dialout group
usermod -a -G dialout $USER

# Check permissions
ls -l /dev/ttyUSB0
# crw-rw---- 1 root dialout

# Temporary fix
chmod 666 /dev/ttyUSB0  # Not recommended long-term
```

## USB Storage

### Mount USB Drive
```bash
# Find device
lsblk

# Mount
mkdir -p /mnt/usb
mount /dev/sdb1 /mnt/usb

# Or with udisks
udisksctl mount -b /dev/sdb1

# Auto-mount with label
udisksctl mount -b /dev/sdb1 -o label=BACKUP
```

### USB Storage Options
```bash
# Mount with sync
mount -o sync /dev/sdb1 /mnt/usb

# Mount no atime updates
mount -o noatime /dev/sdb1 /mnt/usb

# Force filesystem type
mount -t vfat /dev/sdb1 /mnt/usb
```

### Unmount Safely
```bash
# Unmount
umount /mnt/usb

# Power off device
udisksctl power-off -b /dev/sdb

# Or sync and remove
sync; echo 1 > /sys/bus/usb/devices/1-1.2/authorized
```

## USB Network Adapters

### Check Driver
```bash
# Check device
lsusb | grep -i ethernet

# Check interface
ip link show

# Check driver
dmesg | grep "usb.*ethernet"
```

### Common USB NICs
- `ASIX (0b95:1720)` — AX8817x
- `Realtek (0bda:8153)` — RTL8153
- `SMSC (0424:2512)` — LAN9500
- `Qualcomm (0403:6001)` — Atheros AR8152

### Driver Issues
```bash
# Load driver
modprobe ax88179_178a
modprobe r8152

# Check module
lsmod | grep -E "(ax|asix|smsc)"

# Blacklist problematic
echo "blacklist cdc_ether" >> /etc/modprobe.d/blacklist.conf
```

## USB Audio

### Check Audio Devices
```bash
# List audio devices
cat /proc/asound/cards
aplay -l  # playback
arecord -l  # capture

# USB audio only
aplay -l | grep -i usb
```

### USB Audio Controls
```bash
# Mixer controls
amixer -c 1  # card 1
amixer -c 1 contents

# Set volume
amixer -c 1 set 'Speaker' 80%
amixer -c 1 set 'Mic' capture 70%
```

## USB Debugging Tools

### usbview
- `usbview` — GUI USB topology viewer
- Shows detailed device information
- Requires root for full view

### lsusb Tips
```bash
# Save to file
lsusb -v > /tmp/usb-full.txt

# Search for specific device
lsusb -v | grep -A 10 "SanDisk"

# Get device path from lsusb
lsusb | grep 0781:5567
# Bus 001 Device 005: ID 0781:5567 SanDisk Corp. Cruzer Blade
```

### dmesg USB Debug
```bash
# USB events
dmesg | grep -i "usb\|hid\|mass"

# Specific device
dmesg | grep "1-1.2:"

# Error messages
dmesg | grep -i "error\|fail\|warn" | grep usb
```

## USB Performance

### USB Speed Classes
- `Low Speed (1.5 Mbps)` — keyboards, mice
- `Full Speed (12 Mbps)` — most devices
- `High Speed (480 Mbps)` — USB 2.0
- `SuperSpeed (5 Gbps)` — USB 3.0
- `SuperSpeedPlus (10+ Gbps)` — USB 3.1+

### Check USB Speed
```bash
# Via sysfs
cat /sys/bus/usb/devices/1-1.2/speed

# Via lsusb
lsusb -t
# Shows: |__ Port 2: Dev 5, ... 480M (High-Speed)

# dmesg
dmesg | grep "high speed"
```

## USB Power Management

### Check Power
```bash
# Bus power
cat /sys/bus/usb/devices/usb1/authorized

# Device power
cat /sys/bus/usb/devices/1-1.2/bMaxPower

# Hub power
cat /sys/bus/usb/devices/1-1/MaxPower
```

### Power Issues
```bash
# Disable autosuspend
echo on > /sys/bus/usb/devices/1-1.2/power/control

# Increase delay
echo 5000 > /sys/bus/usb/devices/1-1.2/power/autosuspend_delay_ms

# Check current draw
cat /sys/bus/usb/devices/1-1.2/bConfigurationValue
```

## USB Quirks

### Quirks Database
- `/lib/modules/$(uname -r)/kernel/drivers/usb/usbip/host/usbip-host.k` — USBIP
- `/sys/kernel/debug/usb/devices` — debug info (debugfs)
- Quirks in kernel source: `Documentation/admin-guide/usb/quirks.rst`

### Common Quirks
- `quirks=0781:5567:u` — unusual device quirks
- Add to kernel cmdline or udev rules

### Workaround Example
```
# In /etc/modprobe.d/usb-quirks.conf
options usb-storage quirks=0781:5567:u
```

## USB Security

### USB Device Control
```bash
# Disable USB storage
echo blacklist usb-storage >> /etc/modprobe.d/blacklist.conf

# Only allow specific vendors
# udev rule: ALLOW_VENDOR=="0781"||"046d"||"8087"
```

### USBGuard
- `usbguard` — USB device authorization framework
- `/etc/usbguard/usbguard-daemon.conf` — config
- Policies in `/etc/usbguard/rules.conf`
- `usbguard generate-policy` — create policy

### USBGuard Example
```
# /etc/usbguard/rules.conf
allow id 0781:5567 serial "4C53000123456789" name "SanDisk" hash "abc123..."
block
```

## Virtual USB

### USBIP (USB over IP)
```bash
# Server (export)
usbipd -D
usbip bind -b 1-1.2

# Client (import)
usbip attach -r server-ip -b 1-1.2
lsusb  # device appears locally
```

### QEMU USB Passthrough
```bash
# QEMU args
qemu-system-x86_64 -device usb-host,vendorid=0x0781,productid=0x5567

# libvirt XML
<hostdev mode='subsystem' type='usb' managed='yes'>
  <source>
    <vendor id='0x0781'/>
    <product id='0x5567'/>
  </source>
</hostdev>
```

## USB Troubleshooting

### Device Not Recognized
```bash
# Check physical connection
lsusb
dmesg | tail -50

# Check power
cat /sys/bus/usb/devices/1-1/power/usb3_hardware_lpm_u1_enable
cat /sys/bus/usb/devices/1-1/power/usb3_hardware_lpm_u2_enable

# Try different port
# Move device to different USB port
```

### Permission Denied
```bash
# Check groups
groups | grep dialout

# Add to group
usermod -a -G dialout $USER

# Logout/login required
# Or su - $USER
```

### Slow Performance
```bash
# Check speed
cat /sys/bus/usb/devices/1-1.2/speed

# Check for errors
dmesg | grep -i "reset\|error"

# Try different cable/port
```

### Device Conflicts
```bash
# Check what's using device
lsof /dev/ttyUSB0

# Kill conflicting process
kill $(lsof /dev/ttyUSB0 | awk '{print $2}')

# Or find by major:minor
ls -l /dev/ttyUSB0
# crw-rw---- 1 dialout 188, 0
```

### Driver Issues
```bash
# Check loaded modules
lsmod | grep usb

# Remove and reload
rmmod ftdi_sio
rmmod usbserial
modprobe usbserial
modprobe ftdi_sio

# Check module parameters
modinfo ftdi_sio
```