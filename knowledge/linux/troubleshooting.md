# Linux Troubleshooting & System Recovery

For methodology and per-category command lists see `troubleshooting-methodology.md`.

## System Won't Boot

- Hold Shift / spam Esc at UEFI → boot menu → select older kernel.
- At GRUB: press `e`, change `quiet splash` to `single` or `init=/bin/bash`, then Ctrl+X.
- From live USB: mount root → `chroot` → repair:
```bash
mount /dev/sda2 /mnt
mount /dev/sda1 /mnt/boot   # if separate
mount -t proc proc /mnt/proc
mount --rbind /sys /mnt/sys
mount --rbind /dev /mnt/dev
chroot /mnt /bin/bash
# fix: reinstall kernel, rebuild initramfs, repair fstab
sys kern initramfs          # rebuild initramfs (distro-aware)
```

## Boot Rescue
```bash
fsck /dev/sda2              # repair filesystem (unmount first)
sys log boot -x             # failed boot log (journalctl -xb)
systemctl default          # resume normal boot
```

GRUB recovery from chroot:
```bash
grub-install /dev/sda
grub-mkconfig -o /boot/grub/grub.cfg
# UEFI: grub-install --target=x86_64-efi --efi-directory=/boot
```

## Xorg/Wayland
- `grep EE /var/log/Xorg.0.log` (X11)
- `sys svc restart display-manager`
- NVIDIA: `nvidia-smi` → `prime-select nvidia` → reboot
- Black screen: switch TTY (Ctrl+Alt+F2), reinstall drivers
- Magic SysRq: `Alt+SysRq+R` then `Ctrl+Alt+F1`

## No Sound
```bash
pactl info                   # PulseAudio/PipeWire status
wpctl status                 # PipeWire
alsamixer                    # unmute (MM → 00)
systemctl --user restart pipewire
dmesg | grep -i audio        # (root in sandbox)
```

## No WiFi
```bash
rfkill list                  # check blocked
rfkill unblock wifi
nmcli radio wifi on
nmcli dev wifi list
dmesg | grep -i firmware     # missing firmware (root)
sys kern modprobe -r <driver> && sys kern modprobe <driver>   # reload (root)
```

## Performance Issues
```bash
sys perf top                 # CPU/mem hogs
sys perf mem                 # memory snapshot
sys perf load                # load average
sys perf io                  # I/O wait
sys perf cpu                 # CPU info
iotop                        # disk I/O by process (root)
nethogs                      # network by process
vmstat 1                     # system health (tested: works)
sys log errors               # system errors (tested: works)
dmesg -l err,warn            # kernel errors (root in sandbox)
sensors                      # temperatures (tested: works)
```

## Disk Full
```bash
sys disk usage               # df -h
sys disk fs /                # du -sh on a path
ncdu                         # interactive (install)
find / -type f -size +100M -exec ls -lh {} +   # large files
sys log vacuum 100M          # trim journal
docker system prune -a
flatpak uninstall --unused
rm -rf ~/.npm/_cacache ; pip cache purge
```

## Package Manager Recovery
- Debian: `dpkg --configure -a && apt-get -f install`
- Fedora: `dnf reinstall $(dnf list installed | awk '{print $1}')`
- Arch: `sys pkg upgrade` then `sys pkg install archlinux-keyring` if keyring issues

## Network Recovery
```bash
sys svc restart NetworkManager
ping 8.8.8.8                 # if works but domain fails → DNS
resolvectl flush-caches
echo "nameserver 8.8.8.8" | tee /etc/resolv.conf
ip route add default via 192.168.1.1
```

## Magic SysRq (REISUB — safe reboot)
Hold Alt+SysRq, press in order: **R** (raw) **E** (SIGTERM) **I** (SIGKILL) **S** (sync) **U** (ro remount) **B** (reboot).

## Logs to Check First
```bash
sys log errors               # recent errors (journalctl -p err -b)
sys log show -xe             # explanation of last failure
sys log follow               # follow live
dmesg -H                     # kernel ring buffer (root in sandbox)
dmesg -l err,warn            # kernel errors/warnings
```
