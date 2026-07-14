# Linux Audio & Multimedia

## Audio Systems
- **ALSA** — kernel-level driver (`aplay`, `amixer`).
- **PulseAudio** — legacy userspace server.
- **PipeWire** — modern server (audio + video), default on Arch. `pactl`/`wpctl` work with it.

## Status (verified)
```bash
pactl info | grep "Server Name"     # which server
wpctl status                         # PipeWire graph
aplay -l                            # ALSA playback devices
arecord -l                          # ALSA capture devices
pactl list short sinks              # outputs
pactl list short sources            # inputs
systemctl --user status pipewire wireplumber
```

## Install (use `sys pkg`)
```bash
sys pkg install pipewire pipewire-pulse wireplumber   # PipeWire stack
sys pkg install pulseaudio alsa-utils                  # PulseAudio + ALSA tools
```

## ALSA Mixer (verified)
```bash
amixer set Master 80% unmute
amixer set Capture 100%
alsamixer                          # TUI
sudo alsactl store                 # save
```

## Volume & Routing (PulseAudio/PipeWire, verified)
```bash
pactl set-sink-volume @DEFAULT_SINK@ 80%
pactl set-sink-mute @DEFAULT_SINK@ toggle
pactl set-default-sink alsa_output.pci-0000_07_00.6.analog-stereo
pactl move-sink-input 42 @DEFAULT_SINK@
pactl set-card-profile 0 a2dp_sink   # Bluetooth audio
```

## Restart Audio (verified)
```bash
systemctl --user restart pipewire pipewire-pulse wireplumber
```
Note: PipeWire runs as a **user** service, so `systemctl --user` is used (not `sys svc`, which targets the system instance).

## Testing (verified)
```bash
speaker-test -c 2 -l 5 -t wav
arecord -d 5 -f cd test.wav && aplay test.wav
```

## Video (verified)
```bash
mpv video.mp4
ffmpeg -i in.mp4 -c:v libx264 -preset fast -crf 23 out.mp4
ffmpeg -i in.mp4 -vf scale=1280:720 out.mp4
ffmpeg -f x11grab -framerate 30 -video_size 1920x1080 -i $DISPLAY out.mp4   # X11
wf-recorder -g "$(slurp)" -f out.mp4                                        # Wayland
```

## Troubleshooting
- **No sound**: `pactl list short sinks`; unmute with `amixer set Master unmute`; restart services above.
- **Crackling**: increase buffer in `~/.config/pipewire/pipewire.conf` (`default.clock.quantum = 1024`).
- **Mic not working**: `pactl set-default-source <name>`; `pactl set-source-mute @DEFAULT_SOURCE@ 0`.
- **Bluetooth**: `bluetoothctl connect XX:XX:XX:XX:XX:XX`; then `pactl set-card-profile 0 a2dp_sink`.
