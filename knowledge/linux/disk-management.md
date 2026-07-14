# Disk Management

## Identify Disks (read-only, safe)
Prefer the `sys` wrapper for inventory; native tools for detail.
```bash
sys disk list                 # block devices + fs/label/UUID (lsblk -f)
sys disk usage                # usage per mount (df -h)
sys disk mounts               # mount tree (findmnt)
sys disk fs /path            # dir size (du -sh)
# Native detail (not wrapped by sys):
lsblk -o +SIZE,TYPE,FSTYPE,MOUNTPOINT,UUID
fdisk -l                 # partition tables (root)
parted -l                # GPT/MBR tables (root)
blkid                    # UUIDs, labels, types
df -i                    # inode usage
```

## Partitioning
```bash
# MBR/BIOS (interactive)
fdisk /dev/sdX
# n=new p=primary w=write q=quit; types: 83=Linux 82=swap 8e=LVM ef=EFI

# GPT/UEFI
parted /dev/sdX mklabel gpt
parted /dev/sdX mkpart primary ext4 1MiB 100%
parted /dev/sdX align-check optimal 1   # verify 1MiB alignment
# or gdisk /dev/sdX (interactive GPT)
```

## Create Filesystems (DESTRUCTIVE — not run, flags verified via --help)
```bash
mkfs.ext4 -L label /dev/sdX1
mkfs.xfs  -L label /dev/sdX1
mkfs.btrfs -L label /dev/sdX1
mkfs.vfat -F32 /dev/sdX1     # EFI partition
mkswap /dev/sdX1             # swap partition
```

## LVM (see lvm.md for full reference)
```bash
pvcreate /dev/sdX1
vgcreate vg0 /dev/sdX1
lvcreate -L 10G -n lv_root vg0
lvcreate -l 100%FREE -n lv_home vg0
lvextend -L +5G /dev/vg0/lv_root
resize2fs /dev/vg0/lv_root          # ext4 grow
xfs_growfs /mount/point             # XFS grow
lvcreate -L 2G -s -n snap /dev/vg0/lv_root   # snapshot
lvremove /dev/vg0/snap
```

## RAID (mdadm)
```bash
mdadm --create /dev/md0 --level=1  --raid-devices=2 /dev/sdX1 /dev/sdY1
mdadm --create /dev/md0 --level=5  --raid-devices=3 /dev/sdX1 /dev/sdY1 /dev/sdZ1
mdadm --create /dev/md0 --level=10 --raid-devices=4 /dev/sdX1 /dev/sdY1 /dev/sdZ1 /dev/sdW1
cat /proc/mdstat
mdadm --detail /dev/md0
mdadm --add /dev/md0 /dev/sdW1                 # spare
mdadm --fail /dev/md0 /dev/sdX1                 # mark failed
mdadm --remove /dev/md0 /dev/sdX1
mdadm --detail --scan >> /etc/mdadm.conf       # save config
```

## Swap
```bash
# Create + enable a swap file (wraps fallocate/mkswap/swapon):
sys swap file /swapfile 8G
# /etc/fstab: /swapfile none swap sw 0 0
# Status / enable / disable existing devices:
sys swap status
sys swap on /dev/sdX1
sys swap off /dev/sdX1
# Tuning (native):
echo 10 | sudo tee /proc/sys/vm/swappiness      # 0-100, default 60
```

## Disk Encryption (LUKS)
```bash
cryptsetup luksFormat /dev/sdX1
cryptsetup luksOpen /dev/sdX1 cryptname
cryptsetup luksAddKey /dev/sdX1
cryptsetup luksDump /dev/sdX1
cryptsetup close cryptname
```

## Network Mounts
```bash
mount -t nfs server:/share /mnt/nfs
# /etc/fstab: server:/share /mnt/nfs nfs defaults,_netdev 0 0
mount -t cifs //server/share /mnt/smb -o username=user,password=pass,uid=1000,gid=1000
# /etc/fstab: //server/share /mnt/smb cifs credentials=/etc/smb-creds,_netdev 0 0
```

## Common Issues
```bash
fuser -km /mnt/point      # kill users of a mount
umount -l /mnt/point      # lazy unmount
lsof +L1                  # deleted-but-open files (full disk w/ free space)
systemctl daemon-reload   # reload systemd mount units
```
