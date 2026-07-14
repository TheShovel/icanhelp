# LVM (Logical Volume Manager)

## LVM Concepts
- PV (Physical Volume) — physical storage device
- VG (Volume Group) — pool of storage from PVs
- LV (Logical Volume) — virtual partitions in VGs

## LVM Commands

### Physical Volumes
- `pvcreate /dev/sdb1` — initialize as PV
- `pvremove /dev/sdb1` — remove PV
- `pvdisplay` — show PV info
- `pvdisplay /dev/sdb1` — specific PV
- `pvs` — summary PV list
- `pvs -o +pv_used` — include used space

### Volume Groups
- `vgcreate vg0 /dev/sdb1` — create VG
- `vgremove vg0` — remove VG
- `vgextend vg0 /dev/sdc1` — add PV to VG
- `vgreduce vg0 /dev/sdb1` — remove PV from VG
- `vgdisplay vg0` — show VG info
- `vgs` — summary VG list
- `vgs -o +vg_free` — include free space

### Logical Volumes
- `lvcreate -L 10G vg0` — create 10GB LV
- `lvcreate -l 100%FREE vg0` — use all free space
- `lvcreate -L 5G -n data vg0` — named LV
- `lvcreate -L 2G --type thin-pool vg0` — thin pool
- `lvremove vg0/data` — remove LV
- `lvdisplay vg0/data` — show LV info
- `lvs` — summary LV list
- `lvs -o +lv_used,pool_metadata_percent`

## LVM Operations

### Size Management
- `lvextend -L +5G /dev/vg0/data` — grow LV by 5GB
- `lvextend -l +100%FREE /dev/vg0/data` — grow to max
- `lvreduce -L -5G /dev/vg0/data` — shrink LV (be careful!)
- `lvresize -L 20G /dev/vg0/data` — set exact size

### Filesystems
- `resize2fs /dev/vg0/data` — grow ext4 (online)
- `xfs_growfs /mount/point` — grow xfs (online)
- `btrfs filesystem resize max /mount/point` — grow btrfs (online)

### Filesystem Safety
```bash
# Shrink steps (ext4)
# 1. Unmount
umount /dev/vg0/data

# 2. Check filesystem
e2fsck -f /dev/vg0/data

# 3. Shrink filesystem first
resize2fs /dev/vg0/data 15G

# 4. Shrink LV
lvreduce -L 15G /dev/vg0/data

# 5. Remount
mount /dev/vg0/data
```

### Snapshots
- `lvcreate -L 5G --snapshot --name snap /dev/vg0/data` — create snapshot
- `lvremove /dev/vg0/snap` — remove snapshot
- `lvconvert --merge /dev/vg0/snap` — merge snapshot (extents only)
- `lvchange -ay /dev/vg0/snap` — activate snapshot
- `lvchange -an /dev/vg0/snap` — deactivate snapshot

### Thin Provisioning
```bash
# Create thin pool
lvcreate -L 100G --thinpool vg0/thinpool

# Create thin volume
lvcreate -V 10G --thin -n thinvol vg0/thinpool

# Extend thin pool
lvextend -L +50G vg0/thinpool

# Autoextend setting
lvmconfig --withcomment thin_pool_autoextend_threshold
```

## LVM Monitoring

### Check Status
- `lvs -a -o +devices` — show devices for all LVs
- `pvs --segments` — show segment distribution
- `vgs -o +lv_count,lv_size` — VG with LV count
- `dmsetup ls --tree` — device mapper tree

### Device Mapper
- `dmsetup ls` — list device mapper devices
- `dmsetup info` — device mapper info
- `dmsetup status` — device mapper status
- `dmsetup ls --tree` — hierarchy view

### LVM Info Files
- `/etc/lvm/lvm.conf` — main config
- `/etc/lvm/conf.d/` — config snippets
- `/etc/lvm/backup/` — VG metadata backups
- `/etc/lvm/archive/` — VG metadata archive

## Advanced LVM

### Striping
- `lvcreate -L 100G -i2 -I64 vg0` — 2-way stripe, 64KB stripe size
- `lvcreate -L 100G --stripes 3 --stripesize 128 gv0` — 3-way stripe

