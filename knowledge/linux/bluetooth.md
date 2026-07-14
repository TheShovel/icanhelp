# Linux Bluetooth

## Bluetooth Stack

### BlueZ
- Official Linux Bluetooth protocol stack
- Included in most distributions
- Works with `bluetoothctl` CLI tool

### Tools
```bash
sudo apt install bluez bluez-tools
sudo dnf install bluez bluez-tools

# Check version
bluetoothctl --version
hckey --version
```

## Bluetoothctl Commands

```bash
# Start interactive mode
bluetoothctl

# Power and discoverability
menu scan
transport le
back

# Common commands
show                                   # Controller info
list                                   # Paired devices
scan on                                # Start scanning
scan off                               # Stop scanning
devices                                # Show found devices
pair XX:XX:XX:XX:XX:XX                 # Pair with device
trust XX:XX:XX:XX:XX:XX                # Trust device
connect XX:XX:XX:XX:XX:XX             # Connect
disconnect XX:XX:XX:XX:XX:XX          # Disconnect
remove XX:XX:XX:XX:XX:XX             # Remove pairing
info XX:XX:XX:XX:XX:XX               # Device info
menu device                          # Device menu
pairable on                          # Allow pairing
discoverable on                      # Allow discovery
block XX:XX:XX:XX:XX:XX             # Block device
unblock XX:XX:XX:XX:XX:XX           # Unblock device
```

## Pairing New Devices

```bash
# Put device in pairing mode first
bluetoothctl
> power on
> agent on
> pairable on
> discoverable on
> scan on
> pair XX:XX:XX:XX:XX:XX
> trust XX:XX:XX:XX:XX:XX
> connect XX:XX:XX:XX:XX:XX
> scan off

# Quick pair (non-interactive)
echo -e "power on\nagent on\npairable on\ndiscoverable on\nscan on\npair XX:XX:XX:XX:XX:XX\ntrust XX:XX:XX:XX:XX:XX\nconnect XX:XX:XX:XX:XX:XX\nscan off" | bluetoothctl
```

## Bluetooth Profiles

```bash
# Audio profiles
A2DP SINK          # High-quality audio playback
A2DP SOURCE        # Audio recording from remote
HSP/HFP           # Hands-free (calls, mic)
AVRCP              # Remote control (play/pause/skip)

# Other profiles
HID               # Human Interface Device (mouse/keyboard)
PAN               # Personal Area Network (networking)
HSP               # Headset Profile
HFP               # Hands-Free Profile

# Check profiles
pactl list cards short
pactl list cards | grep -A 20 "Profiles"
```

## Audio Profiles Switching

```bash
# List available profiles
pactl list cards | grep -E "Name|Profiles"

# Switch to high-quality audio
pactl set-card-profile 0 a2dp_sink

# Switch to headset (mic + audio)
pactl set-card-profile 0 headset_head_unit

# Switch to off
pactl set-card-profile 0 off

# Auto-switch fix (disable for stability)
# ~/.config/autostart/bluetooth-profile-fix.desktop
[Desktop Entry]
Type=Application
Name=Bluetooth Profile Fix
Exec=pactl set-card-profile 0 a2dp_sink
Hidden=false
NoDisplay=true
X-GNOME-Autostart-Phase=Initialization
```

## Bluetooth Troubleshooting

### Reset Bluetooth
```bash
# Full reset
sudo systemctl restart bluetooth
systemctl --user restart pipewire-pulse

# Clear pairing cache
sudo rm -rf /var/lib/bluetooth/*
rm ~/.config/bluetooth
systemctl --user restart bluetooth-applet  # if applicable

# Reset adapter
sudo hciconfig hci0 down
sudo hciconfig hci0 up
```

### Check Status
```bash
# Check if running
systemctl status bluetooth

# Check adapter
hciconfig -a
hciconfig hci0

# Check rfkill
rfkill list
rfkill unblock bluetooth

# Check kernel modules
lsmod | grep -i bluetooth
dmesg | grep -i bluetooth
```

### Common Issues

#### Device Not Found
```bash
# Make sure discoverable
bluetoothctl
> discoverable on

# Check if blocked
rfkill list
sudo rfkill unblock bluetooth

# Check adapter
hciconfig hci0 up
```

