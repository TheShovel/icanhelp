# Linux Filesystem Tuning & Management

## Filesystem Types

| FS | Best for | Features | Notes |
|----|----------|----------|-------|
| ext4 | General purpose | Journaling, extents | Default choice |
| XFS | Large files | Very large, extent-based | Good for servers |
| Btrfs | Snapshots | COW, snapshots, checksums | Still experimental |
| ZFS | Data integrity | Pools, snapshots, compression | External module |
| F2FS | Flash storage | Flash-optimized | USB/SSD/SD cards |

## Mount Options

### Common Options
```bash
# Generic options
defaults                                 # rw, suid, dev, exec, auto, nouser, async
noatime                                # No access time updates
relatime                               # Relative atime (default)
discard                                # Enable TRIM for SSD
ro                                     # Read-only
rw                                     # Read-write

# Security options
noexec                                 # No executable files
nosuid                                 # No setuid bits
nodev                                  # No device files
```

### ext4 Mount Options
```bash
# Performance tuning
mount -o noatime,data=writeback /dev/sda1 /mnt/data
mount -o commit=30,errors=remount-ro /dev/sda1 /mnt

# Options explained
# noatime - Skip atime updates (performance)
# data=writeback - Only journal metadata (faster)
# data=ordered - Write data before metadata (default)
# data=journal - Journal everything (safest)
# commit=N - Sync every N seconds
# errors={remount-ro|panic} - Error handling
```

### XFS Mount Options
```bash
# XFS tuning
mount -o noatime,logbufs=8,logbsize=256k /dev/sda1 /mnt

# Options
# largeio - Large block sizes
# inode64 - Allow 64-bit inodes
# nobarrier - Skip write barriers (if using battery-backed cache)
# logbufs=N - Log buffers (2-8)
# logbsize=N - Log buffer size (16k, 32k, 64k, 256k)
```

## Filesystem Check & Repair

```bash
# Check filesystem (unmount first)
fsck -n /dev/sda1                       # Check only, no fixes
fsck -y /dev/sda1                       # Fix automatically
fsck -f /dev/sda1                       # Force check

# Specific filesystem tools
e2fsck -f /dev/sda1                   # ext2/ext3/ext4
xfs_repair /dev/sda1                  # XFS
btrfs check /dev/sda1                   # Btrfs

# Check without unmount (XFS)
xfs_repair -n /dev/sda1               # Read-only check

# Btrfs scrub (live check)
btrfs scrub start /mnt/data
btrfs scrub status /mnt/data

# SMART check before fsck
sudo smartctl -H /dev/sda
sudo smartctl -c /dev/sda             # Capabilities
```

## Filesystem Resizing

```bash
# ext4
sudo resize2fs /dev/sda1               # Expand to max
sudo resize2fs /dev/sda1 10G           # Shrink/grow to size

# XFS
sudo xfs_growfs /mnt/data              # Expand only
sudo xfs_growfs /mnt/data -D 20G       # Specify new size

# Btrfs
sudo btrfs filesystem resize +2G /mnt/data
sudo btrfs filesystem resize 20G /mnt/data
sudo btrfs filesystem resize max /mnt/data

# Shrink XFS requires backup and recreate
# XFS cannot be shrunk in-place
```

## Filesystem Tuning Tools

### tune2fs (ext2/ext3/ext4)
```bash
# View params
tune2fs -l /dev/sda1

# Change reserved blocks (default 5%)
tune2fs -m 1 /dev/sda1                # 1% reserved
tune2fs -r 1000 /dev/sda1            # 1000 blocks reserved

# Check interval
tune2fs -c 20 /dev/sda1               # Check every 20 boots
tune2fs -i 1m /dev/sda1              # Check every month

# Label
tune2fs -L "data" /dev/sda1

# Disable journal (ext4)
tune2fs -O ^has_journal /dev/sda1
```

### xfs_admin (XFS)
```bash
# View info
xfs_admin -u /dev/sda1                # UUID
xfs_admin -l /dev/sda1                # Label

# Change label
xfs_admin -L "data" /dev/sda1

# Grow
xfs_growfs /mnt/data
```

### btrfs filesystem
```bash
# Btrfs commands
btrfs filesystem show
btrfs filesystem df /mnt/data           # Disk usage
btrfs filesystem du /mnt/data           # Size info
btrfs filesystem sync /mnt/data         # Sync all

# Defragment
btrfs filesystem defrag -r /mnt/data

# Balance (redistribute blocks)
btrfs balance start /mnt/data
btrfs balance status /mnt/data
```

## Compression

### Filesystem-Level
```bash
# Btrfs
mount -o compress=zstd /dev/sda1 /mnt
chattr +c file                         # Compress specific file

# ReiserFS (if available)
mount -o hash=rupasov,compress /dev/sda1 /mnt

# ZFS
zfs set compression=lz4 pool/data
zfs set compression=zstd-fast pool/data
```

### File-Level
```bash
# Compress directories
zstd -r big_dir/
find big_dir/ -name "*.zst" -delete

# Transparent compression
sudo apt install archivemount
archivemount archive.tar.gz /mnt/temp
```

## Mount Configuration

### /etc/fstab Options
```bash
# fstab format
# device mountpoint fstype options dump fsck_order

# Example entries
/dev/sda1 /mnt/data ext4 noatime,errors=remount-ro 0 2
/dev/sdb1 /mnt/cache xfs noatime,logbufs=8 0 0
/swapfile none swap sw 0 0

# Use labels or UUID (more stable)
LABEL=data /mnt/data ext4 noatime 0 2
UUID=xxx-yyy /mnt/data ext4 noatime 0 2
```

