# Linux Audio & Multimedia

## Audio Systems Overview

### ALSA (Advanced Linux Sound Architecture)
- Kernel-level sound driver
- Direct hardware access
- No network audio support
- Works alone or with PulseAudio/PipeWire

### PulseAudio
- Userspace sound server
- Per-application volume control
- Network audio streaming
- Deprecated in favor of PipeWire

### PipeWire
- Modern audio/video server
- Low latency, real-time
- Backwards compatible with PulseAudio
- Handles audio/video capture and playback
- Default on modern distros

## Audio System Status

```bash
# Check which server is running
pactl info | grep "Server Name"
wpctl status                           # PipeWire version

# Check audio devices
aplay -l                                # ALSA playback devices
arecord -l                              # ALSA capture devices
pactl list sinks                        # PulseAudio/PipeWire outputs
pactl list sources                      # PulseAudio/PipeWire inputs
pactl list sink-inputs                  # Active playback streams
pactl list source-outputs               # Active capture streams

# Check server status
systemctl --user status pipewire
systemctl --user status pulseaudio
systemctl --user status wireplumber
```

## Pipewire Configuration

### Config Files
```bash
# User config
~/.config/pipewire/pipewire.conf
~/.config/pipewire/media-session.d/

# System config
/usr/share/pipewire/media-session.d/
/usr/share/pipewire/pipewire.conf

# Override config
/etc/pipewire/pipewire.conf
/etc/pipewire/media-session.d/
```

### Common Fixes
```bash
# Restart PipeWire
systemctl --user restart pipewire pipewire-pulse wireplumber

# Reset config
rm -rf ~/.config/pipewire
systemctl --user restart pipewire

# Check latency
pw-top                                  # Real-time monitor
pw-cli info all                         # All objects

# Set buffer size
pactl set-default-fragments 4
pactl set-default-fragment-size-msec 25
```

### Disable Audio Suspension
```bash
# ~/.config/pipewire/media-session.d/audio.conf
monitor.bluez.suspend-node = false

# Or in pipewire.conf for newer versions
context.objects = [
  { factory = adapter
    args = { factory.name = tuner
             node.name = null
             media.role = "Playback"
             monitor.channel-volumes = true
             factory.name = api.alsa.path
             args.device.path = null
             api.alsa.card = null } }
```

## ALSA Mixer Controls

```bash
# ALSA mixer
amixer                                 # All controls
amixer controls                        # Control IDs
amixer cget numid=3                    # Get specific control
amixer cset numid=3 80%                # Set specific control

# Interactive mixer
alsamixer                             # TUI interface
alsamixer -c 1                        # Select card

# Common controls
amixer set Master 80%                  # Master volume
amixer set Master unmute               # Unmute master
amixer set Capture 100%                # Capture volume
amixer set 'Headphone' 90%            # Headphone volume
amixer set 'Front' capture 0%        # Disable front mic
amixer set 'Rear' capture 100%       # Enable rear mic

# Save/restore
sudo alsactl store                    # Save state
sudo alsactl restore                   # Restore state
```

## PulseAudio Commands

```bash
# Volume control
pactl set-sink-volume @DEFAULT_SINK@ 80%
pactl set-sink-mute @DEFAULT_SINK@ toggle
pactl set-source-volume @DEFAULT_SOURCE@ 100%

# List devices
pactl list short sinks
pactl list short sources
pactl list short sink-inputs

# Set default
pactl set-default-sink alsa_output.pci-0000_00_1b.0.analog-stereo

# Move stream to different sink
pactl move-sink-input 42 alsa_output.usb-headphones.analog-stereo

# Module management
pactl load-module module-bluetooth-discover
pactl unload-module module-bluetooth-discover
pactl list modules short

# Client management
pactl list clients
pactl kill-client 12
```

## Audio Testing

```bash
# Test speakers
speaker-test -c 2 -l 5 -t wav              # Stereo, 5 loops, WAV
speaker-test -D hw:0,0 -c 2 -l 5 -t sine

# Test recording
arecord -d 5 -f cd test.wav
aplay test.wav

# Volume test with sox
play -n synth 3 sine 440 vol 0.5         # 3 seconds, 440Hz, 50% volume

# Check levels
pavucontrol                               # GUI mixer
pactl list sink-inputs | grep -E "Volume|Mute"
```

## Bluetooth Audio

```bash
# Check Bluetooth status
bluetoothctl show
bluetoothctl list
bluetoothctl paired-devices

# Pair device
bluetoothctl
> scan on
> pair XX:XX:XX:XX:XX:XX
> trust XX:XX:XX:XX:XX:XX
> connect XX:XX:XX:XX:XX:XX

# Audio profile
pactl list cards short
pactl set-card-profile 0 a2dp_sink
pactl set-card-profile 0 a2dp_source
pactl set-card-profile 0 off

# Bluetooth troubleshooting
sudo systemctl restart bluetooth
sudo systemctl restart pipewire-pulse

# Disable Bluetooth auto-switch
# ~/.config/autostart/bluetooth-autoconnect.desktop
[Desktop Entry]
Hidden=true
```

## Troubleshooting Audio Issues

### No Sound
```bash
# Check muted
pactl list sinks | grep -A 5 "Mute"
amixer get Master

# Check output device
pactl list sinks short
pactl set-default-sink @DEFAULT_SINK@

# Restart services
systemctl --user restart pipewire pipewire-pulse wireplumber
# Or older systems:
pulseaudio -k && pulseaudio --start

# Check kernel messages
dmesg | grep -i "snd\|sound\|audio"
journalctl -xe | grep -i pulse
```

