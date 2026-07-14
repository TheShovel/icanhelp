# Linux Bluetooth (BlueZ)

## Stack
- BlueZ is the Linux stack; `bluetoothctl` is the CLI. `bluetoothctl --version` → 5.87 (verified).
- Audio profiles (A2DP, HSP/HFP) are handled by PipeWire/PulseAudio via `pactl`.

## Service (use `sys svc`)
```bash
sys svc status bluetooth          # running?
sys svc enable --now bluetooth    # start + persist
sys svc restart bluetooth         # reset (do not delete /var/lib/bluetooth unless re-pairing)
```

## Pairing (verified)
```bash
bluetoothctl
> power on
> agent on
> scan on
> pair XX:XX:XX:XX:XX:XX
> trust XX:XX:XX:XX:XX:XX
> connect XX:XX:XX:XX:XX:XX
> scan off
```
Non-interactive one-liner:
```bash
printf 'power on\nagent on\nscan on\npair XX:XX:XX:XX:XX:XX\ntrust XX:XX:XX:XX:XX:XX\nconnect XX:XX:XX:XX:XX:XX\nscan off\n' | bluetoothctl
```

## Common commands (verified)
```bash
bluetoothctl show                 # controller info
bluetoothctl list                 # adapters
bluetoothctl devices              # discovered
bluetoothctl paired-devices
bluetoothctl info XX:XX:XX:XX:XX:XX
bluetoothctl connect XX:XX:XX:XX:XX:XX
bluetoothctl disconnect XX:XX:XX:XX:XX:XX
bluetoothctl remove XX:XX:XX:XX:XX:XX
```

## Audio profile (verified)
```bash
pactl list cards short
pactl set-card-profile 0 a2dp_sink          # high-quality playback
pactl set-card-profile 0 headset_head_unit  # mic + audio
```

## Troubleshooting
```bash
sys svc status bluetooth
rfkill list && sudo rfkill unblock bluetooth
sys kern lsmod | grep -i bluetooth
dmesg | grep -i bluetooth
sys log follow bluetooth
```
- **No audio**: `pactl set-card-profile 0 a2dp_sink`; restart `systemctl --user restart pipewire wireplumber`.

## Note on legacy tools
`hciconfig`, `hcitool`, `gatttool` are deprecated/removed in modern BlueZ — use `bluetoothctl` and `btmon` instead.
