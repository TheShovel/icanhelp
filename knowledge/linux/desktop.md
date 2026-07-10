# Linux Desktop Environments & Display

## Display Managers
- `gdm` — GNOME Display Manager (Wayland default)
- `sddm` — Qt-based DM (KDE default)
- `lightdm` — lightweight, highly configurable
- `ly` — minimal TUI display manager

## Desktop Environments
- **GNOME** — modern, minimal; default on Ubuntu, Fedora
  - Config: `gsettings`, `gnome-tweaks`, `dconf-editor`
  - Extensions: `extensions.gnome.org`
- **KDE Plasma** — highly customizable, feature-rich
  - Config: `systemsettings`, `kcmshell5`
- **Xfce** — lightweight, traditional (good for old hardware)
- **LXQt** — very lightweight, modular
- **Budgie** — Solus project, modern GNOME-like
- **Cinnamon** — Linux Mint default, traditional desktop
- **Sway** — i3-compatible Wayland compositor (tiling)
- **Hyprland** — dynamic tiling Wayland compositor (eye candy)
- **i3** — classic X11 tiling window manager

## Display Server: Wayland vs X11

### Wayland (modern, default on most distros now)
- Each compositor manages rendering directly
- No screen tearing (built-in vsync)
- Better security (no app can record screen/keyboard without permission)
- `$XDG_SESSION_TYPE=wayland`
- Key env vars: `WAYLAND_DISPLAY=wayland-0`, `XDG_RUNTIME_DIR=/run/user/$UID`
- Screenshot: `grim`, `slurp` (selection), `wf-recorder` (video)
- Clipboard: `wl-clipboard` (`wl-copy`, `wl-paste`)
- Screen info: `wlr-randr`, `kanshictl` (KDE), `gnome-randr`
- Input: `libinput` commands (`libinput list-devices`, `libinput debug-events`)

### X11 (legacy, still widely supported)
- Network-transparent protocol
- `$DISPLAY=:0`
- Config: `/etc/X11/xorg.conf` or `/etc/X11/xorg.conf.d/`
- Screenshot: `import` (ImageMagick), `scrot`, `maim`, `xwd`
- Screen info: `xrandr`, `xprop`, `xwininfo`
- Input: `xinput list`, `xinput set-prop`
- Can run single app: `DISPLAY=:1 xterm &`
- `xdotool` — programmatic mouse/keyboard simulation
- `xclip` / `xsel` — clipboard access

## Wayland Protocols & Tools
- `xdg-shell` — window management protocol
- `layer-shell` — overlay/panel protocol
- `wlr-screencopy` — screen capture (wlroots)
- `ext-image-capture-source` — fractional scaling
- `zwlr-foreign-toplevel-management-v1` — window listing
- Wayland does not support `xdotool` globally; use `ydotool` instead

## Screenshot Tools (by compositor)
- **wlroots** (Sway, Hyprland): `grim`, `slurp`, `wayshot`
- **KDE**: `spectacle` (GUI+CLI)
- **GNOME**: `gnome-screenshot` or built-in screenshot UI
- **X11**: `import`, `scrot`, `maim`, `xwd`
- **General**: `flameshot` (GUI, works on X11+Wayland)

## Environmental Variables (Display)
```bash
# Wayland
export WAYLAND_DISPLAY=wayland-0
export XDG_SESSION_TYPE=wayland
export XDG_CURRENT_DESKTOP=sway  # or GNOME, KDE, Hyprland
export GDK_BACKEND=wayland  # GTK apps
export QT_QPA_PLATFORM=wayland  # Qt apps
export SDL_VIDEODRIVER=wayland

# X11 fallback
export DISPLAY=:0
export XAUTHORITY=~/.Xauthority
# Force XCB instead of Wayland:
export QT_QPA_PLATFORM=xcb
```

## Common Troubleshooting
- **Flickering**: disable compositor or try `export KWIN_COMPOSE=O2`
- **XWayland not starting**: check `/etc/security/limits.conf` for `nofile`, or missing `libxcb`
- **Screen recording broken**: need `xdg-desktop-portal` and backend (`xdg-desktop-portal-wlr`, `xdg-desktop-portal-kde`, `xdg-desktop-portal-gnome`)
- **Fractional scaling**: `gsettings set org.gnome.mutter experimental-features "['scale-monitor-framebuffer']"` or KDE: System Settings → Display → Scale Display
- **HDR**: only supported on recent GNOME/KDE with HDR-capable monitor
