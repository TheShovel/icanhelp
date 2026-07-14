# GRUB Boot Loader and System Boot

## Config files (native — not wrapped by sys)
- `/boot/grub/grub.cfg` — generated, **never edit directly**
- `/etc/default/grub` — edit this
- `/etc/grub.d/` — generator scripts

## Generate config
```bash
grub-mkconfig -o /boot/grub/grub.cfg   # Arch (verified syntax)
# Debian/Ubuntu: update-grub
# RHEL/Fedora: grub2-mkconfig -o /boot/grub2/grub.cfg
```

## Key /etc/default/grub settings
```
GRUB_TIMEOUT=5
GRUB_CMDLINE_LINUX_DEFAULT="quiet"
GRUB_CMDLINE_LINUX=""
GRUB_GFXMODE=1920x1080
GRUB_DISABLE_OS_PROBER=false
GRUB_DEFAULT=0
```

## Common kernel parameters
- `quiet` — suppress boot messages
- `loglevel=3` — kernel log level
- `nomodeset` — disable graphics drivers (fallback)
- `root=UUID=...` / `root=/dev/sda2`
- `rw` / `ro`
- `modprobe.blacklist=nouveau`

## Boot process
1. Firmware (BIOS/UEFI) → GRUB → kernel + initramfs → systemd.
2. UEFI ESP at `/boot/efi/`; kernels in `/boot/` (`vmlinuz-*`, `initramfs-*`).

## Initramfs
```bash
mkinitcpio -P                      # regenerate all (Arch, verified syntax)
# Debian: update-initramfs -u -k all ; RHEL: dracut --force --all
# Or use the universal wrapper: sys kern initramfs
```

## systemd-boot (alternative)
```bash
bootctl install
bootctl status
bootctl update
# Entry: /boot/loader/entries/arch.conf
#   title Arch Linux
#   linux /vmlinuz-linux
#   initrd /initramfs-linux.img
#   options root=PARTUUID=... rw
```

## Boot analysis (verified)
```bash
systemd-analyze
systemd-analyze blame
systemd-analyze critical-chain
sys log boot                       # current boot
sys log boot -1                    # previous boot (journalctl -b -1)
```

## Rescue / recovery
```bash
# At GRUB, press e, edit linux line, Ctrl+X to boot:
systemd.unit=rescue.target         # rescue shell
init=/bin/bash root=/dev/sda1 rw   # shell
# Filesystem check from rescue shell:
fsck -f /dev/sda2
```
Chroot recovery:
```bash
mount /dev/sda2 /mnt && mount /dev/sda1 /mnt/boot/efi
mount --bind /dev /mnt/dev; mount --bind /proc /mnt/proc; mount --bind /sys /mnt/sys
chroot /mnt
grub-install /dev/sda && grub-mkconfig -o /boot/grub/grub.cfg
```

## Secure Boot
- `mokutil --sb-state` (install `mokutil`) to check status.
- `mokutil --import MOK.der` to enroll a key.
