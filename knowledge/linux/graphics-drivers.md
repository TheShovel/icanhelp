# Linux Graphics Drivers

## Driver Overview
- **Intel**: open-source `i915` in kernel. `sys kern lsmod | grep i915`.
- **AMD**: open-source `amdgpu` (modern), `radeon` (legacy). `sys kern lsmod | grep amdgpu`.
- **NVIDIA**: proprietary `nvidia` (best perf, CUDA) or open `nouveau`. Wayland needs `nvidia` ≥ 470 with `nvidia-drm.modeset=1`.

## Check Hardware & Driver
```bash
lspci -k | grep -iA2 vga        # GPU + loaded driver
sys kern lsmod | grep -E "i915|amdgpu|nvidia|radeon"
glxinfo | grep "OpenGL renderer"
vulkaninfo --summary            # Vulkan caps
```

## Install drivers (use `sys pkg`)
```bash
sys pkg install nvidia nvidia-utils   # Arch (verified syntax)
sys pkg install xf86-video-amdgpu     # AMD Xorg
sys pkg install mesa vulkan-radeon    # open Mesa stack
```

## NVIDIA tools (native, need driver loaded)
```bash
nvidia-smi                          # GPU info
nvidia-smi -l 1                     # live monitor
nvidia-smi -pm 1                    # persistence mode
nvidia-settings -q all              # all settings
```

## Monitor Configuration
### X11 (xrandr — verified)
```bash
xrandr --listmonitors
xrandr --output HDMI-1 --mode 1920x1080 --rate 120
xrandr --output HDMI-1 --right-of eDP-1
xrandr --output eDP-1 --scale 0.5x0.5
xrandr --output HDMI-1 --rotate left
```

### Wayland
```bash
swaymsg output HDMI-A-1 mode 1920x1080 enable
swaymsg output eDP-1 scale 1.5
hyprctl monitors
```

## HiDPI
```bash
gsettings set org.gnome.desktop.interface scaling-factor 2
export GDK_SCALE=2
export QT_AUTO_SCREEN_SCALE_FACTOR=1
```

## Kernel module / initramfs
```bash
sys kern blacklist nouveau     # persistently block a module
sys kern modprobe nvidia       # load a module now
sys kern initramfs             # rebuild initramfs after driver changes
```

## Troubleshooting
- **Black screen**: add `nomodeset` to kernel cmdline (temporary, at GRUB `e`). Check `sys log boot | grep -i "drm\|gpu"`.
- **No 3D**: `glxinfo | grep "direct rendering"`.
- **Screen tearing (X11)**: add `Option "TearFree" "true"` to the device section in `/etc/X11/xorg.conf.d/`.
- **Low perf**: `nvidia-smi -q` (NVIDIA); check compositor with `ps aux | grep -E "kwin|sway"`.

## Tools
```bash
intel_gpu_top        # Intel (sudo)
radeontop            # AMD (sudo)
nvtop                # NVIDIA/hybrid
glmark2              # benchmark (sys pkg install glmark2)
```
