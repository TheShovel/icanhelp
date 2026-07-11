# Linux udev: Device Management

## Overview

udev manages device nodes in `/dev`, handles hotplug events, and applies persistent naming rules.

## Architecture

```
Kernel → uevents (uevent→systemd-udevd→/dev nodes
              ↓
        Rules(/etc/udev/rules.d/,/usr/lib/udev/rules.d/)
              ↓
        Actions:create symlinks,set permissions,run programs
```

## Rule Files

### Locations (priority order)

```
/etc/udev/rules.d/*.local.rules    # Highest priority (custom)
/etc/udev/rules.d/*.rules          # Admin rules
/lib/udev/rules.d/*.rules          # Vendor rules
/usr/lib/udev/rules.d/*.rules      # Package rules
/run/udev/rules.d/*.rules          # Runtime rules
```

### Rule Syntax

```udev
# /etc/udev/rules.d/99-custom.rules

# Comment
# Match keys
ACTION=="add", SUBSYSTEM=="block", KERNEL=="sd*", ATTR{size}=="20971520"
# Assignment keys
SYMLINK+="mydisk", OWNER="user", GROUP="disk", MODE="0660", RUN+="/usr/local/bin/notify.sh"
```

### Match Keys

| Key | Description | Example |
|-----|-------------|---------|
| `ACTION` | Event action | `add`, `remove`, `change`, `move` |
| `SUBSYSTEM` | Kernel subsystem | `block`, `usb`, `net`, `tty`, `input` |
| `KERNEL` | Kernel device name | `sd*`, `ttyUSB*`, `eth*` |
| `DEVPATH` | Devpath | `/devices/pci0000:00/...` |
| `ATTR{attr}` | Sysfs attribute | `ATTR{size}=="20971520"` |
| `ATTRS{attr}` | Parent attribute | `ATTRS{vendor}=="0x8086"` |
| `DRIVERS` | Kernel driver name | `DRIVERS=="ahci"` |
| `KERNELS` | Parent kernel name | `KERNELS=="0000:00:1f.2"` |
| `SUBSYSTEMS` | Parent subsystem | `SUBSYSTEMS=="pci"` |
| `ENV{key}` | Environment variable | `ENV{ID_FS_TYPE}=="ext4"` |
| `TAG` | Device tag | `TAG=="systemd"` |
| `TEST` | Test file exists | `TEST=="/lib/udev/rules.d/60-persistent-storage.rules"` |

### Assignment Keys

| Key | Description | Example |
|-----|-------------|---------|
| `NAME` | Device node name | `NAME="mydisk"` (rarely used) |
| `SYMLINK` | Additional symlinks | `SYMLINK+="disk/by-id/mydisk"` |
| `OWNER` | Owner | `OWNER="user"` |
| `GROUP` | Group | `GROUP="disk"` |
| `MODE` | Permissions | `MODE="0660"` |
| `SECLABEL` | SELinux label | `SECLABEL="system_u:object_r:fixed_disk_device_t:s0"` |
| `RUN` | Run program | `RUN+="/usr/local/bin/notify.sh $devpath"` |
| `ENV{key}` | Set env var | `ENV{MY_VAR}="value"` |
| `TAG` | Add tag | `TAG+="systemd"` |
| `OPTIONS` | Rule options | `OPTIONS+="last_rule"` |

### Operators

| Operator | Meaning |
|----------|---------|
| `==` | Equality match |
| `!=` | Inequality match |
| `=` | Assign value (replace) |
| `+=` | Append value |
| `:=` | Assign final (no later changes) |

## Common Rules

### Persistent Disk Names

```udev
# /etc/udev/rules.d/99-disks.rules

# By serial (recommended)
ACTION=="add", SUBSYSTEM=="block", ATTRS{serial}=="SERIAL123", SYMLINK+="disk/by-id/mydisk"

# By WWN (world wide name)
ACTION=="add", SUBSYSTEM=="block", ATTRS{wwid}=="0x5000c500a1b2c3d4", SYMLINK+="disk/by-id/wwn-0x5000c500a1b2c3d4"

# By partition label
ACTION=="add", SUBSYSTEM=="block", ENV{ID_FS_LABEL}=="BACKUP", SYMLINK+="disk/by-label/BACKUP"

# By partition UUID
ACTION=="add", SUBSYSTEM=="block", ENV{ID_FS_UUID}=="1234-5678", SYMLINK+="disk/by-uuid/1234-5678"
```

