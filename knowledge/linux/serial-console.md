# Serial Console and Out-of-Band Management

## Serial Ports

### Device Names
- `/dev/ttyS0` — COM1 (first serial port)
- `/dev/ttyS1` — COM2 (second serial port)
- `/dev/ttyAMA0` — ARM UART (Raspberry Pi)
- `/dev/ttyUSB0` — USB-to-serial adapter
- `/dev/ttyACM0` — CDC ACM devices (Arduino)

### Check Serial Ports
```bash
# List serial devices
ls -l /dev/tty{S,USB,ACM}*

# Detailed info
setserial -g /dev/ttyS*

# Kernel detection
dmesg | grep -i serial
dmesg | grep ttyS

# Active ports
cat /proc/tty/driver/serial
```

### Serial Port Info
```bash
# UART type and clock
setserial /dev/ttyS0
setserial /dev/ttyS0 uart 16550A
setserial /dev/ttyS0 spd_unknown  # auto speed

# Port parameters
stty -F /dev/ttyS0
stty -F /dev/ttyS0 115200 cs8 -cstopb -parenb

# Save parameters
stty -F /dev/ttyS0 115200 raw -echo
```

## Configure Serial Console

### GRUB Serial Console
```
# /etc/default/grub
GRUB_CMDLINE_LINUX="console=tty0 console=ttyS0,115200n8"
GRUB_TERMINAL="console serial"
GRUB_SERIAL_COMMAND="serial --speed=115200 --unit=0 --word=8 --parity=no --stop=1"
```

### systemd Serial Console
```
# /etc/systemd/system/serial-getty@ttyS0.service
# Usually symlinked to /lib/systemd/system/serial-getty@.service
```

### Enable Serial Getty
```bash
# Enable on ttyS0
systemctl enable serial-getty@ttyS0.service

# Check status
systemctl status serial-getty@ttyS0.service

# Manual start
systemctl start serial-getty@ttyS0.service
```

### Getty Configuration
```
# /etc/systemd/system/serial-getty@ttyS0.service.d/override.conf
[Service]
ExecStart=
ExecStart=/sbin/agetty --keep-baud 115200,38400,9600 %I $TERM
Type=simple
```

## Serial Console Tools

### Screen
- `screen /dev/ttyS0 115200` — connect to serial
- `screen /dev/ttyUSB0 9600` — slower connection
- `Ctrl+A, Ctrl+\` — disconnect
- `Ctrl+A, ?` — help

### Minicom
- `minicom -D /dev/ttyS0 -b 115200` — connect
- `Ctrl+A, Z` — menu
- `Ctrl+A, Q` — quit
- `Ctrl+A, S` — send file

### Picocom
- `picocom -b 115200 /dev/ttyS0` — simple connection
- `Ctrl+A, Ctrl+X` — exit
- No config files needed

### Kermit
- `kermit -c -l /dev/ttyS0 -b 115200` — connect
- `Ctrl+\, Ctrl+C` — exit
- More scripting capabilities

## Serial Login

### Enable Login on Serial
```bash
# systemd getty
systemctl enable serial-getty@ttyS0.service

# Or manually edit inittab (SysV)
echo "S0:12345:respawn:/sbin/agetty -L 115200 ttyS0 vt100" >> /etc/inittab
```

### agetty Options
```bash
agetty -L 115200 ttyS0 vt100
# -L — line (no modem)
# vt100 — terminal type
# -w — wait for carrier
# -i — don't print /etc/issue
# -n — no login prompt
```

### Login Configuration
```
# /etc/securetty
ttyS0
ttyS1
ttyAMA0
```

## IPMI (Intelligent Platform Management Interface)

### Install Tools
```bash
# Debian/Ubuntu
apt install ipmitool

# RHEL/Fedora
dnf install ipmitool
```

### IPMI Commands
- `ipmitool chassis status` — chassis power state
- `ipmitool chassis power status` — power status only
- `ipmitool chassis bootdev pxe` — boot to PXE
- `ipmitool chassis bootdev disk` — boot to disk
- `ipmitool chassis bootdev bios` — boot to BIOS
- `ipmitool sol info 1` — serial-over-LAN info

### Power Control
```bash
ipmitool chassis power on
ipmitool chassis power off
ipmitool chassis power reset
ipmitool chassis power soft  # ACPI shutdown
```

### SOL (Serial Over LAN)
```bash
# Activate console
ipmitool sol activate

# Deactivate
ipmitool sol deactivate

# Configure
ipmitool sol set privilege privilege=administrator
ipmitool sol set timeout timeout=60
```

### IPMI Users
```bash
# List users
ipmitool user list 1

# Add user
ipmitool user set name 2 admin
ipmitool user set password 2 secret
ipmitool user set privilege 2 4  # 4=admin

# Enable user
ipmitool user enable 2
```

### IPMI Network
```bash
# Check LAN config
ipmitool lan print 1

# Set static IP
ipmitool lan set 1 ipaddr 192.168.1.100
ipmitool lan set 1 netmask 255.255.255.0
ipmitool lan set 1 defgw ipaddr 192.168.1.1

# Enable LAN
ipmitool lan set 1 access on
```

## Redfish API (Modern IPMI)

### Check Redfish
```bash
# Using curl
curl -k https://ipmi-host/redfish/v1/

