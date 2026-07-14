# Linux Graphics Drivers

## Driver Overview

### Intel Graphics
- Open source `i915` driver included in kernel
- Supports Intel HD/UHD/Xe graphics
- Default on most laptops
- Good power management, good performance

### AMD Graphics
- Open source `amdgpu` driver (modern cards)
- Legacy `radeon` driver (older cards)
- Vulkan support via `mesa`
- Good performance, excellent open-source

### NVIDIA Graphics
- Proprietary `nvidia` driver (best performance)
- Open source `nouveau` (reverse-engineered)
- CUDA support only on proprietary
- Wayland has compatibility issues

## Intel graphics

### Driver Installation
```bash
# Usually pre-installed
sudo apt install intel-media-va-driver-non-free
sudo apt install intel-gpu-tools
sudo dnf install intel-media-driver
```

### Performance Tuning
```bash
# Check driver
lspci -k -s 00:02.0
lsmod | grep i915

# Enable features
# /etc/modprobe.d/i915.conf
options i915 enable_dc=2                # Display C-states power saving
options i915 enable_fbc=1               # Frame buffer compression
options i915 modeset=1                  # Modesetting
options i915 enable_psr=1               # Panel self-refresh

# Power management
cat /sys/module/i915/parameters/enable_dc
cat /sys/module/i915/parameters/enable_psr

# Runtime power saving
echo low | sudo tee /sys/power/cpu_dma_latency
```

### Intel Tools
```bash
# Intel GPU tools
sudo intel_gpu_top                       # Real-time monitor
intel_reg_dumper                         # Register dump
intel_freq                               # Frequency info

# Display tools
xrandr --listproviders
xrandr --prop
xrandr --verbose
```

## AMD graphics

### Driver Installation
```bash
# Usually pre-installed for modern cards
sudo apt install mesa-vulkan-drivers
sudo dnf install mesa-vulkan-drivers

# For older cards (radeon)
# Should load automatically
lsmod | grep radeon
```

### Performance Tuning
```bash
# AMD GPU settings
# /etc/modprobe.d/amd.conf
options amdgpu ppfeaturemask=0xffffffff
options amdgpu pcie_gen=3 pcie_width=16
options amdgpu audio=1

# Check power state
cat /sys/class/drm/card0/device/power_dpm_state
echo performance | sudo tee /sys/class/drm/card0/device/power_dpm_force_performance_level

# Check clocks
cat /sys/class/drm/card0/device/pp_od_clk_voltage

# Power saving
echo battery | sudo tee /sys/class/drm/card0/device/power_dpm_state
```

### AMD Tools
```bash
# AMD monitoring
sudo radeontop                        # AMD GPU monitor
cat /sys/class/drm/card0/device/gpu_busy_percent

# Vulkan info
vulkaninfo --summary
```

## NVIDIA graphics

### Driver Installation
```bash
# Check card
lspci -k -s 01:00.0

# Debian/Ubuntu
sudo apt install nvidia-driver-535
# Or specific version
sudo apt install nvidia-driver-470

# Fedora/RHEL
sudo dnf install akmod-nvidia
sudo dnf install xorg-x11-drv-nvidia-cuda  # For CUDA

# Arch
sudo pacman -S nvidia nvidia-utils

# Check installation
nvidia-smi
lsmod | grep nvidia
```

### NVIDIA Driver Versions
```bash
# Version table (approximate)
# 535 - Latest for RTX 40xx
# 530 - RTX 30xx, RTX 40xx
# 470 - RTX 20xx, older
# 390 - GTX 10xx and older

# Check compatibility
nvidia-smi
# Or: lspci -k -s 01:00.0

# Remove old drivers
sudo nvidia-uninstall
sudo apt purge nvidia-*
sudo dnf remove "*nvidia*"
```

### NVIDIA Configuration
```bash
# NVIDIA settings
nvidia-settings                            # GUI configuration
nvidia-settings -q all                       # All settings

# X11 config (auto-generated)
# /etc/X11/xorg.conf.d/20-nvidia.conf
Section "Device"
    Identifier "NVIDIA Card"
    Driver "nvidia"
    Option "Coolbits" "28"
EndSection

# Coolbits options
# 0x02 - Allow overclocking
# 0x04 - Allow fan control
# 0x08 - Allow overclock offsets
# 0x10 - Allow voltage control
# 0x1c = all features
```

### NVIDIA Tools
```bash
# NVIDIA management
nvidia-smi                                # GPU info
nvidia-smi -l 1                           # Live monitor
nvidia-smi -q                             # Query all
nvidia-smi -p APPLICATION_CLOCK           # Application clocks
nvidia-smi -pl 150                      # Power limit 150W

# Processes using GPU
nvidia-smi pmon

# Persistence mode
sudo nvidia-smi -pm 1                    # Enable
sudo nvidia-smi -pm 0                    # Disable
```

## Wayland + NVIDIA

### Current Status
- NVIDIA does not officially support Wayland
- Use X11 session for NVIDIA
- Or use EGLStreams (experimental)

### Workaround
```bash
# Force X11
# /etc/environment
export GDK_BACKEND=x11
export QT_QPA_PLATFORM=xcb

# Or disable Wayland globally
# /etc/gdm/custom.conf
WaylandEnable=false
```

## Monitor Configuration

### xrandr (X11)
```bash
# List outputs
xrandr --listmonitors
xrandr --query

# Set resolution
xrandr --output HDMI-1 --mode 1920x1080
xrandr --output HDMI-1 --rate 120

# Position monitors
xrandr --output HDMI-1 --pos 0x0
xrandr --output DP-1 --right-of HDMI-1

# Mirror displays
xrandr --output HDMI-1 --same-as eDP-1

# Rotate
xrandr --output HDMI-1 --rotate normal
xrandr --output HDMI-1 --rotate left
xrandr --output HDMI-1 --rotate inverted
xrandr --output HDMI-1 --rotate right

# Scaling (HiDPI)
xrandr --output eDP-1 --scale 0.5x0.5        # 50% scaling
xrandr --output HDMI-1 --scale 2x2             # 200% scaling

# Apply and revert
xrandr --auto
xrandr --output HDMI-1 --off
```

