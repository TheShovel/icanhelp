# GRUB Boot Loader and System Boot Process

## GRUB Configuration

### Main Config File
- `/boot/grub/grub.cfg` — generated config (never edit directly)
- `/etc/default/grub` — main configuration (edit this)
- `/etc/grub.d/` — scripts that generate config

### Generate Config
```bash
# After editing /etc/default/grub
grub-mkconfig -o /boot/grub/grub.cfg

# Or distribution-specific
update-grub  # Debian/Ubuntu
grub2-mkconfig -o /boot/grub2/grub.cfg  # RHEL/Fedora
```

### GRUB Parameters
```
# /etc/default/grub
GRUB_TIMEOUT=5
GRUB_TIMEOUT_STYLE=menu
GRUB_DISTRIBUTOR=`lsb_release -i -s 2> /dev/null || echo Debian`
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash"
GRUB_CMDLINE_LINUX="audit=1"
GRUB_GFXMODE=1920x1080
GRUB_GFXPAYLOAD_LINUX=keep
GRUB_DISABLE_OS_PROBER=true
GRUB_DISABLE_SUBMENU=y
GRUB_DEFAULT=0
```

### GRUB Options Explained
- `GRUB_TIMEOUT` — seconds before auto-boot
- `GRUB_TIMEOUT_STYLE=menu` — always show menu
- `GRUB_CMDLINE_LINUX_DEFAULT` — default kernel params
- `GRUB_CMDLINE_LINUX` — unconditional kernel params
- `GRUB_GFXMODE` — menu resolution
- `GRUB_GFXPAYLOAD_LINUX` — kernel resolution
- `GRUB_DEFAULT` — default entry (0, saved, or name)

## Boot Process

### BIOS Boot
1. BIOS initializes hardware
2. BIOS boots MBR (first 446 bytes of /dev/sda)
3. GRUB stage 1 → stage 2
4. GRUB loads kernel and initrd
5. Kernel initializes
6. systemd starts

### UEFI Boot
1. UEFI firmware initializes
2. UEFI loads /EFI/ubuntu/grubx64.efi (or equivalent)
3. GRUB loads kernel and initrd
4. Kernel initializes
5. systemd starts

### Boot Partition
- `/boot/` — kernels and initramfs
- `/boot/efi/` — EFI system partition (UEFI)
- `vmlinuz-*` — kernel images
- `initrd.img-*` — initramfs images
- `System.map-*` — kernel symbol table
- `config-*` — kernel config

## Kernel Parameters

### Common Parameters
- `quiet` — suppress boot messages
- `splash` — show splash screen
- `loglevel=3` — kernel log level (0-7)
- `audit=1` — enable auditing
- `noaudit` — disable auditing
- `root=UUID=...` — root filesystem
- `root=/dev/sda2` — root device
- `ro` — mount root read-only
- `rw` — mount root read-write

### Debugging Parameters
- `debug` — enable debug output
- `earlyprintk` — early console output
- `initcall_debug` — trace init calls
- `ignore_loglevel` — show all kernel messages
- `dyndbg` — dynamic debug

### Performance Parameters
- `intel_pstate=disable` — use acpi-cpufreq
- `mitigations=off` — disable Spectre/Meltdown protections
- `nosmt` — disable hyperthreading
- `noibpb` — no indirect branch prediction barrier
- `noibrs` — no indirect branch restricted speculation

### Recovery Parameters
- `single` or `S` — single user mode
- `emergency` — emergency shell
- `init=/bin/bash` — bash instead of systemd
- `break=pre-mount` — break before mount
- `break=modules` — break before modules

## GRUB Command Line

### Access GRUB Menu
- Hold `Shift` during boot (BIOS)
- Press `Esc` during boot (UEFI)
- `GRUB_TIMEOUT_STYLE=menu` in config shows menu

### Edit Boot Entry
- Press `e` to edit entry
- Find line starting with `linux`
- Modify parameters
- `Ctrl+X` or `F10` to boot

