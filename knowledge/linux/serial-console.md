# Serial Console and Out-of-Band Management

## Device names
- `/dev/ttyS0` — COM1, `/dev/ttyS1` — COM2
- `/dev/ttyUSB0` — USB-serial, `/dev/ttyACM0` — CDC ACM (Arduino)
- `/dev/ttyAMA0` — ARM UART (Raspberry Pi)

## Inspect (verified where present)
```bash
ls -l /dev/tty{S,USB,ACM}*
dmesg | grep -i ttyS
cat /proc/tty/driver/serial
cat /proc/cmdline | grep console
stty -F /dev/ttyS0 115200 cs8 -cstopb -parenb
```

## systemd serial getty (use `sys svc`)
```bash
sys svc enable --now serial-getty@ttyS0.service
# Config override:
# /etc/systemd/system/serial-getty@ttyS0.service.d/override.conf
[Service]
ExecStart=
ExecStart=/usr/sbin/agetty --keep-baud 115200,38400,9600 %I $TERM
```

## Terminal programs
- `screen /dev/ttyS0 115200` (Ctrl+A, Ctrl+\ to quit)
- `minicom -D /dev/ttyS0 -b 115200` (Ctrl+A, Z menu)
- `picocom -b 115200 /dev/ttyS0` (Ctrl+A, Ctrl+X)
- `socat TCP-LISTEN:2000,reuseaddr,fork /dev/ttyS0,b115200,raw,echo=0`

## GRUB serial console (native config — not wrapped by sys)
```
# /etc/default/grub
GRUB_CMDLINE_LINUX="console=tty0 console=ttyS0,115200n8"
GRUB_TERMINAL="console serial"
GRUB_SERIAL_COMMAND="serial --speed=115200 --unit=0 --word=8 --parity=no --stop=1"
```
After editing, regenerate the boot config (see `grub-boot.md`).

## IPMI (install: sys pkg install ipmitool)
```bash
ipmitool chassis status
ipmitool chassis power status
ipmitool chassis power reset
ipmitool sol activate            # serial-over-LAN
ipmitool user list 1
ipmitool lan print 1
```

## Redfish (modern IPMI)
```bash
curl -k https://ipmi-host/redfish/v1/
curl -k -u admin:pass https://ipmi-host/redfish/v1/Systems/1
```

## Troubleshooting
- **No output**: check `cat /proc/cmdline | grep console`, getty status, BIOS COM port.
- **Login fails**: `cat /etc/securetty` should list `ttyS0`; `/dev/ttyS0` perms `crw------- root dialout`.
- **Baud issues**: try `screen /dev/ttyS0 9600` vs `115200`.