### Wayland (Sway/Hyprland)
```bash
# Sway
swaymsg output HDMI-A-1 mode 1920x1080
swaymsg output HDMI-A-1 enable
swaymsg output eDP-1 scale 1.5

# Hyprland
hyprctl monitors
# In config: monitor=HDMI-A-1,1920x1080@120,0x0,1
```

## HiDPI Display

### Global Scaling
```bash
# GNOME
gsettings set org.gnome.desktop.interface scaling-factor 2
gsettings set org.gnome.desktop.interface text-scaling-factor 1.5

# KDE
# System Settings → Display → Scale Display

# Environment variables
export GDK_SCALE=2
export GDK_DPI_SCALE=0.5
export QT_AUTO_SCREEN_SCALE_FACTOR=1
```

### Per-Application
```bash
# Firefox
# about:config → layout.css.devPixelsPerPx = 2

# Chrome
google-chrome --force-device-scale-factor=2

# Electron apps
export ELECTRON_ENABLE_LOGGING=1
```

## Graphics Troubleshooting

### Black Screen
```bash
# Boot parameters
# nomodeset - Disable kernel modesetting
# nouveau.modeset=0 - Disable nouveau KMS
# video=VGA-1:1920x1080 - Force resolution

# Check logs
journalctl -b | grep -i "drm\|gpu"
dmesg | grep -i "nvidia\|amd\|intel"

# Switch to TTY
Ctrl+Alt+F3
# Then diagnose
```

### No 3D Acceleration
```bash
# Check drivers
glxinfo | grep "direct rendering"
glxinfo | grep "OpenGL renderer"

# Check Mesa
glxinfo -B

# Reinstall Mesa
sudo apt reinstall libgl1-mesa-dri
sudo dnf reinstall mesa-dri-drivers
```

### Screen Tearing
```bash
# Intel/X11 - enable vsync
# In /etc/X11/xorg.conf.d/20-intel.conf
Section "Device"
    Identifier "Intel"
    Driver "intel"
    Option "TearFree" "true"
EndSection

# AMD/X11
# /etc/X11/xorg.conf.d/20-amd.conf
Section "Device"
    Identifier "AMD"
    Driver "amdgpu"
    Option "TearFree" "true"
EndSection

# NVIDIA - Force composition pipeline
nvidia-settings --assign CurrentMetaMode="nvidia-auto-select +0+0 { ForceCompositionPipeline = On }"
```

### Low Performance
```bash
# Check power state
sudo intel_gpu_top                   # Intel
sudo radeontop                      # AMD
nvidia-smi -q                       # NVIDIA

# Check compositor
ps aux | grep -E "compton|kwin|sway"
kwin_x11 --replace                # Restart KDE compositor

# Disable compositor for testing
# KDE: Alt+Shift+F12
```

## Vulkan Setup

```bash
# Install
sudo apt install mesa-vulkan-drivers vulkan-tools
sudo dnf install vulkan-loader mesa-vulkan-drivers

# NVIDIA
sudo apt install libvulkan1 libvulkan-nvidia
sudo dnf install nvidia-vulkan

# Check
vulkaninfo
vkcube                                  # Test
```

## OpenGL Setup

```bash
# Install
sudo apt install mesa-utils
sudo dnf install mesa-dri-drivers mesa-libGL

# Check
glxinfo | grep "OpenGL version"
glxgears
```

## Graphics Configuration Files

### X11 Config
```bash
# /etc/X11/xorg.conf.d/20-intel.conf
Section "Device"
    Identifier "Intel Graphics"
    Driver "intel"
    Option "AccelMethod" "sna"
    Option "TearFree" "true"
EndSection

# /etc/X11/xorg.conf.d/20-nvidia.conf
Section "Device"
    Identifier "NVIDIA Card"
    Driver "nvidia"
    Option "Coolbits" "28"
EndSection
```

### Wayland Environment
```bash
# /etc/environment
# Wayland
WAYLAND_DEBUG=1
XDG_SESSION_TYPE=wayland

# Force X11
GDK_BACKEND=x11
QT_QPA_PLATFORM=xcb
```

## Graphics Monitoring

```bash
# Intel
sudo intel_gpu_top

# AMD
sudo radeontop

# NVIDIA
nvidia-smi -l 1
nvtop                                # htop for NVIDIA

# General
glxinfo | head -20
vulkaninfo --summary
```

## Graphics Benchmark Tools

```bash
# Install
sudo apt install glmark2 vulkan-tools
sudo dnf install glmark2

# Run benchmarks
glmark2
glmark2 --fullscreen
glmark2 --annotate
```

## External GPU (eGPU)

```bash
# Check Thunderbolt
lspci | grep -i thunderbolt
boltctl                                 # Thunderbolt devices

# Thunderbolt security
# In BIOS: Security Level = "No Security" or enroll devices

# Authorize device
boltctl authorize device-uuid
boltctl enroll device-uuid

# Check connection
boltctl list
boltctl monitor
```

## Graphics Debugging

```bash
# Enable debug
# /etc/environment
LIBGL_DEBUG=verbose
MESA_DEBUG=1
vblank_mode=0

# Check for errors
dmesg | grep -i "drm\|gpu"
journalctl -b | grep -i "gnome-shell\|kwin"

# Wayland debugging
WAYLAND_DEBUG=1 app
```