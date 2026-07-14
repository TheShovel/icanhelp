# Filesystem Tuning & Maintenance

## Common Mount Options
```bash
# Generic
defaults        # rw,suid,dev,exec,auto,nouser,async
noatime         # skip access-time updates (perf)
relatime        # relative atime (default)
discard         # enable TRIM for SSD
ro / rw         # read-only / read-write

# Security
noexec          # no executable files
nosuid          # ignore setuid bits
nodev           # no device nodes
```

### ext4
```bash
mount -o noatime,data=writeback /dev/sda1 /mnt/data
# data=writeback  - journal metadata only (fast)
# data=ordered    - data before metadata (default, safe)
# data=journal    - journal everything (safest)
# commit=N        - sync every N seconds
# errors=remount-ro | panic
```

### XFS
```bash
mount -o noatime,logbufs=8,logbsize=256k /dev/sda1 /mnt
# inode64   - allow 64-bit inodes
# nobarrier - skip write barriers (battery-backed cache only)
```

### fstab
```bash
# device  mountpoint  fstype  options  dump  pass
UUID=xxxx  /mnt/data  ext4  defaults,noatime,errors=remount-ro  0  2
LABEL=data /mnt/data  ext4  defaults,noatime                     0  2
# nofail            - continue boot if missing
# x-systemd.automount - mount on access
```

## Check & Repair (unmount first)
```bash
fsck -n /dev/sda1        # check only, no fixes
fsck -y /dev/sda1        # fix automatically
fsck -f /dev/sda1        # force check
e2fsck -f /dev/sda1      # ext2/3/4
xfs_repair -n /dev/sda1  # XFS read-only check
xfs_repair /dev/sda1     # XFS repair
btrfs check --readonly /dev/sda1   # btrfs (unmounted)
btrfs scrub start /mnt/data        # live checksum check
btrfs scrub status /mnt/data
smartctl -H /dev/sda     # SMART health (root)
```

## Resize
```bash
resize2fs /dev/sda1            # ext4 grow to max
resize2fs /dev/sda1 10G        # ext4 to size
xfs_growfs /mnt/data           # XFS grow only (no shrink in place)
btrfs filesystem resize +2G /mnt/data
btrfs filesystem resize max /mnt/data
```

## Tuning Tools
```bash
tune2fs -l /dev/sda1           # ext4 params
tune2fs -m 1 /dev/sda1         # reserved blocks -> 1%
tune2fs -c 20 /dev/sda1        # check every 20 boots
tune2fs -L data /dev/sda1      # label
tune2fs -O ^has_journal /dev/sda1   # disable journal (ext4, risky)

xfs_admin -u /dev/sda1         # XFS UUID
xfs_admin -L data /dev/sda1    # XFS label

btrfs filesystem df /mnt/data   # space usage
btrfs filesystem du /mnt/data   # per-file usage
btrfs filesystem defrag -r /mnt/data
btrfs balance start -dusage=50 /mnt/data   # reclaim after deletes
```

## Compression
```bash
mount -o compress=zstd /dev/sda1 /mnt   # btrfs
chattr +c file                          # compress a single file (btrfs)
zfs set compression=zstd pool/data       # zfs
```

## Quotas
```bash
# /etc/fstab: /dev/sda1 /mnt ext4 defaults,usrquota,grpquota 0 2
mount -o remount /mnt
quotacheck -cum /mnt
quotaon /mnt
edquota user
repquota /mnt
```

## Cleanup
```bash
sys disk usage               # disk free per mount (df -h)
sys disk fs /               # top-level dir sizes (du -sh)
du -sh /* 2>/dev/null | sort -h      # large dirs
lsof +L1                             # deleted but open (holds space)
sys log vacuum 100M                  # trim journal logs
df -i                                # inode exhaustion check
```

## Security
```bash
chattr +i file     # immutable
chattr +a file     # append-only
lsattr             # view attributes
getfacl file
setfacl -m u:user:rwx file
setfacl -b file    # remove all ACLs
```

## Monitoring
```bash
iostat -x 1        # per-device I/O (sysstat)
iotop -o           # I/O by process (root)
smartctl -a /dev/sda   # full SMART (root)
dmesg | tail -20   # mount/fs errors
```