# Using redfish_client (Python)
pip install redfish-client
```

### Redfish Operations
```bash
# Get system info
curl -k -u admin:password https://ipmi-host/redfish/v1/Systems/1

# Power operations
curl -k -u admin:password -X POST -H "Content-Type: application/json" \
  -d '{"ResetType": "ForceOn"}' \
  https://ipmi-host/redfish/v1/Systems/1/Actions/ComputerSystem.Reset
```

## ILO/iDRAC/OOB

### HP iLO
- `hponcfg` — HP iLO scripting
- `hponcfg -f script.xml` — run XML script
- Web interface on port 443

### Dell iDRAC
- SSH on port 22
- `racadm` — command-line tool
- `racadm getsysinfo` — system info

### Supermicro IPMI
- Standard IPMI tools work
- Web interface on port 443

## Serial Console Troubleshooting

### No Output
```bash
# Check boot parameters
cat /proc/cmdline | grep console

# Check getty
systemctl status serial-getty@ttyS0.service

# Check kernel messages
dmesg | grep ttyS

# Check BIOS settings (COM port enabled)
```

### Login Issues
```bash
# Check securetty
cat /etc/securetty | grep ttyS

# Check getty process
ps aux | grep agetty

# Check permissions
ls -l /dev/ttyS0
# Should be crw------- root dialout
```

### Baud Rate Issues
```bash
# Test different rates
screen /dev/ttyS0 9600
screen /dev/ttyS0 115200

# Check current
cat /proc/tty/driver/serial
```

## Serial Cable Pinouts

### DB9 Pinout
```
Pin 2 (RXD) — Receive Data
Pin 3 (TXD) — Transmit Data
Pin 5 (GND) — Ground
Pin 7 (RTS) — Request To Send (optional)
Pin 8 (CTS) — Clear To Send (optional)
```

### Null Modem Cable
- Pins 2↔3 crossed (TX↔RX)
- Pin 5 to pin 5 (GND)
- Handshaking pins optionally connected

## Remote Serial via SSH

### SSH Tunnel
```bash
# Serial over SSH
ssh admin@server "script -t /dev/ttyS0"

# Or using cat
ssh admin@server "cat /dev/ttyS0"

# With socat
socat tcp:server:22,reuseaddr,fork EXEC:"ssh admin@server 'cat'"
```

### socat Serial Bridge
```bash
# Serial to TCP bridge
socat TCP-LISTEN:2000,reuseaddr,fork /dev/ttyS0,b115200,raw,echo=0
```

## Console Redirection

### GRUB Console Redirect
```
# /etc/default/grub
GRUB_CMDLINE_LINUX="console=tty0 console=ttyS0,115200 console=tty1 console=ttyS1,9600"
```

### Multiple Consoles
- `console=tty0` — primary VGA console
- `console=ttyS0,115200` — serial console
- Last console becomes `/dev/console` for syslog

### Early Console
```
# Early printk
earlyprintk=vga,keep
earlyprintk=serial,115200
earlyprintk=serial,115200,ttyS0
```

## Serial Logging

### rsyslog Serial
```
# /etc/rsyslog.conf
# Send logs to serial device
*.* /dev/ttyS0
```

### journalctl Serial
```bash
# Forward journal to serial
systemd-cat -t kernel < /dev/ttyS0

# Or in service
ExecStart=/bin/sh -c 'journalctl -f | tee /dev/ttyS0'
```

## Embedded Systems

### ARM UART
```bash
# Raspberry Pi
dtoverlay=pi3-miniuart-bt  # Use mini UART for BT
enable_uart=1  # Enable UART

# Device
/dev/ttyAMA0  # Primary UART (Pi 3/4)
/dev/ttyS0    # Mini UART
```

### Single Board Computers
- `/dev/ttyS0` — often USB serial
- `/dev/ttyO0` — BeagleBone
- `/dev/ttyACM0` — Arduino bootloader

### U-Boot Serial
```
# U-Boot environment
setenv bootargs "console=ttyS0,115200 root=/dev/mmcblk0p2 rw"
saveenv
```

## Debugging with Serial

### Kernel Debug via Serial
```
# Kernel params
console=ttyS0,115200 earlyprintk loglevel=8 debug ignore_loglevel
```

### Boot Messages Only
```bash
# At boot prompt
# Edit kernel line and add:
earlyprintk=vga,keep loglevel=8

# Or in GRUB
GRUB_CMDLINE_LINUX="earlyprintk=serial,115200 console=ttyS0"
```

### Capture Boot Log
```bash
# Serial capture
script -c "screen /dev/ttyS0 115200" /tmp/boot.log

# Minicom capture
minicom -D /dev/ttyS0 -b 115200 -C /tmp/boot.log
```

## Virtualization Serial

### QEMU/KVM Serial
```bash
# QEMU args
qemu-system-x86_64 -serial mon:stdio -serial pty

# libvirt XML
<serial type='pty'>
  <target port='0'/>
</serial>
```

### VMware Serial
```
# /etc/vmware-tools/tools.conf
[logging]
log = true
```

### Container Serial
```bash
# Docker with serial access
docker run --tty --device /dev/ttyS0:/dev/ttyS0 myapp
```