### Audio Crackling/Choppy
```bash
# Check buffer underruns
journalctl --user -u pipewire -b | grep -i xrun

# Increase buffer
# In /etc/pulse/daemon.conf or ~/.config/pulse/daemon.conf
default-fragments = 8
default-fragment-size-msec = 50

# Or with PipeWire
# In /etc/pipewire/pipewire.conf
context.properties = [
  { default.clock.rate      = 48000 }
  { default.clock.allowed-rates = [ 44100 48000 96000 ] }
  { default.clock.quantum   = 1024 }
]
```

### Microphone Not Working
```bash
# Check input level
pactl list sources | grep -A 10 "Mute"
pactl set-source-mute @DEFAULT_SOURCE@ 0

# Check which input is used
pactl list source-outputs

# Select input
pactl set-default-source alsa_input.pci-0000_00_1b.0.analog-stereo

# USB audio priority (to avoid switching)
# Add to /etc/modprobe.d/alsa-base.conf
options snd_usb_audio index=-1
```

## JACK Audio Connection Kit

```bash
# Start JACK (with PipeWire)
pw-jack jackd                            # Automatically configured

# Manual start
jackd -d alsa -r 48000 -p 256 -n 2

# Connections
jack_lsp                                 # List ports
jack_connect source sink                   # Connect
jack_disconnect source sink              # Disconnect

# Tools
qjackctl                                 # GUI patchbay
catia                                    # Patchbay GUI
```

## Audio Recording & Streaming

```bash
# Simple recording
arecord -D hw:0,0 -f cd -d 10 output.wav

# With format conversion
ffmpeg -f alsa -i hw:0 -t 10 -acodec pcm_s16le output.wav
ffmpeg -f alsa -i hw:0 -t 10 output.mp3

# Streaming
# Send to another machine
ffmpeg -f alsa -i hw:0 -f mpegts udp://192.168.1.100:1234
# Receive
ffplay udp://@:1234

# PulseAudio network streaming
# Server: load-module module-native-protocol-tcp auth-anonymous=1 port=4713
# Client: PULSE_SERVER=server_ip pactl list sinks
```

## Video Playback & Capture

```bash
# Video players
mpv --no-audio video.mp4                 # No audio
mpv --audio-device=alsa/hdmi C0D0 video.mp4  # Specific audio
vlc --intf dummy video.mp4               # No interface

# Recording desktop
# With ffmpeg (X11)
ffmpeg -f x11grab -framerate 30 -video_size 1920x1080 -i $DISPLAY output.mp4

# With wf-recorder (Wayland)
wf-recorder -g "$(slurp)" -f output.mp4

# Screen + audio recording
wf-recorder -g "$(slurp)" -a default -f output.mp4

# Webcam recording
ffmpeg -f v4l2 -i /dev/video0 -t 10 output.mp4
ffmpeg -f v4l2 -framerate 30 -video_size 1280x720 -i /dev/video0 output.mp4
```

## Video Editing & Processing

```bash
# ffmpeg common operations
ffmpeg -i input.mp4 -c:v libx264 -preset fast -crf 23 output.mp4
ffmpeg -i input.mp4 -vf scale=1280:720 output.mp4
ffmpeg -i input.mp4 -ss 00:01:00 -t 00:00:30 -c copy clip.mp4
ffmpeg -i input1.mp4 -i input2.mp4 -filter_complex hstack output.mp4
ffmpeg -i input.mp4 -vf fps=2 output_%04d.png         # Extract frames
ffmpeg -i input.mp4 -vn -acodec copy audio.aac       # Extract audio
ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -c:a aac output.mp4  # Combine

# Image processing
ffmpeg -i input.png -vf scale=800:600 output.png
ffmpeg -i input.jpg -vf hue=s=0 output.png              # Grayscale
ffmpeg -i input.mp4 -vf "crop=1280:720:0:0" output.mp4  # Crop
```

## Audio/Video Tools

```bash
# Install common tools
sudo apt install ffmpeg sox pavucontrol pulseaudio-utils
sudo apt install vlc mpv obs-studio kdenlive
sudo apt install jackd2 qjackctl

# Format conversion
ffmpeg -i input.flac -c:a libmp3lame output.mp3
ffmpeg -i input.wav -c:a flac output.flac
ffmpeg -i input.mp4 -c:v libx265 output.mp4

# Metadata
ffmpeg -i input.mp4 -c copy -metadata title="My Video" output.mp4
exiftool input.mp4                       # View metadata
```

## Hardware-Specific Audio

### Intel HD Audio
```bash
# Check codec
cat /proc/asound/card*/codec#*
grep -r "snd" /proc/asound/cards

# Parameters
# /etc/modprobe.d/audio.conf
options snd_hda_intel model=auto
options snd_hda_intel enable_msi=1
options snd_hda_intel power_save=1
```

### NVIDIA HDMI Audio
```bash
# Check device
aplay -l | grep -i nvidia
pacmd list-cards | grep -A 10 "nvidia"

# Force HDMI audio
xrandr --output HDMI-0 --set audio on
```

### USB Audio Priority
```bash
# Prevent USB audio from becoming default
# /etc/modprobe.d/alsa-order.conf
options snd_usb_audio index=-1
options snd_hda_intel index=0
```