### Temporary Parameters
- `systemd.unit=multi-user.target` — boot to CLI
- `systemd.unit=rescue.target` — rescue mode
- `nomodeset` — disable graphics drivers
- `modprobe.blacklist=nouveau` — blacklist module
- `ipv6.disable=1` — disable IPv6

## Initramfs (initrd)

### Regenerate Initramfs
```bash
# Debian/Ubuntu
update-initramfs -u -k all

# RHEL/Fedora
dracut --force --all

# Arch
mkinitcpio -P
```

### Initramfs Hooks
```
# /etc/initramfs-tools/hooks/custom
#!/bin/sh
copy_exec /usr/bin/custom-tool /usr/bin/custom-tool
```

### Custom Initramfs
```bash
# Add custom script
# /etc/initramfs-tools/scripts/local-premount/custom
#!/bin/sh
PREREQ=""
prereqs() { echo "$PREREQ"; }
case $1 in
prereqs) prereqs; exit 0 ;;
esac

# Your code here
```

## systemd-boot (Alternative Boot Loader)

### Installation
```bash
# Install bootloader
bootctl install

# Configuration
# /boot/loader/loader.conf
default arch.conf
timeout 5

# Entry
# /boot/loader/entries/arch.conf
title Arch Linux
linux /vmlinuz-linux
initrd /initramfs-linux.img
options root=PARTUUID=... rw
```

### Commands
- `bootctl status` — boot loader status
- `bootctl update` — update boot loader
- `bootctl remove` — remove boot loader

## Boot Troubleshooting

### Rescue Mode
```bash
# From GRUB edit
# Add to linux line:
init=/bin/bash root=/dev/sda1 rw

# Or use systemd target:
systemd.unit=rescue.target
```

### File System Check
```bash
# From rescue shell
fsck /dev/sda2
fsck -f /dev/sda2  # Force check
fsck -y /dev/sda2  # Auto-fix
```

### Reinstall GRUB
```bash
# BIOS
grub-install /dev/sda
update-grub

# UEFI
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=GRUB
update-grub
```

### Chroot Recovery
```bash
# Mount root filesystem
mount /dev/sda2 /mnt

# Mount boot partition
mount /dev/sda1 /mnt/boot
mount /dev/sda1 /mnt/boot/efi  # UEFI

# Mount virtual filesystems
mount --bind /dev /mnt/dev
mount --bind /proc /mnt/proc
mount --bind /sys /mnt/sys
mount --bind /run /mnt/run

# Chroot
chroot /mnt

# Reinstall GRUB or fix config
grub-install /dev/sda
update-grub
```

## Boot Performance

### Analyze Boot Time
```bash
# Overall boot time
systemd-analyze

# Breakdown by service
systemd-analyze blame

# Critical chain
systemd-analyze critical-chain

# Compare boots
systemd-analyze time
```

### Boot Chart
```bash
# Generate SVG
systemd-analyze plot > boot.svg

# Generate text
systemd-analyze dump
```

### Initcall Tracing
```bash
# Add to kernel params
initcall_debug

# View in boot log
dmesg | grep "initcall"
```

## Boot Scripts and Services

### Early Boot
- `/etc/initramfs-tools/scripts/` — initramfs scripts
- `/etc/init/` — upstart (if installed)
- `/etc/rcS.d/` — SysV early boot

### systemd Boot
- `initrd-root-fs.target` — root mounted
- `sysinit.target` — basic system
- `multi-user.target` — multi-user system
- `graphical.target` — GUI system

### Custom Boot Services
```ini
# /etc/systemd/system/myboot.service
[Unit]
Description=My Early Boot Task
DefaultDependencies=no
After=local-fs.target
Before=sysinit.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/early-script.sh
RemainAfterExit=yes

[Install]
WantedBy=sysinit.target
```

## Encrypted Boot

### LUKS Root
- `/etc/crypttab` — encryption mappings
- `GRUB_ENABLE_CRYPTODISK=y` — in /etc/default/grub
- `cryptsetup-initramfs` — for Debian/Ubuntu

