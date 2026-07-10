# Linux Troubleshooting & System Recovery

## System Won't Boot
- Hold Shift or spam Esc during BIOS/UEFI → boot menu → select older kernel
- At GRUB: press `e`, find `quiet splash`, replace with `single` or `init=/bin/bash` → Ctrl+X
- From live USB: mount root → `chroot` → repair
```
mount /dev/sda2 /mnt
mount /dev/sda1 /mnt/boot  # if separate
mount -t proc proc /mnt/proc
mount --rbind /sys /mnt/sys
mount --rbind /dev /mnt/dev
chroot /mnt /bin/bash
source /etc/profile
# Now fix: reinstall kernel, rebuild initramfs, fix fstab, etc.
update-initramfs -u       # Debian
dracut --force            # Fedora
mkinitcpio -P             # Arch
```

## Boot Rescue Commands
- `fsck /dev/sda2` — repair filesystem (unmount first)
- `journalctl -xb` — failed boot log
- `systemctl default` — resume normal boot
- `dnf reinstall kernel-core` — reinstall kernel (Fedora)
- `apt install --reinstall linux-image-$(uname -r)` — reinstall kernel (Debian)

## Xorg/Wayland Issues
- Check logs: `grep EE /var/log/Xorg.0.log` (X11)
- Reset display: `systemctl restart display-manager`
- Reset all GPU settings: `mv ~/.config/monitors.xml ~/.config/monitors.xml.bak`
- NVIDIA: check `nvidia-smi` → `prime-select nvidia` → reboot
- Black screen after login: switch TTY (Ctrl+Alt+F2/3), reinstall drivers
- `alt+sysrq+r` (if magic SysRq enabled), then `Ctrl+Alt+F1`

## No Sound
- `pactl info` — check PulseAudio/PipeWire running
- `pactl list sinks` — check default sink
- `wpctl status` — PipeWire status
- `alsamixer` — check mute/unmute (MM → 00)
- `sudo dmesg | grep -i audio` — kernel audio messages
- `sudo fuser -v /dev/snd/*` — what's using audio device
- Restart: `systemctl --user restart pipewire`
- For PulseAudio: `pulseaudio -k && pulseaudio --start`
- Missing firmware: check `dmesg | grep -i firmware`

## No WiFi
- `rfkill list` → `rfkill unblock wifi`
- `nmcli radio wifi on`
- `nmcli dev wifi list`
- `dmesg | grep -i firmware` — missing firmware files
- `sudo modprobe -r <driver> && sudo modprobe <driver>` — reload driver
- Check `lsmod | grep ^wl` or `lsmod | grep iwl` for wireless modules

## Performance Issues
- `htop` or `btop` — find CPU/memory hogs
- `iotop` — find processes causing disk I/O
- `nethogs` — find processes using network
- `journalctl -p err` — system errors
- `dmesg -l err` — kernel errors
- `vmstat 1` — system health every second
- `iostat -x 1` — disk I/O details
- `sar -u 1 5` — CPU usage history (sysstat package)
- Read temps: `sensors` (lm-sensors), `acpi -V`
- Check CPU frequency: `cat /proc/cpuinfo | grep MHz`

## Disk Full
- `du -sh /* | sort -h` — biggest top-level directories
- `du -sh /home/* | sort -h` — user directories
- `ncdu` — interactive disk usage (requires install)
- `find / -type f -size +100M -exec ls -lh {} +` — files > 100 MB
- `journalctl --vacuum-size=100M` — shrink systemd logs
- Snaps: `snap list --all | grep disabled | awk '{print $1}' | xargs -r snap remove`
- Docker: `docker system prune -a`
- Flatpak: `flatpak uninstall --unused`
- npm/pip caches: `rm -rf ~/.npm/_cacache`, `pip cache purge`

## Package Manager Recovery
- Debian: `dpkg --configure -a && apt-get -f install`
- Fedora: `dnf reinstall $(dnf list installed | awk '{print $1}')`
- Arch: `pacman -Syu` then `pacman -S archlinux-keyring` if keyring issues
- General: clear cache: `rm -rf /var/cache/pacman/pkg/*`

## Network Recovery
- `systemctl restart NetworkManager`
- `dhclient -v eth0`
- `ping 8.8.8.8` → if works but `ping google.com` fails → DNS issue
- `resolvectl flush-caches`
- `echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf`
- `ip route add default via 192.168.1.1`
- Reset network stack: `systemctl restart systemd-networkd`

## GRUB Recovery
Reinstall GRUB from chroot:
```
grub-install /dev/sda
grub-mkconfig -o /boot/grub/grub.cfg
```
For UEFI: `grub-install --target=x86_64-efi --efi-directory=/boot`

## Magic SysRq (REISUB)
Hold Alt+PrintScrn, press these keys in order (safe reboot):
- `R` — switch keyboard to raw mode
- `E` — SIGTERM all processes
- `I` — SIGKILL all processes
- `S` — sync all filesystems
- `U` — remount filesystems read-only
- `B` — reboot

If frozen: `Alt+SysRq+REISUB` — the "safe reboot" sequence.

## Logs to Check First
```
journalctl -n 100 -p err       — recent errors
journalctl -xe                 — extended explanation of last failure
journalctl -f                  — follow new logs (live)
dmesg -H                       — kernel ring buffer (human-readable)
dmesg -l err,warn              — kernel errors and warnings
```
