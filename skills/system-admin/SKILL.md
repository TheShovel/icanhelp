---
name: system-admin
description: Linux system administration tasks — managing packages, users, services, permissions, networking, storage, processes, and security. Use when the user asks to install software, configure the system, troubleshoot Linux issues, manage filesystems, or handle system security.
---

# System Administration

Provide Linux system administration guidance that is safe, correct, and appropriate for the user's system.

## Safety First

- **Always check before acting** — use `read_file` or `run_bash` to inspect the current state before making changes
- **Prefer non-destructive commands** — use `--dry-run` flags, `-p` (print), `--no-act` when available
- **Back up config files** before editing — copy to `~/` or `/tmp/`
- **Explain what you're about to do** before running potentially disruptive commands
- **Check the distro** — use `cat /etc/os-release` and adapt package manager commands accordingly

## Package Managers by Distro

| Distro | Package Manager | Install | Search | Update |
|--------|----------------|---------|--------|--------|
| Debian/Ubuntu | `apt` | `apt install` | `apt search` | `apt update && apt upgrade` |
| Fedora/RHEL | `dnf` | `dnf install` | `dnf search` | `dnf upgrade` |
| Arch/Manjaro | `pacman` | `pacman -S` | `pacman -Ss` | `pacman -Syu` |
| openSUSE | `zypper` | `zypper install` | `zypper search` | `zypper update` |
| NixOS | `nix-env` | `nix-env -iA` | `nix search` | `nix-channel --update` |

## System Service Management (systemd)

- Check status: `systemctl status <service>`
- Start/stop: `systemctl start/stop <service>`
- Enable/disable at boot: `systemctl enable/disable <service>`
- View logs: `journalctl -u <service> -n 50 -f`
- List failed: `systemctl --failed`

## Filesystem & Storage

- Check disk usage: `df -h`, `du -sh *`
- Find large files: `find / -type f -size +100M`
- Mount info: `mount`, `lsblk`, `blkid`
- Check inodes: `df -i`
- Repair filesystem: `fsck` (unmount first)

## Networking

- Check connectivity: `ping -c 4 1.1.1.1`
- DNS resolution: `dig google.com`, `nslookup`, `resolvectl status`
- Open ports: `ss -tulpn`, `netstat -tulpn`
- Firewall: `ufw status`, `firewall-cmd --list-all`, `nft list ruleset`
- WiFi: `nmcli dev wifi list`, `iwconfig`
- Network config: `ip a`, `ip route`

## User & Permission Management

- Add user: `useradd -m -G wheel <user>` (use `usermod` for Arch/Fedora groups)
- Sudoers: `visudo` (always use visudo, never edit directly)
- File permissions: `chmod`, `chown`, `chattr`
- ACLs: `getfacl`, `setfacl`
- Ownership: `find /path -user olduser -exec chown newuser: {} \;`

## Security Hardening Checklist

- Check for open ports: `ss -tulpn | grep LISTEN`
- Failed SSH attempts: `journalctl -u sshd | grep "Failed password"`
- Available updates: check package manager for pending updates
- Unused packages: `apt autoremove --dry-run` (Debian)
- SELinux/AppArmor: `getenforce`, `aa-status`
- Audit logs: `journalctl -p err -b`

## Performance Diagnosis

- CPU/memory: `htop` or `top`
- Disk IO: `iotop`, `iostat -x 1`
- Memory: `free -h`, `cat /proc/meminfo`
- Process tree: `ps auxf`
- System load: `uptime`, `cat /proc/loadavg`
- Kernel logs: `dmesg -T | tail -20`

Always search the knowledge base for detailed Linux command references and troubleshooting guides before executing system commands.