### Automount (autofs)
```bash
# /etc/auto.master
/mnt /etc/auto.mnt

# /etc/auto.mnt
data -fstype=ext4,noatime :/dev/sda1

# Enable
sudo systemctl enable --now autofs

# Manual trigger
ls /mnt/data                           # Mounts on access
```

## LVM (Logical Volume Management)

```bash
# Create LVM
pvcreate /dev/sda1
vgcreate data /dev/sda1
lvcreate -L 100G -n files data

# Extend LV
lvextend -L +50G /dev/data/files
resize2fs /dev/data/files               # ext4
xfs_growfs /mnt                       # XFS

# Reduce LV (ext4 only)
lvreduce -L 50G /dev/data/files

# Snapshots
lvcreate -L 10G -s -n snap /dev/data/files

# Remove snapshot
lvremove /dev/data/snap
```

## RAID (Software)

```bash
# Create RAID
mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sda1 /dev/sdb1

# Check status
cat /proc/mdstat
mdadm --detail /dev/md0

# Add to mdadm.conf
mdadm --detail --scan | sudo tee -a /etc/mdadm/mdadm.conf

# Update initramfs
update-initramfs -u                     # Debian/Ubuntu
dracut --force                         # Fedora/RHEL
```

## Filesystem Benchmarks

```bash
# Install tools
sudo apt install fio hdparm
sudo dnf install fio

# fio basic test
fio --name=test --ioengine=sync --rw=read --bs=4k --size=1G --direct=1 --filename=/testfile

# Write speed
dd if=/dev/zero of=/testfile bs=1G count=1 oflag=dsync
# Remove test file: rm testfile

# hdparm tests
sudo hdparm -Tt /dev/sda               # Cache + disk speed
sudo hdparm -I /dev/sda               # Drive info
```

## Filesystem Cleanup

```bash
# Find large directories
du -sh /* 2>/dev/null | sort -h

# Find deleted files still in use
lsof +L1

# Clean package cache
sudo apt clean
sudo dnf clean all

# Clean journal logs
journalctl --vacuum-size=100M

# Check inode usage
df -i                              # Inode count
df -ih                            # Inode usage %
```

## Filesystem Quotas

```bash
# Enable quotas
# /etc/fstab
/dev/sda1 /mnt ext4 defaults,usrquota,grpquota 0 2

# Remount
sudo mount -o remount /mnt

# Initialize quota files
sudo quotacheck -cum /mnt
sudo quotaon /mnt

# Set quota
sudo edquota user
sudo edquota -g group

# View quota
quota user
quota -g group
repquota /mnt
```

## Filesystem Migration

```bash
# Clone filesystem
# Check source
fsck -n /dev/source

# Clone to target
dd if=/dev/source of=/dev/target bs=64K status=progress

# Or file-based clone
partclone.ext4 -c -s /dev/source -o - | partclone.ext4 -r -s /dev/target -o -

# For XFS
xfsdump -f /tmp/dump /mnt/source
xfsrestore -f /tmp/dump /mnt/target
```

## Filesystem Security

```bash
# ext4 attributes
chattr +i file                     # Immutable
chattr -i file                     # Remove immutable
chattr +a file                     # Append-only
lsattr                             # View attributes

# ACL (extended permissions)
getfacl file
setfacl -m u:user:rwx file
setfacl -x u:user file
setfacl -b file                     # Remove all ACL

# SELinux context (if enabled)
ls -Z file
chcon -t httpd_exec_t file
restorecon -Rv /path
```

## Filesystem Monitoring

```bash
# Monitor I/O
iotop -o                           # Top I/O processes
iotop -ao                          # Accumulated
iostat -x 1                        # Per-device I/O

# Filesystem events
sudo fatrace                       # All filesystem events
sudo auditctl -w /path -p wa       # Audit watch
sudo ausearch -f /path

# SMART monitoring
sudo smartctl -a /dev/sda
sudo smartctl -H /dev/sda           # Health check
sudo smartctl -c /dev/sda           # Capabilities
```

## Filesystem Recovery Scripts

```bash
#!/bin/bash
# Quick filesystem check and repair script
DEVICE=$1

echo "Checking $DEVICE..."
if ! fsck -n $DEVICE 2>&1 | grep -q "clean"; then
    echo "Filesystem needs repair"
    fsck -y $DEVICE
else
    echo "Filesystem clean"
fi

# SMART check
smartctl -H $DEVICE >/dev/null 2>&1 && echo "SMART OK" || echo "SMART FAILED"
```

## Mount Troubleshooting

```bash
# Check why mount failed
dmesg | tail -20
journalctl -xe | grep -i mount

# Check if filesystem is dirty
dumpe2fs /dev/sda1 | grep "Filesystem state"

# Force check on next boot
touch /forcefsck
# Or set in fstab: 1 in fsck column

# Check for errors in logs
journalctl -p err | grep -i "I/O error\|filesystem"
```

## SSD Optimization

```bash
# Mount options for SSD
# /etc/fstab
/dev/sda1 /mnt ext4 noatime,discard 0 2

# Enable periodic TRIM (cron)
# /etc/cron.weekly/fstrim
#!/bin/sh
fstrim -av

# Or continuous TRIM
# Enable discard in mount options

# Check TRIM support
lsblk --discard
# If DISC-GRAN > 0, TRIM supported
```