#### Connection Failing
```bash
# Check paired devices
bluetoothctl paired-devices

# Remove and re-pair
bluetoothctl
> remove XX:XX:XX:XX:XX:XX
> scan on
> pair XX:XX:XX:XX:XX:XX

# Clear connection cache
sudo rm -rf /var/lib/bluetooth/*
```

#### No Audio
```bash
# Check PulseAudio/PipeWire
pactl list cards short

# Set correct profile
pactl set-card-profile 0 a2dp_sink

# Restart audio services
systemctl --user restart pipewire pipewire-pulse wireplumber
```

#### Intermittent Audio
```bash
# Disable auto-suspend
# In /etc/bluetooth/main.conf
[LE]
IdleTimeout=0

# Or in PipeWire config
# ~/.config/pipewire/media-session.d/audio.conf
monitor.bluez.suspend-node = false
```

## Bluetooth Files Transfer

```bash
# Send file
bluetooth-sendto --device=XX:XX:XX:XX:XX:XX --file=path/to/file

# Receive file (obexftp)
sudo apt install obexftp
obexftp -b XX:XX:XX:XX:XX:XX -l       # List files on device
obexftp -b XX:XX:XX:XX:XX:XX -g filename  # Get file

# Push file to device
obexftp -b XX:XX:XX:XX:XX:XX -p filename  # Push file
```

## Bluetooth Network (PAN)

```bash
# Enable PAN roles
sudo apt install bluetooth-pan
# /etc/bluetooth/main.conf
[General]
EnableNetworking=true

# Create network bridge
sudo brctl addbr bt-pan
sudo ip addr add 10.1.1.1/24 dev bt-pan
sudo ip link set bt-pan up

# Pair phone with PAN profile
# On phone: Pair, enable Bluetooth tethering
```

## Bluetooth Low Energy (BLE)

```bash
# Scan BLE devices
sudo hcitool lescan
sudo hcitool lescan --duplicates

# GATT tools
sudo apt install bluez-tools
btgatt-client -d XX:XX:XX:XX:XX:XX

# Read/write characteristics
gatttool -b XX:XX:XX:XX:XX:XX --characteristics
gatttool -b XX:XX:XX:XX:XX:XX --char-read --uuid 0x2A37
gatttool -b XX:XX:XX:XX:XX:XX --char-write --uuid 0x2A37 --value=01
```

## Bluetooth Auto-Connect

```bash
# Auto-connect trusted devices
# ~/.config/bluetooth/auto-connect.sh
#!/bin/bash
while true; do
    if ! bluetoothctl info | grep -q "Connected: yes"; then
        bluetoothctl connect XX:XX:XX:XX:XX:XX 2>/dev/null
    fi
    sleep 5
done

# Add to autostart
# ~/.config/autostart/bluetooth-auto-connect.desktop
[Desktop Entry]
Type=Application
Exec=~/.config/bluetooth/auto-connect.sh
Hidden=false
NoDisplay=true
X-GNOME-Autostart-enabled=true
```

## Bluetooth Debugging

```bash
# Enable debug
sudo systemctl stop bluetooth
sudo bluetoothd -d -n

# Check logs
journalctl -u bluetooth -f
dmesg | grep -i "bluetooth\|hci"

# HCI tools
hcitool dev                            # Local adapters
hcitool scan                           # Remote devices
hcitool rssi XX:XX:XX:XX:XX:XX         # Signal strength
hcitool name XX:XX:XX:XX:XX:XX         # Get device name

# LMP features
hcitool features XX:XX:XX:XX:XX:XX
```

## Bluetooth Configuration Files

```bash
# Main config
/etc/bluetooth/main.conf

# Key settings
[General]
Class = 0x000100         # Device class
DiscoverableTimeout = 0   # No timeout
PairableTimeout = 0
AutoEnable = true         # Enable at boot

[LE]
MinConnectionInterval = 12
MaxConnectionInterval = 16
Latency = 44
Timeout = 216
```

## Bluetooth Status Script

```bash
# Quick status
#!/bin/bash
echo "=== Bluetooth Status ==="
hciconfig -a
echo -e "\n=== Paired Devices ==="
bluetoothctl paired-devices
echo -e "\n=== Connected Devices ==="
bluetoothctl info | grep -E "Name|Connected"
```