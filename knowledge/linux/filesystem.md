# Linux Filesystem Hierarchy

Reference for the standard Linux directory tree and how to inspect it.

## Top-Level Directories
- `/` — root of the tree
- `/bin`, `/sbin`, `/lib` — symlinks to `/usr/*` on modern systems
- `/boot` — kernels, initramfs, bootloader files
- `/dev` — device nodes (sda, tty, null, zero)
- `/etc` — system-wide config (text files)
- `/home` — user home directories
- `/media`, `/mnt` — mount points for removable / temporary media
- `/opt` — third-party software
- `/proc` — virtual fs exposing kernel/process data
- `/root` — root's home
- `/run` — runtime data (replaces `/var/run`)
- `/srv` — service data (web/ftp content)
- `/sys` — sysfs: device and kernel info
- `/tmp` — temp files (often tmpfs, cleared on boot)
- `/usr` — user utilities, read-only
- `/var` — variable data (logs, spools, caches)

## Key /etc Files
- `fstab` — mount table (`device mountpoint fstype opts dump pass`)
- `crypttab` — encrypted block devices
- `passwd`, `shadow`, `group` — accounts and groups
- `sudoers` — sudo policy (edit with `visudo`)
- `hostname`, `hosts`, `resolv.conf` — name resolution
- `nsswitch.conf` — name service switch
- `ssh/sshd_config`, `ssh/ssh_config` — SSH server/client
- `pacman.conf`, `apt/sources.list`, `dnf/dnf.conf` — package repos
- `udev/rules.d/` — device rules
- `modprobe.d/` — kernel module options

## Key /proc Files
- `cpuinfo`, `meminfo`, `version`, `loadavg`, `uptime`
- `diskstats`, `partitions`, `mounts`, `swaps`
- `self/fd/`, `self/environ`, `self/cmdline` — current process info
- `sys/` — kernel runtime params (also via `sysctl`)

## Key /sys Paths
- `block/` — block devices
- `class/` — device classes (net, input, sound)
- `devices/` — device tree
- `kernel/` — kernel config and version

## Key /var Directories
- `log/` — `syslog`, `auth.log`, `kern.log`, `dmesg`, `journal/` (systemd)
- `cache/` — safe to delete
- `lib/` — persistent state (DBs, package manager)
- `spool/` — print/cron/mail
- `tmp/` — persistent temp (survives reboot)

## Filesystem Types
- `ext4` — default, journaling, max 1 EB
- `btrfs` — CoW, snapshots, compression, subvolumes
- `xfs` — high performance, large files
- `zfs` — advanced CoW pool (out-of-tree module)
- `tmpfs` — RAM-backed, volatile (`/tmp`, `/run`)
- `vfat` — FAT32 (USB, EFI system partition)
- `ntfs` — Windows (rw via ntfs3/ntfs-3g)
- `squashfs` — compressed, read-only (live images)
- `overlay` — union mount (containers, live systems)

## Inspect Mounts & Disks (read-only, safe)
Prefer the `sys` wrapper for inventory; use native tools for detail.
```bash
sys disk list                 # block devices + fs/label/UUID (lsblk -f)
sys disk mounts               # tree of mounts (findmnt)
sys disk usage                # disk free (df -h)
sys disk fs /path            # dir size (du -sh)
# Native detail (not wrapped by sys):
mount                                   # show mounted filesystems
findmnt -t tmpfs                        # filter by fstype
lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT,UUID
lsblk --discard                         # TRIM support (DISC-GRAN > 0)
blkid                                   # UUIDs, labels, types
file -s /dev/sda1                       # probe fs on a device
df -i                                   # inode usage
du -sh /path/* 2>/dev/null | sort -h    # dir sizes
stat /path                              # file metadata
fdisk -l                                # partition tables (root)
parted /dev/sda print                   # detailed partition info (root)
```
