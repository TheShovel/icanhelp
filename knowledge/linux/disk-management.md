# Linux Disk Management

## Disk Identification & Info
```bash
lsblk                    # List block devices (tree view)
lsblk -f                 # Show filesystems, labels, UUIDs
lsblk -o +SIZE,TYPE,FSTYPE,MOUNTPOINT,UUID
fdisk -l                 # List partitions (requires root)
parted -l                # GPT/MBR partition tables
blkid                    # Show UUIDs, labels, types
df -h                    # Disk usage human-readable
df -i                    # Inode usage
du -sh /path/*           # Directory sizes
```

## Partitioning

### fdisk (MBR/BIOS)
```bash
fdisk /dev/sdX
# Commands: n=new, p=primary, e=extended, w=write, q=quit
# Partition types: 83=Linux, 82=swap, 8e=LVM, ef=EFI
```

### parted / gdisk (GPT/UEFI)
```bash
parted /dev/sdX mklabel gpt
parted /dev/sdX mkpart primary ext4 1MiB 100%
# or gdisk for interactive GPT
gdisk /dev/sdX
```

### Partition Alignment
```bash
parted /dev/sdX align-check optimal 1   # Check 1MiB alignment
# Start partitions at 1MiB (2048 sectors) for SSD performance
```

## Filesystems

### Create Filesystems
```bash
mkfs.ext4 -L label /dev/sdX1
mkfs.xfs -L label /dev/sdX1
mkfs.btrfs -L label /dev/sdX1
mkfs.vfat -F32 /dev/sdX1        # EFI partition
mkswap /dev/sdX1                # Swap partition
```

### Filesystem Features
```bash
tune2fs -l /dev/sdX1            # ext4 info
tune2fs -O ^has_journal /dev/sdX1  # Disable journal (SSD)
tune2fs -o discard /dev/sdX1    # Enable discard (TRIM)
xfs_admin -l /dev/sdX1          # XFS info
btrfs filesystem show /dev/sdX1
```

### Mount Options (fstab)
```bash
# /etc/fstab format: device  mountpoint  fstype  options  dump  pass
UUID=xxxx  /mnt/data  ext4  defaults,noatime,discard  0  2
# noatime: disable access time updates (SSD)
# discard: enable TRIM (SSD)
# nofail: boot continues if missing
# x-systemd.automount: auto-mount on access
```

## LVM (Logical Volume Manager)

### Physical Volumes
```bash
pvcreate /dev/sdX1            # Initialize PV
pvs / pvdisplay               # List PVs
pvremove /dev/sdX1            # Remove PV
```

### Volume Groups
```bash
vgcreate vg0 /dev/sdX1        # Create VG
vgextend vg0 /dev/sdY1        # Add PV to VG
vgs / vgdisplay               # List VGs
vgreduce vg0 /dev/sdX1        # Remove PV from VG
```

### Logical Volumes
```bash
lvcreate -L 10G -n lv_root vg0
lvcreate -l 100%FREE -n lv_home vg0  # Use all free space
lvs / lvdisplay
lvextend -L +5G /dev/vg0/lv_root    # Extend LV
lvextend -l +100%FREE /dev/vg0/lv_root  # Use all free
resize2fs /dev/vg0/lv_root          # Resize ext4
xfs_growfs /mount/point             # Resize XFS
lvreduce -L -5G /dev/vg0/lv_root    # Shrink (unmount first!)
```

### LVM Snapshots
```bash
lvcreate -L 2G -s -n snap_root /dev/vg0/lv_root
# Mount snapshot: mount /dev/vg0/snap_root /mnt/snap
lvremove /dev/vg0/snap_root
```

### LVM on LUKS (Encrypted)
```bash
cryptsetup luksFormat /dev/sdX1
cryptsetup open /dev/sdX1 cryptroot
pvcreate /dev/mapper/cryptroot
vgcreate vg0 /dev/mapper/cryptroot
# Add to /etc/crypttab: cryptroot UUID=xxx none luks
```

## RAID (mdadm)
```bash
# RAID 1 (mirror)
mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sdX1 /dev/sdY1

# RAID 5 (striping + parity)
mdadm --create /dev/md0 --level=5 --raid-devices=3 /dev/sdX1 /dev/sdY1 /dev/sdZ1

# RAID 10 (mirror + stripe)
mdadm --create /dev/md0 --level=10 --raid-devices=4 /dev/sdX1 /dev/sdY1 /dev/sdZ1 /dev/sdW1

# Monitor
cat /proc/mdstat
mdadm --detail /dev/md0
mdadm --monitor --daemonise /dev/md0

# Add spare
mdadm --add /dev/md0 /dev/sdW1
# Replace failed
mdadm --fail /dev/md0 /dev/sdX1
mdadm --remove /dev/md0 /dev/sdX1
mdadm --add /dev/md0 /dev/sdNEW1

# Save config
mdadm --detail --scan >> /etc/mdadm.conf
update-initramfs -u
```

## Swap
```bash
# Swap file
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
# /etc/fstab: /swapfile none swap sw 0 0

# Swappiness (0-100, default 60)
echo 10 > /proc/sys/vm/swappiness
echo 'vm.swappiness=10' >> /etc/sysctl.conf
```

## Disk Health & Monitoring
```bash
smartctl -a /dev/sdX           # SMART data
smartctl -t short /dev/sdX     # Short self-test
smartctl -t long /dev/sdX      # Long self-test
smartctl -l selftest /dev/sdX  # Test results

# NVMe
nvme list
nvme smart-log /dev/nvme0

# Bad blocks
badblocks -v /dev/sdX          # Non-destructive read-only
badblocks -w /dev/sdX          # DESTRUCTIVE write test

# Disk usage monitoring
iostat -xz 1                   # I/O stats per device
iotop -o                       # I/O per process
dstat -d                       # Disk stats
```

## NFS/SMB Mounts
```bash
# NFS (install nfs-client)
mount -t nfs server:/share /mnt/nfs
# /etc/fstab: server:/share /mnt/nfs nfs defaults,_netdev 0 0

# SMB/CIFS (install cifs-utils)
mount -t cifs //server/share /mnt/smb -o username=user,password=pass,uid=1000,gid=1000
# /etc/fstab: //server/share /mnt/smb cifs credentials=/etc/smb-creds,_netdev 0 0
```

## Disk Encryption (LUKS)
```bash
cryptsetup luksFormat /dev/sdX1
cryptsetup luksOpen /dev/sdX1 cryptname
cryptsetup luksAddKey /dev/sdX1       # Add key
cryptsetup luksRemoveKey /dev/sdX1    # Remove key
cryptsetup luksDump /dev/sdX1         # Show slots
cryptsetup close cryptname
```

## Boot Repair (GRUB)
```bash
# From live USB
mount /dev/sdX2 /mnt          # root partition
mount /dev/sdX1 /mnt/boot/efi # EFI partition
for d in /dev /dev/pts /proc /sys /run; do mount --bind $d /mnt$d; done
chroot /mnt
grub-install /dev/sdX
update-grub
exit
for d in /mnt/run /mnt/sys /mnt/proc /mnt/dev/pts /mnt/dev; do umount $d; done
umount /mnt/boot/efi /mnt
```

## Common Issues
```bash
# "Device busy" unmount
fuser -km /mnt/point
umount -l /mnt/point          # Lazy unmount

# Full disk but df shows space
lsof +L1                      # Deleted but open files
systemctl daemon-reload       # Reload systemd mount units

# fstab errors on boot
# Boot with: systemd.mask=systemd-fsck@dev-sdX.service
# Or: systemd.mask=systemd-fsck-root.service
```