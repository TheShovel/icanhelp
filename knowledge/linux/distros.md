# Distro Differences: Ubuntu (Debian) vs Arch

> **Preferred path:** use the universal `sys` CLI (`universal-cli.md`) for everyday
> admin — packages, services, firewall, network inspection, users/groups, time,
> logs, kernel modules, and more. It auto-detects the distro and translates to the
> right native tool, so you learn one vocabulary. This file is the **deep
> reference** for the underlying apt/dnf/pacman differences when `sys` can't do
> what you need or you must understand the native command.

General Linux knowledge applies to both, but package management, service
config, and network setup differ. This file maps the common operations
side-by-side so a command for one distro has a clear equivalent on the other.

## Identify your distro

```bash
cat /etc/os-release          # ID=ubuntu or ID=arch (also PRETTY_NAME, VERSION_ID)
sys detect                   # universal: family + pkg + firewall + ssh unit
lsb_release -a               # needs lsb-release (Ubuntu has it by default)
uname -a                     # kernel version (same on both)
```

## Package management

| Task | Ubuntu / Debian (apt) | Arch (pacman) | `sys` equivalent |
|------|------------------------|---------------|------------------|
| Refresh package lists | `sudo apt update` | `sudo pacman -Sy` | `sys pkg update` |
| Upgrade system | `sudo apt upgrade` | `sudo pacman -Syu` | `sys pkg upgrade` |
| Full dist-upgrade | `sudo apt full-upgrade` | (rolling: `pacman -Syu`) | `sys pkg upgrade` |
| Install | `sudo apt install pkg` | `sudo pacman -S pkg` | `sys pkg install pkg` |
| Install local .deb/.pkg | `sudo apt install ./pkg.deb` | `sudo pacman -U pkg.tar.zst` | — (use native) |
| Remove (keep config) | `sudo apt remove pkg` | `sudo pacman -R pkg` | `sys pkg remove pkg` |
| Remove + config | `sudo apt purge pkg` | `sudo pacman -Rns pkg` | `sys pkg purge pkg` |
| Search | `apt search kw` | `pacman -Ss kw` | `sys pkg search kw` |
| Show info | `apt show pkg` | `pacman -Si pkg` | `sys pkg info pkg` |
| List installed | `apt list --installed` | `pacman -Q` | `sys pkg list-installed` |
| Which package owns file | `dpkg -S /path` | `pacman -Qo /path` | `sys pkg owns /path` |
| List files in package | `dpkg -L pkg` | `pacman -Ql pkg` | `sys pkg files pkg` |
| Clean cache | `sudo apt clean` / `apt autoremove` | `sudo pacman -Sc` | `sys pkg clean` |
| Hold / unhold | `sudo apt-mark hold pkg` | `sudo pacman -S --asdeps` (no native hold; use `IgnorePkg` in pacman.conf) | — |

Ubuntu extras:
```bash
sudo apt-get install -f       # fix broken dependencies
sudo dpkg --configure -a      # finish interrupted config
apt-cache policy pkg          # installed vs candidate version
sudo add-apt-repository ppa:user/ppa   # add a PPA (Ubuntu)
sudo apt update && sudo apt upgrade -y  # non-interactive
```
Arch extras:
```bash
pacman -Qtdq | sudo pacman -Rns -   # remove orphans
pacman -Qi pkg                     # local detail (verified)
pacman -Qe                         # explicitly installed
yay -S pkg / paru -S pkg           # AUR helper
```

## Service management (both use systemd)

Ubuntu and Arch both run systemd, so `systemctl`/`journalctl` are identical
(see `systemd.md`). Prefer `sys svc` for any service action. Differences are in
what is enabled by default and the helper tooling:

```bash
# Universal (works on both):
sys svc enable --now nginx
sys svc status nginx

# Native equivalents:
sudo systemctl enable --now nginx
sudo systemctl status nginx
```
Service name gotchas:
- SSH: `sshd.service` (Arch) vs `ssh.service` (Ubuntu/Debian) — `sys svc` picks the right one automatically.
- Network: Ubuntu Server uses `systemd-networkd` or `NetworkManager`; Ubuntu
  Desktop uses `NetworkManager`. Arch leaves networking unconfigured by default
  (you enable `NetworkManager` or `systemd-networkd` yourself).

## Networking configuration

Ubuntu Server uses **netplan** (renderer: NetworkManager or systemd-networkd):
```bash
# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: true
      # addresses: [192.168.1.100/24]
      # gateway4: 192.168.1.1
      # nameservers: { addresses: [8.8.8.8, 1.1.1.1] }
sudo netplan apply                 # apply config
sudo netplan try                   # apply with auto-rollback
# Universal: sys net apply
```
Arch uses `systemd-networkd` or `NetworkManager` directly (see `networking.md`).
There is no netplan on Arch. Inspect with `sys net interfaces|routes|dns|listen`.

## Firewall

Ubuntu defaults to **UFW** (front-end to iptables/nftables):
```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow from 192.168.1.0/24 to any port 22
sudo ufw status numbered
sudo ufw delete 3
# Universal: sys firewall allow 22/tcp / sys firewall status
```
Arch has no firewall by default; use `nftables` or install `ufw` (see `firewall.md`).
Universal: `sys firewall status|allow|deny|reset` (picks ufw/firewalld/nftables).

## Kernel & initramfs

```bash
# Ubuntu / Debian
uname -r                          # running kernel
sudo apt install linux-image-extra-$(uname -r)   # extra modules
sudo update-initramfs -u          # rebuild initramfs
sudo update-grub                  # regenerate GRUB config

# Arch
sudo mkinitcpio -P                 # rebuild all initramfs (or -p linux)
sudo grub-mkconfig -o /boot/grub/grub.cfg
# Universal: sys kern initramfs
```
Ubuntu kernels live in `/boot/vmlinuz-<version>` with `initrd.img-<version>`;
Arch uses `/boot/vmlinuz-linux` and `/boot/initramfs-linux.img`.

## Kernel modules / DKMS

Both use `modprobe`/`lsmod`/`dkms` (see `kernel-modules.md`). Prefer
`sys kern lsmod|modprobe|rmmod|blacklist`. Ubuntu installs DKMS modules
automatically on kernel upgrade; on Arch you must rebuild for each new kernel
(or use `dkms` hooks / `linux-headers`).

## Repositories & sources

```bash
# Ubuntu
cat /etc/apt/sources.list
ls /etc/apt/sources.list.d/
sudo apt-key list                 # (deprecated) trusted keys
# Modern: drop .gpg keys into /etc/apt/trusted.gpg.d/

# Arch
cat /etc/pacman.conf
ls /etc/pacman.d/
sudo pacman-key --init && sudo pacman-key --populate archlinux
```

## Users, sudo, and paths

- Both use `sudo`; on Arch you must install `sudo` and add your user to `wheel`
  (uncomment `%wheel ALL=(ALL:ALL) ALL` in `/etc/sudoers` via `visudo`).
- Ubuntu adds the first user to `sudo` group automatically.
- Prefer `sys user`/`sys group` for account management.
- Log files: Ubuntu uses `/var/log/syslog` + `journald`; Arch is journald-only
  by default (no `/var/log/syslog` unless you install `syslog-ng`).

## Quick "which distro am I on?" cheatsheet

```bash
[ -f /etc/debian_version ] && echo "Debian/Ubuntu family"
[ -f /etc/arch-release ]   && echo "Arch family"
command -v apt   >/dev/null && echo "apt available"
command -v pacman>/dev/null && echo "pacman available"
sys detect                   # one-shot universal answer
```