### USB Device Permissions

```udev
# /etc/udev/rules.d/99-usb.rules

# Arduino
SUBSYSTEM=="tty", ATTRS{idVendor}=="2341", ATTRS{idProduct}=="0043", MODE="0666", GROUP="dialout", SYMLINK+="arduino"

# USB-Serial (FTDI)
SUBSYSTEM=="tty", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6001", MODE="0666", GROUP="dialout", SYMLINK+="usbserial-%k"

# YubiKey
SUBSYSTEM=="usb", ATTRS{idVendor}=="1050", MODE="0666", GROUP="plugdev"

# Android ADB
SUBSYSTEM=="usb", ATTRS{idVendor}=="18d1", MODE="0666", GROUP="plugdev"

# Generic USB devices for user access
SUBSYSTEM=="usb", ATTRS{idVendor}=="abcd", MODE="0666", GROUP="users"
```

### Network Interface Naming

```udev
# /etc/udev/rules.d/70-persistent-net.rules

# Rename by MAC
SUBSYSTEM=="net", ACTION=="add", DRIVERS=="?*", ATTR{address}=="aa:bb:cc:dd:ee:ff", NAME="lan0"

# Rename by PCI slot
SUBSYSTEM=="net", ACTION=="add", DRIVERS=="?*", KERNELS=="0000:03:00.0", NAME="wan0"

# Use systemd link files instead (preferred)
# /etc/systemd/network/10-lan0.link
[Match]
MACAddress=aa:bb:cc:dd:ee:ff
[Link]
Name=lan0
```

### Input Devices

```udev
# /etc/udev/rules.d/99-input.rules

# Specific mouse
SUBSYSTEM=="input", ATTRS{name}=="Logitech MX Master 3", MODE="0660", GROUP="input", SYMLINK+="input/mxmaster"

# Keyboard
SUBSYSTEM=="input", KERNEL=="event*", ATTRS{name}=="Apple Keyboard", SYMLINK+="input/apple-keyboard"

# Gamepad
SUBSYSTEM=="input", KERNEL=="js*", ATTRS{idVendor}=="054c", ATTRS{idProduct}=="09cc", MODE="0660", GROUP="input", SYMLINK+="input/ps4-controller"
```

### GPU / DRM

```udev
# /etc/udev/rules.d/99-gpu.rules

# Allow video group access to render nodes
KERNEL=="renderD*", MODE="0660", GROUP="video"

# Allow video group access to KMS
KERNEL=="card*", MODE="0660", GROUP="video"

# NVIDIA specific
KERNEL=="nvidia*", MODE="0660", GROUP="video"
KERNEL=="nvidiactl", MODE="0660", GROUP="video"
KERNEL=="nvidia-modeset", MODE="0660", GROUP="video"
KERNEL=="nvidia-uvm", MODE="0660", GROUP="video"
KERNEL=="nvidia-uvm-tools", MODE="0660", GROUP="video"
```

### Block Device Permissions

```udev
# /etc/udev/rules.d/99-block.rules

# Allow 'storage' group to access removable drives
SUBSYSTEM=="block", ATTR{removable}=="1", GROUP="storage", MODE="0660"

# Specific encrypted drive
SUBSYSTEM=="block", ENV{ID_FS_TYPE}=="crypto_LUKS", GROUP="disk", MODE="0660"

# NVMe namespaces
KERNEL=="nvme[0-9]n[0-9]", GROUP="disk", MODE="0660"
```

### Run Programs on Events

