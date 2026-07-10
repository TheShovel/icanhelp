# Linux Filesystem Hierarchy

## Top-Level Directories
- `/` — root filesystem, top of the tree
- `/bin` — essential user binaries (symlink to /usr/bin on modern systems)
- `/sbin` — essential system binaries (symlink to /usr/sbin)
- `/boot` — boot loader files, kernels (vmlinuz, initramfs)
- `/dev` — device files (sda, tty, random, null, zero)
- `/etc` — system-wide configuration files (text-based)
- `/home` — user home directories
- `/lib` — essential shared libraries and kernel modules (symlink to /usr/lib)
- `/media` — mount points for removable media
- `/mnt` — temporary mount points
- `/opt` — optional third-party software packages
- `/proc` — virtual filesystem exposing kernel/process data
- `/root` — home directory for root user
- `/run` — runtime variable data (since FHS 3.0, replaces /var/run)
- `/srv` — service-specific data (HTTP, FTP served content)
- `/sys` — virtual filesystem for device and kernel info (sysfs)
- `/tmp` — temporary files (cleared on boot, often tmpfs/ram-backed)
- `/usr` — secondary hierarchy (user utilities, read-only)
- `/var` — variable data (logs, spools, caches)

## Key /etc Files
- `passwd` — user accounts (one per line: name:password:uid:gid:gecos:home:shell)
- `shadow` — encrypted passwords (root-readable only)
- `group` — user groups
- `sudoers` — sudo privileges (edit with `visudo`)
- `fstab` — filesystem mount table (device mountpoint fstype opts dump pass)
- `hostname` — system hostname
- `hosts` — static hostname/IP mappings
- `resolv.conf` — DNS resolvers (often managed by systemd-resolved/NetworkManager)
- `nsswitch.conf` — name service switch config
- `environment` — system-wide environment variables
- `profile`, `bash.bashrc` — system-wide shell configs
- `crontab` — system-wide cron schedule
- `ssh/sshd_config` — SSH server config
- `ssh/ssh_config` — SSH client config
- `apt/sources.list` — Debian/Ubuntu package repositories
- `pacman.conf` — Arch Linux pacman config
- `dnf/dnf.conf` — Fedora dnf config
- `systemd/` — systemd unit files (overrides)
- `udev/rules.d/` — udev device rules
- `NetworkManager/` — network configs
- `modprobe.d/` — kernel module options

## Key /proc Files
- `cpuinfo` — CPU details (model, cores, flags)
- `meminfo` — memory usage details
- `uptime` — system uptime in seconds
- `loadavg` — system load averages
- `version` — Linux kernel version
- `diskstats` — I/O statistics per disk
- `mounts` — currently mounted filesystems
- `partitions` — partition table
- `swaps` — swap device usage
- `self/` — symlink to current process info
- `self/fd/` — open file descriptors
- `self/environ` — environment variables of process
- `self/cmdline` — command line of process
- `sys/` — kernel runtime parameters (accessible via sysctl)

## Key /sys Files
- `block/` — block device info
- `class/` — device classes (net, sound, input, etc.)
- `devices/` — device tree
- `power/` — power management state
- `kernel/` — kernel config, version info

## Key /var Directories
- `log/` — system log files
  - `syslog` or `messages` — general system log
  - `auth.log` or `secure` — authentication logs
  - `kern.log` — kernel logs
  - `dmesg` — kernel ring buffer
  - `journal/` — systemd-journald binary logs (view with `journalctl`)
- `cache/` — application cache data (can be safely deleted)
- `lib/` — persistent data (databases, package manager state)
- `spool/` — print/cron/mail spools
- `tmp/` — persistent temporary files (survives reboot)
- `mail/` — user mailboxes

## Filesystem Types
- `ext4` — default Linux fs, journaling, max 1 EB
- `btrfs` — CoW, snapshots, compression, subvolumes, RAID
- `xfs` — high-performance, excellent for large files
- `zfs` — advanced CoW with volume management (not in mainline kernel)
- `tmpfs` — RAM-backed, volatile (used by /tmp, /run)
- `vfat` — FAT32 (USB drives, EFI system partition)
- `ntfs` — Windows NTFS (rw via ntfs-3g or kernel driver)
- `squashfs` — compressed, read-only (live CDs, snaps)
- `overlay` — union mount (Docker, live systems)

## Mount & Disk Commands
- `mount` — show mounted filesystems
- `mount /dev/sda1 /mnt` — mount device
- `umount /mnt` — unmount
- `lsblk` — list block devices (tree view)
- `blkid` — show UUIDs and filesystem types
- `fdisk -l` — partition table
- `parted /dev/sda print` — detailed partition info
- `df -h` — disk free (human-readable)
- `du -sh dir/` — disk usage summary
- `findmnt` — tree of mounted filesystems
- `fsck /dev/sda1` — filesystem check (unmount first)
- `tune2fs -l /dev/sda1` — ext4 filesystem parameters
- `mkfs.ext4 /dev/sda1` — format as ext4

## Disk Layout (UEFI/GPT)
- `/dev/sda1` — EFI System Partition (vfat, ~512 MB)
- `/dev/sda2` — root partition (ext4 or btrfs, rest of disk)
- `/dev/sda3` — optional swap partition (size = RAM for hibernation)
- Or LVM: `/dev/vg/root`, `/dev/vg/home`, `/dev/vg/swap`
- Or btrfs subvolumes: `@` (root), `@home`, `@snapshots`