### Mirroring
- `lvcreate -L 50G --mirrors 1 vg0` — one mirror
- `lvconvert --mirror 2 /dev/vg0/data` — add mirrors
- `lvconvert --mirror 0 /dev/vg0/data` — remove mirrors

### RAID
- `lvcreate -L 100G --type raid1 vg0` — RAID1
- `lvcreate -L 100G --type raid10 vg0` — RAID10
- `lvcreate -L 100G --type raid5 vg0` — RAID5
- `lvcreate -L 100G --type raid6 vg0` — RAID6

### Cache Volume
```bash
# Create cache pool
lvcreate -L 10G --type cache-pool vg0/cache

# Convert LV to cached
lvconvert --type cache --cachepool vg0/cache /dev/vg0/data
```

## LVM Troubleshooting

### Activation Issues
```bash
# Deactivate VG
vgchange -an vg0

# Activate VG
vgchange -ay vg0

# Force activation
vgchange -ay --ignorelockingfailure vg0

# Rescan
pvscan --cache
vgscan
lvscan
```

### Metadata Recovery
```bash
# Check metadata
pvck /dev/sdb1

# Restore from backup
vgcfgrestore vg0

# Or from archive
vgcfgrestore -f /etc/lvm/archive/vg0_00005.vg vg0
```

### Replace Failed PV
```bash
# Mark as missing
pvdisplay --querymissing /dev/sdb1

# Replace with new disk
pvcreate /dev/sdd1
vgextend vg0 /dev/sdd1

# Move data
pvmove /dev/sdb1 /dev/sdd1

# Remove failed
vgreduce vg0 /dev/sdb1
pvremove /dev/sdb1
```

### Check Consistency
- `lvcheck /dev/vg0/data` — check for errors
- `fsck /dev/vg0/data` — filesystem check (offline)

## LVM Commands Reference

### Information
- `lvm display` — show LVM command hierarchy
- `lvm dumpconfig` — show config
- `lvm version` — version info
- `lvm help` — help

### Backup/Restore
- `vgcfgbackup vg0` — backup VG config
- `vgcfgrestore vg0` — restore VG config
- `vgexport vg0` — export VG (for moving)
- `vgimport vg0` — import VG

### Activation
- `lvchange -ay vg0/data` — activate LV
- `lvchange -an vg0/data` — deactivate LV
- `vgchange -ay` — activate all VGs
- `vgchange -ay --sysinit` — system activation

## LVM Examples

### Create Volume
```bash
# Initialize disks
pvcreate /dev/sdb /dev/sdc

# Create volume group
vgcreate vg0 /dev/sdb /dev/sdc

# Create logical volume
lvcreate -L 50G -n home vg0

# Create filesystem
mkfs.ext4 /dev/vg0/home

# Mount
mount /dev/vg0/home /home
```

### Extend Volume
```bash
# Check free space
vgs

# Extend LV
lvextend -L +10G /dev/vg0/home

# Resize filesystem
resize2fs /dev/vg0/home
```

### Snapshot Workflow
```bash
# Create snapshot for backup
lvcreate -L 5G --snapshot --name backup-snap /dev/vg0/data

# Mount snapshot
mkdir /mnt/snapshot
mount /dev/vg0/backup-snap /mnt/snapshot

# Backup
rsync -a /mnt/snapshot/ /backup/

# Cleanup
umount /mnt/snapshot
lvremove vg0/backup-snap
```

### LVM with Encryption
```bash
# Create encrypted LV
lvcreate -L 100G -n crypto vg0
cryptsetup luksFormat /dev/vg0/crypto
cryptsetup luksOpen /dev/vg0/crypto cryptolv
mkfs.ext4 /dev/mapper/cryptolv
mount /dev/mapper/cryptolv /secure
```

## Configuration

### lvm.conf Key Settings
```
# /etc/lvm/lvm.conf
devices {
    filter = [ "a|^/dev/sda$|", "r/.*/"  # Skip sda
}

activation {
    volume_list = [ "vg0" ]  # Only activate vg0
}

log {
    verbose = 1
}
```

### Filter Examples
- `filter = [ "r/.*/" ]` — reject all (safe default)
- `filter = [ "a|^/dev/sda$|", "r/.*/" ]` — only sda
- `filter = [ "a|^/dev/nvme.*|", "r/.*/" ]` — only NVMe