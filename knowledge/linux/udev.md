# udev: Device Management

udev manages `/dev` nodes, hotplug events, and persistent naming. Flow: kernel uevent → systemd-udevd → rules → actions (symlinks, perms, RUN).

## Rule Files (priority order)
```
/etc/udev/rules.d/*.rules     # admin/custom (use 99- prefix)
/lib/udev/rules.d/*.rules     # vendor/package
/run/udev/rules.d/*.rules     # runtime
```

## Rule Syntax
```udev
# /etc/udev/rules.d/99-custom.rules
ACTION=="add", SUBSYSTEM=="block", KERNEL=="sd*", ATTR{size}=="20971520", SYMLINK+="mydisk", OWNER="user", GROUP="disk", MODE="0660"
```
Match keys: `ACTION`, `SUBSYSTEM`, `KERNEL`, `ATTR{...}`, `ATTRS{...}` (parent), `ENV{...}`, `KERNELS`, `SUBSYSTEMS`, `DRIVERS`.
Assignment: `SYMLINK+=`, `OWNER=`, `GROUP=`, `MODE=`, `RUN+=`, `TAG+=`. Use `:=` for MODE/OWNER/GROUP to prevent override.

## Common Rules
```udev
# Persistent disk by serial
ACTION=="add", SUBSYSTEM=="block", ATTRS{serial}=="SERIAL123", SYMLINK+="disk/by-id/mydisk"

# USB-serial (FTDI) permissions
SUBSYSTEM=="tty", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6001", MODE="0666", GROUP="dialout", SYMLINK+="usbserial-%k"

# YubiKey / Android for user
SUBSYSTEM=="usb", ATTRS{idVendor}=="1050", MODE="0666", GROUP="plugdev"

# GPU render nodes
KERNEL=="renderD*", MODE="0660", GROUP="video"

# Run program on event
ACTION=="add", SUBSYSTEM=="usb", RUN+="/usr/local/bin/usb-notify.sh add $env{DEVNAME}"
```

## Manage & Debug
```bash
udevadm control --reload-rules          # reload rules
udevadm trigger                          # reprocess devices
udevadm trigger --subsystem-match=usb
udevadm monitor --property               # watch events live
udevadm info /dev/sda                    # device properties
udevadm info -a /dev/sda                 # walk parent attributes
udevadm info -q property -n /dev/sda | grep ID_SERIAL
udevadm test /dev/sda                    # dry-run rule processing
```

## Persistent Network Names (prefer systemd .link over NAME=)
```ini
# /etc/systemd/network/10-lan0.link
[Match]
MACAddress=aa:bb:cc:dd:ee:ff
[Link]
Name=lan0
```
Name policies: `kernel`, `database`, `onboard`, `slot`, `path`, `mac`.

## Best Practices
1. Put custom rules in `/etc/udev/rules.d/`.
2. Use `99-` prefix for custom, `70-` for net, `60-` for storage.
3. Use `+=` to append, `:=` to lock perms.
4. Avoid `NAME=`; use systemd link files for network.
5. Test with `udevadm test` before deploying.
6. Keep rules specific (avoid broad `MODE="0666"` on `SUBSYSTEM=="usb"`).