```udev
# /etc/udev/rules.d/99-run.rules

# Notify on USB insert
ACTION=="add", SUBSYSTEM=="usb", RUN+="/usr/local/bin/usb-notify.sh add $env{DEVNAME}"

# Auto-mount encrypted drive
ACTION=="add", SUBSYSTEM=="block", ENV{ID_FS_TYPE}=="crypto_LUKS", ENV{ID_FS_UUID}=="abc123", RUN+="/usr/local/bin/auto-unlock.sh %k"

# Rescan partitions on change
ACTION=="change", SUBSYSTEM=="block", RUN+="/usr/bin/partx -u /dev/%k"

# Reload firewall on network change
ACTION=="add", SUBSYSTEM=="net", RUN+="/usr/local/bin/fw-reload.sh"
```

## Managing udev

### Reload Rules

```bash
# Reload rules
udevadm control --reload-rules

# Trigger reprocessing of existing devices
udevadm trigger

# Trigger specific subsystem
udevadm trigger --subsystem-match=block
udevadm trigger --subsystem-match=usb

# Trigger specific device
udevadm trigger /dev/sda
```

### Debugging

```bash
# Monitor events in real-time
udevadm monitor
udevadm monitor --kernel
udevadm monitor --udev
udevadm monitor --property

# Show device info
udevadm info /dev/sda
udevadm info -a /dev/sda  # All parent attributes
udevadm info -q all /dev/sda
udevadm info -q property /dev/sda
udevadm info -q symlink /dev/sda

# Test rule matching
udevadm test /dev/sda
udevadm test --action=add /devices/pci0000:00/.../block/sda

# Dry run rule processing
udevadm test-builtin "path_id" /devices/pci0000:00/.../block/sda
```

### Query Device Properties

```bash
# Get all properties for a device
udevadm info --query=property --name=/dev/sda

# Get specific property
udevadm info --query=property --name=/dev/sda | grep ID_SERIAL

# Get sysfs path
udevadm info --query=path --name=/dev/sda
```

## systemd-udevd Service

```ini
# /etc/systemd/system/systemd-udevd.service.d/override.conf
[Service]
# Increase limits for many devices
LimitNOFILE=1048576
LimitNPROC=1048576

# Logging
LogLevel=info
```

```bash
systemctl daemon-reload
systemctl restart systemd-udevd
```

## Persistent Naming (systemd)

### Link Files (Preferred over udev NAME=)

```ini
# /etc/systemd/network/10-persistent-net.link
[Match]
MACAddress=aa:bb:cc:dd:ee:ff

[Link]
Name=lan0
MTUBytes=9000
```

```ini
# /etc/systemd/network/10-nvme.link
[Match]
Driver=nvme

[Link]
NamePolicy=kernel database onboard slot path
```

### Name Policies

| Policy | Description |
|--------|-------------|
| `kernel` | Kernel name (eth0, nvme0n1) |
| `database` | BIOS/UEFI provided names |
| `onboard` | Onboard device names (eno1) |
| `slot` | PCI slot names (ens1p2) |
| `path` | Physical path names (enp3s0) |
| `mac` | MAC-based names (enx001122334455) |

## Common Patterns

### Match by Vendor/Product ID

```bash
# Find IDs
lsusb
# Bus 001 Device 004: ID 046d:c52b Logitech Unifying Receiver

# Rule
SUBSYSTEM=="usb", ATTRS{idVendor}=="046d", ATTRS{idProduct}=="c52b", MODE="0666", GROUP="plugdev"
```

### Match by Serial

```bash
# Find serial
udevadm info -a -n /dev/ttyUSB0 | grep -i serial
# ATTRS{serial}=="FT123456"

# Rule
SUBSYSTEM=="tty", ATTRS{serial}=="FT123456", SYMLINK+="my-device"
```

### Match by Filesystem UUID/Label

```udev
# These are set by systemd-udevd after filesystem detection
ENV{ID_FS_UUID}=="1234-5678", SYMLINK+="disk/by-uuid/1234-5678"
ENV{ID_FS_LABEL}=="BACKUP", SYMLINK+="disk/by-label/BACKUP"
```

### Match Parent Attributes

