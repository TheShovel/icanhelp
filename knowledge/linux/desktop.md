# Linux Desktop Environments & Display

## Display Managers
- `gdm` — GNOME Display Manager (Wayland default)
- `sddm` — Qt-based DM (KDE default)
- `lightdm` — lightweight, highly configurable

Manage them with `sys svc` (systemd on every distro):
```bash
sys svc status gdm            # status + recent logs
sys svc restart sddm
sys svc enable --now lightdm
```

## Desktop Environments
- **GNOME** — modern, minimal; config via `gsettings`, `dconf-editor`
- **KDE Plasma** — highly customizable; config via `systemsettings`, `kcmshell6`
- **Xfce** — lightweight, traditional
- **Sway** — i3-compatible Wayland compositor (tiling)
- **i3** — classic X11 tiling window manager

Install a DE with `sys pkg`:
```bash
sys pkg install gnome          # meta-package name varies by distro
sys pkg install plasma-meta
```

## Wayland vs X11
- Wayland: `$XDG_SESSION_TYPE=wayland`, `WAYLAND_DISPLAY=wayland-0`. Better security, no screen tearing.
- X11: `$DISPLAY=:0`. Config in `/etc/X11/xorg.conf.d/`.

### Wayland tools (verified present)
```bash
wl-copy / wl-paste            # clipboard (wl-clipboard)
grim                          # screenshot
slurp                         # selection for grim
wf-recorder -g "$(slurp)" -f out.mp4   # screen capture
swaymsg output HDMI-A-1 mode 1920x1080 # Sway
hyprctl monitors              # Hyprland
```

### X11 tools (verified present)
```bash
xrandr --listmonitors         # list outputs
xrandr --query                # all modes
xrandr --output HDMI-1 --mode 1920x1080 --rate 120
xrandr --output HDMI-1 --right-of eDP-1
xrandr --output eDP-1 --scale 0.5x0.5
xrandr --output HDMI-1 --rotate left
xrandr --auto                 # reset
xprop / xwininfo              # window info
xinput list                   # input devices
```

## Display env vars
```bash
export WAYLAND_DISPLAY=wayland-0
export XDG_SESSION_TYPE=wayland
export QT_QPA_PLATFORM=wayland   # Qt apps
export GDK_BACKEND=wayland        # GTK apps
# X11 fallback:
export DISPLAY=:0
export QT_QPA_PLATFORM=xcb
```

## Troubleshooting
- **Screen recording broken**: `sys pkg install xdg-desktop-portal` + backend (`xdg-desktop-portal-wlr`/`-kde`/`-gnome`).
- **Fractional scaling**: GNOME `gsettings set org.gnome.mutter experimental-features "['scale-monitor-framebuffer']"`; KDE via System Settings → Display.
- **Flickering (KDE)**: `export KWIN_COMPOSE=O2`.
- **Display manager won't start**: `sys svc status <dm>` then `sys log errors`.