### GRUB Crypto Parameters
```
GRUB_CMDLINE_LINUX="cryptdevice=UUID=...:cryptroot root=/dev/mapper/cryptroot"
```

### Keyfile Setup
```bash
# Create keyfile
dd if=/dev/urandom of=/crypto_keyfile.bin bs=512 count=4
chmod 000 /crypto_keyfile.bin

# Add to LUKS
cryptsetup luksAddKey /dev/sda2 /crypto_keyfile.bin
```

## Secure Boot

### Check Secure Boot
```bash
mokutil --sb-state  # Check status
ls -l /boot/efi/EFI/*/  # Check signatures
```

### Shim and MOK
- `shimx64.efi` — signed bootloader
- `mokutil` — Machine Owner Key tool
- `mokutil --import MOK.der` — enroll key

## Boot Recovery

### Live USB Recovery
```bash
# Mount system
mount /dev/sda2 /mnt
mount /dev/sda1 /mnt/boot/efi

# Bind mounts for chroot
mount --bind /dev /mnt/dev
mount --bind /proc /mnt/proc
mount --bind /sys /mnt/sys

# Chroot and fix
chroot /mnt
grub-install /dev/sda
update-grub
```

### Boot from Initramfs
```bash
# From initramfs prompt
# Mount root manually
mount /dev/sda2 /root

# Exit to continue boot
exit
```

### Emergency Shell Access
```bash
# Add to GRUB
init=/bin/bash

# Remount root
mount -o remount,rw /

# Or
mount -o remount,rw /root  # if mounted elsewhere
```

## Distribution Specific

### Debian/Ubuntu
- `/etc/default/grub` — GRUB config
- `update-grub` — regenerate config
- `update-initramfs` — initramfs

### RHEL/Fedora
- `/etc/default/grub` — GRUB config
- `grub2-mkconfig -o /boot/grub2/grub.cfg` — generate config
- `dracut` — initramfs

### Arch Linux
- `/etc/default/grub` — GRUB config
- `grub-mkconfig -o /boot/grub/grub.cfg` — generate
- `mkinitcpio -P` — initramfs

### openSUSE
- `/etc/default/grub` — GRUB config
- `grub2-mkconfig -o /boot/grub2/grub.cfg` — generate
- `mkinitrd` — initramfs

## Boot Logging

### View Boot Log
```bash
# From running system
journalctl -b  # current boot
journalctl -b -1  # previous boot
journalctl -b -2  # two boots ago

# From initramfs
# Add to kernel params:
rd.debug
```

### Persistent Journal
```bash
# /etc/systemd/journald.conf
Storage=persistent
SystemMaxUse=100M
```

### Boot Messages
```bash
# Early boot (initrd)
journalctl -b -1 -o verbose | head -50

# Filter by facility
journalctl -b -f _TRANSPORT=kernel
journalctl -b -f SYSLOG_FACILITY=0  # kern
```

## Custom Boot Entries

### Test Kernel Parameters
```bash
# Add to /etc/default/grub
GRUB_CMDLINE_LINUX_DEFAULT="$GRUB_CMDLINE_LINUX_DEFAULT debug"

# Then regenerate
update-grub
```

### Multiple Boot Entries
```bash
# Copy existing entry
cp /etc/grub.d/40_custom /etc/grub.d/41_custom

# Add custom function
cat >> /etc/grub.d/40_custom
menuentry 'Linux Debug' {
    linux /boot/vmlinuz-debug root=/dev/sda2 ro debug loglevel=8
    initrd /boot/initrd.img-debug
}
```

### Advanced Customization
```bash
# /etc/grub.d/40_custom
menuentry 'Arch Linux (Fallback)' {
    insmod part_gpt
    insmod ext2
    set root='hd0,gpt2'
    linux /vmlinuz-linux root=PARTUUID=... rw single
    initrd /initramfs-linux-fallback.img
}
```