```udev
# Match USB device by parent hub
SUBSYSTEM=="tty", KERNELS=="1-1.2", SYMLINK+="my-usb-serial"

# Match by PCI device
SUBSYSTEM=="net", KERNELS=="0000:03:00.0", NAME="lan0"
```

## Troubleshooting

### Rules Not Applying

```bash
# Check rule syntax
udevadm test /dev/sda 2>&1 | grep -E "(RUN|SYMLINK|MODE|GROUP)"

# Check rule file parsing
udevadm control --log-priority=debug
udevadm trigger
journalctl -u systemd-udevd -f
```

### Symlinks Not Created

```bash
# Check if rule matched
udevadm test /dev/sda | grep SYMLINK

# Check if device already has node
ls -la /dev/sda

# Force recreate
udevadm trigger --action=add /dev/sda
```

### Permissions Not Applied

```bash
# Check final mode
udevadm test /dev/sda | grep MODE

# Check if later rule overrides
grep -r "MODE" /etc/udev/rules.d/ /usr/lib/udev/rules.d/ | grep sda

# Use := to prevent override
MODE:="0660"
```

### Device Not Appearing

```bash
# Check kernel sees it
dmesg -T | grep -i usb
lsusb -t

# Check udev sees it
udevadm monitor --udev
# Plug device, watch for events

# Check rules
udevadm test /sys/bus/usb/devices/1-1.2
```

## udevadm Commands Reference

```bash
# Control
udevadm control --reload-rules
udevadm control --log-priority=debug
udevadm control --stop-exec-queue
udevadm control --start-exec-queue

# Trigger
udevadm trigger
udevadm trigger --subsystem-match=block
udevadm trigger --action=add /dev/sda

# Info
udevadm info [options] /dev/sda
  -q, --query=TYPE        # all, name, symlink, path, property
  -a, --attribute-walk    # Walk parent chain
  -n, --name=NAME         # Device node name
  -p, --path=PATH         # Sysfs path
  -r, --root=DIR          # Root directory

# Monitor
udevadm monitor [options]
  -k, --kernel            # Kernel events
  -u, --udev              # udev events (default)
  -p, --property          # Show properties

# Test
udevadm test [options] /dev/sda
  -a, --action=ACTION     # add, remove, change
  --seq-num=NUM           # Sequence number

# Builtin commands
udevadm test-builtin COMMAND /dev/sda
  path_id                 # Generate persistent names
  usb_id                  # USB device ID
  net_id                  # Network interface ID
  hwdb                    # Hardware database
```

## Hardware Database (hwdb)

```bash
# /etc/udev/hwdb.d/99-custom.hwdb

# Match USB device
usb:v046DpC52B*
 KEYBOARD_KEY_70028=leftmeta  # Remap key
 KEYBOARD_KEY_70029=rightmeta

# Match PCI device
pci:v00008086d00001533*
 ID_NET_NAME_MAC=enp3s0
```

```bash
# Compile hwdb
systemd-hwdb update
udevadm trigger
```

## Best Practices

1. **Use `/etc/udev/rules.d/`** for custom rules (not `/lib`)
2. **Number prefixes**: `99-` for custom, `70-` for persistent net, `60-` for storage
3. **Use `+=`** for SYMLINK, TAG, ENV to append
4. **Use `:=`** for MODE, OWNER, GROUP to prevent override
5. **Avoid `NAME=`** - use systemd link files instead
6. **Test with `udevadm test`** before deploying
7. **Keep rules simple** - one rule per device type
8. **Use `ENV{ID_*}`** for filesystem properties (set by systemd)
9. **Group by SUBSYSTEM** for organization
10. **Document rules** with comments

## Security Considerations

```udev
# Restrict device access
# Default: root:root 0600
# Only relax for specific devices

# Good: specific device
SUBSYSTEM=="usb", ATTRS{idVendor}=="1050", MODE="0660", GROUP="plugdev"

# Bad: too broad
SUBSYSTEM=="usb", MODE="0666"

# Use TAG+="uaccess" for logind-managed devices (seat devices)
SUBSYSTEM=="input", TAG+="uaccess"
```