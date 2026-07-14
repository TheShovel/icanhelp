# USB Device Management

## Discovery (safe)
```bash
lsusb                     # list devices
lsusb -t                  # tree (shows speed: 480M, 5000M)
lsusb -v                  # verbose
lsusb -d 0781:5567        # filter vendor:product
lsusb -s 1:2              # bus:device
lsusb -D /dev/bus/usb/001/005   # full descriptor
```

## sysfs Interface
```bash
ls /sys/bus/usb/devices/          # device tree
cat /sys/bus/usb/devices/1-1.2/product
cat /sys/bus/usb/devices/1-1.2/idVendor
cat /sys/bus/usb/devices/1-1.2/speed     # 12M, 480M, 5000M
```

## Control & Power
```bash
echo 1 > /sys/bus/usb/devices/1-1.2/authorized     # re-authorize
echo 0 > /sys/bus/usb/devices/1-1.2/authorized     # soft remove
echo auto > /sys/bus/usb/devices/1-1.2/power/control
echo enabled > /sys/bus/usb/devices/1-1.2/power/wakeup
```

## udev Rules
```udev
# /etc/udev/rules.d/99-usb.rules
SUBSYSTEM=="usb", ATTRS{idVendor}=="0781", ATTRS{idProduct}=="5567", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="tty", ATTRS{idVendor}=="067b", ATTRS{idProduct}=="2303", SYMLINK+="modem0"
KERNEL=="sd*", SUBSYSTEM=="block", ENV{ID_BUS}=="usb", ENV{UDISKS_AUTO}="0"
```
```bash
udevadm control --reload-rules
udevadm trigger
udevadm test /sys/bus/usb/devices/1-1.2/
```

## USB Storage
```bash
sys disk list                # find device (lsblk)
mkdir -p /mnt/usb
mount /dev/sdb1 /mnt/usb
udisksctl mount -b /dev/sdb1           # user mount
umount /mnt/usb
udisksctl power-off -b /dev/sdb        # safe eject
```

## Serial Adapters
```bash
lsusb | grep -i serial
dmesg | tail -50
ls -l /dev/ttyUSB*
usermod -a -G dialout $USER           # permanent access
```
Common chips: FTDI `0403:6001`, Silicon Labs `10c4:ea60`, Prolific `067b:2303`, CH341 `1a86:7523`.

## Troubleshooting
```bash
lsusb; dmesg | tail -50               # not recognized
cat /sys/bus/usb/devices/1-1.2/speed  # slow? check speed
dmesg | grep -i "reset\|error"
lsof /dev/ttyUSB0                     # conflicts
groups | grep dialout                 # permission denied
```
Speed classes: Low 1.5M, Full 12M, High 480M, SuperSpeed 5G, SuperSpeed+ 10G+.
