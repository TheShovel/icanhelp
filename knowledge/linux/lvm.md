# LVM (Logical Volume Manager)

PV (Physical Volume) → VG (Volume Group) → LV (Logical Volume).

## Create
```bash
pvcreate /dev/sdb1 /dev/sdc1
vgcreate vg0 /dev/sdb1 /dev/sdc1
lvcreate -L 50G -n home vg0
lvcreate -l 100%FREE -n data vg0      # use all free space
mkfs.ext4 /dev/vg0/home
mount /dev/vg0/home /home
```

## Extend (online grow)
```bash
lvextend -L +10G /dev/vg0/home
lvextend -l +100%FREE /dev/vg0/home
resize2fs /dev/vg0/home              # ext4
xfs_growfs /mount/point              # XFS
btrfs filesystem resize max /mount/point   # btrfs
```

## Shrink (ext4, offline — risky)
```bash
umount /dev/vg0/data
e2fsck -f /dev/vg0/data
resize2fs /dev/vg0/data 15G          # shrink fs FIRST
lvreduce -L 15G /dev/vg0/data        # then LV
mount /dev/vg0/data
```

## Snapshots
```bash
lvcreate -L 5G -s -n snap /dev/vg0/data        # create
lvremove /dev/vg0/snap                         # remove
lvconvert --merge /dev/vg0/snap                # merge back
# Backup workflow: snapshot -> rsync -> remove
mkdir /mnt/snap; mount /dev/vg0/snap /mnt/snap
rsync -a /mnt/snap/ /backup/; umount /mnt/snap; lvremove vg0/snap
```

## Thin Provisioning
```bash
lvcreate -L 100G --thinpool vg0/thinpool
lvcreate -V 10G --thin -n thinvol vg0/thinpool
lvextend -L +50G vg0/thinpool
```

## Advanced Types
```bash
lvcreate -L 100G -i2 -I64 vg0                  # striped (2-way, 64K)
lvcreate -L 50G --mirrors 1 vg0                # mirrored
lvcreate -L 100G --type raid1 vg0              # RAID1
lvcreate -L 100G --type raid10 vg0             # RAID10
lvcreate -L 10G --type cache-pool vg0/cache    # cache pool
lvconvert --type cache --cachepool vg0/cache /dev/vg0/data
```

## Info & Monitoring
```bash
pvs / vgs / lvs
pvdisplay / vgdisplay / lvdisplay
lvs -a -o +devices
pvs --segments
dmsetup ls --tree
```

## Activation & Recovery
```bash
vgchange -ay vg0                # activate
vgchange -an vg0                # deactivate
pvscan --cache; vgscan; lvscan  # rescan
pvck /dev/sdb1                  # check metadata
vgcfgrestore vg0                # restore from backup
vgcfgbackup vg0                 # backup VG config
# Replace failed PV:
pvcreate /dev/sdd1; vgextend vg0 /dev/sdd1
pvmove /dev/sdb1 /dev/sdd1; vgreduce vg0 /dev/sdb1; pvremove /dev/sdb1
```

## Config
`/etc/lvm/lvm.conf` — `devices { filter = [ "a|^/dev/nvme.*|", "r/.*/" ] }` to restrict scanned devices.
