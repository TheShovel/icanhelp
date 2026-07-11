# Linux Disk Performance & Storage

## Storage Stack

```
Application
    ↓
VFS (Virtual File System)
    ↓
File System (ext4, xfs, btrfs, zfs)
    ↓
Block Layer
    ↓
I/O Scheduler (none, mq-deadline, kyber, bfq)
    ↓
Device Driver (nvme, scsi, virtio)
    ↓
Hardware (NVMe, SSD, HDD, RAID, Network)
```

## File Systems

### ext4

```bash
# Create
mkfs.ext4 -L data /dev/nvme0n1p1

# Mount options
defaults,noatime,discard,errors=remount-ro

# Features
tune2fs -O ^has_journal /dev/nvme0n1p1  # Disable journal
tune2fs -o journal_data_writeback /dev/nvme0n1p1  # Writeback mode

# Check
e2fsck -f /dev/nvme0n1p1

# Resize
resize2fs /dev/nvme0n1p1
```

### XFS

```bash
# Create
mkfs.xfs -L data /dev/nvme0n1p1

# Mount options
defaults,noatime,discard,allocsize=16m

# Grow (online, no shrink)
xfs_growfs /mount/point

# Repair
xfs_repair /dev/nvme0n1p1

# Defrag
xfs_fsr /mount/point
```

### Btrfs

```bash
# Create
mkfs.btrfs -L data /dev/nvme0n1p1

# Subvolumes
btrfs subvolume create /mnt/data/@home
btrfs subvolume create /mnt/data/@var

# Snapshots (read-only)
btrfs subvolume snapshot -r /mnt/data/@home /mnt/snapshots/home-$(date +%F)

# Send/Receive (backup)
btrfs send /mnt/snapshots/home-2024-01-15 | btrfs receive /mnt/backup/

# Compression
mount -o compress=zstd:3 /dev/nvme0n1p1 /mnt
chattr +c /mnt/data  # Per-directory

# Scrub (check/repair)
btrfs scrub start /mnt
btrfs scrub status /mnt

# Balance
btrfs balance start -dusage=50 /mnt
```

### ZFS (OpenZFS)

```bash
# Install
apt install zfsutils-linux

# Create pool
zpool create -f -o ashift=12 data mirror /dev/nvme0n1 /dev/nvme1n1

# Create datasets
zfs create data/home
zfs create data/var
zfs create -o compression=zstd data/docker

# Snapshots
zfs snapshot data/home@daily-$(date +%F)
zfs send data/home@daily-2024-01-15 | zfs receive backup/home

# Properties
zfs set compression=zstd data
zfs set atime=off data
zfs set recordsize=1M data/docker

# Scrub
zpool scrub data
zpool status data

# Replace disk
zpool replace data /dev/nvme0n1 /dev/nvme2n1
```

## Block Devices

### LVM (Logical Volume Manager)

```bash
# Physical volumes
pvcreate /dev/nvme0n1
pvcreate /dev/nvme1n1

# Volume group
vgcreate vg_data /dev/nvme0n1 /dev/nvme1n1

# Logical volumes
lvcreate -L 100G -n lv_home vg_data
lvcreate -l 100%FREE -n lv_var vg_data

# Filesystem
mkfs.ext4 /dev/vg_data/lv_home

# Resize (online grow)
lvextend -L +50G /dev/vg_data/lv_home
resize2fs /dev/vg_data/lv_home

# Snapshot
lvcreate -L 10G -s -n lv_home_snap /dev/vg_data/lv_home

# Remove
lvremove /dev/vg_data/lv_home_snap
```

### RAID (mdadm)

```bash
# Create RAID 1 (mirror)
mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/nvme0n1 /dev/nvme1n1

# Create RAID 5
mdadm --create /dev/md0 --level=5 --raid-devices=3 /dev/nvme0n1 /dev/nvme1n1 /dev/nvme2n1

# Create RAID 10
mdadm --create /dev/md0 --level=10 --raid-devices=4 /dev/nvme0n1 /dev/nvme1n1 /dev/nvme2n1 /dev/nvme3n1

# Monitor
mdadm --detail /dev/md0
cat /proc/mdstat

# Add spare
mdadm --add /dev/md0 /dev/nvme3n1

# Replace failed
mdadm --fail /dev/md0 /dev/nvme0n1
mdadm --remove /dev/md0 /dev/nvme0n1
mdadm --add /dev/md0 /dev/nvme3n1

# Grow
mdadm --grow /dev/md0 --level=5 --raid-devices=4 --add /dev/nvme3n1

# Save config
mdadm --detail --scan >> /etc/mdadm/mdadm.conf
update-initramfs -u
```

### NVMe

```bash
# List
nvme list
nvme list-subsys

# SMART
nvme smart-log /dev/nvme0

# Format (change sector size)
nvme format -l 1 /dev/nvme0  # 4KB sectors

# Firmware update
nvme fw-download /dev/nvme0 -f firmware.bin
nvme fw-commit /dev/nvme0

# Namespace management
nvme create-ns /dev/nvme0 -s 100G -c 100G -f 2 -d 0 -m 0
nvme attach-ns /dev/nvme0 -n 1 -c 0
```

### iSCSI

```bash
# Target (server)
apt install tgt
# /etc/tgt/targets.conf
<target iqn.2024-01.com.example:storage.disk1>
    backing-store /dev/vg_data/lv_iscsi
    initiator-address 192.168.1.100
</target>

# Initiator (client)
apt install open-iscsi
iscsiadm -m discovery -t st -p 192.168.1.10
iscsiadm -m node -T iqn.2024-01.com.example:storage.disk1 -p 192.168.1.10 -l

# Auto-connect
# /etc/iscsi/iscsid.conf
node.startup = automatic
```

## I/O Schedulers

```bash
# Check current
cat /sys/block/nvme0n1/queue/scheduler

# Change (per device)
echo none > /sys/block/nvme0n1/queue/scheduler
echo mq-deadline > /sys/block/sda/queue/scheduler
echo bfq > /sys/block/sdb/queue/scheduler

# Persistent (udev rule)
# /etc/udev/rules.d/60-ioscheduler.rules
ACTION=="add|change", KERNEL=="nvme*", ATTR{queue/scheduler}="none"
ACTION=="add|change", KERNEL=="sd*", ATTR{queue/scheduler}="mq-deadline"

# Kernel boot parameter (all NVMe)
nvme_core.default_ps_max_latency_us=0 pcie_aspm=off
```

### Scheduler Selection

| Workload | Recommended |
|----------|-------------|
| NVMe SSD | `none` (no scheduler) |
| SATA SSD | `mq-deadline` or `kyber` |
| HDD | `bfq` (desktop) / `mq-deadline` (server) |
| Virtualized | `none` (hypervisor handles) |
| Database | `none` or `mq-deadline` |

## Monitoring & Benchmarking

### iostat

```bash
# Basic
iostat -xz 1

# Per device
iostat -xz 1 nvme0n1

# Extended
iostat -xz 1 -d -p nvme0n1

# JSON
iostat -xz 1 -o JSON
```

Key metrics:
- `%util` - Device utilization (near 100% = saturated)
- `await` - Average I/O wait time (ms)
- `svctm` - Average service time (ms)
- `rrqm/s`, `wrqm/s` - Merged requests/sec
- `r/s`, `w/s` - Read/write IOPS
- `rkB/s`, `wkB/s` - Throughput (KB/s)

### iotop

```bash
# Process I/O
iotop -o  # Only processes doing I/O
iotop -P  # Threads instead of processes

# Accumulated
iotop -a
```

### blktrace / btrace

```bash
# Trace block I/O
blktrace -d /dev/nvme0n1 -o - | blkparse -i -

# Analyze
btrace /dev/nvme0n1
```

### fio (Flexible I/O Tester)

```bash
# Sequential read
fio --name=seqread --ioengine=libaio --rw=read --bs=1M --size=4G --numjobs=4 --runtime=60 --group_reporting

# Random read (4K)
fio --name=randread --ioengine=libaio --rw=randread --bs=4k --size=4G --numjobs=4 --iodepth=32 --runtime=60 --group_reporting

# Random write
fio --name=randwrite --ioengine=libaio --rw=randwrite --bs=4k --size=4G --numjobs=4 --iodepth=32 --runtime=60 --group_reporting

# Mixed (70/30 read/write)
fio --name=mixed --ioengine=libaio --rw=randrw --rwmixread=70 --bs=4k --size=4G --numjobs=4 --iodepth=32 --runtime=60 --group_reporting

# Latency percentiles
fio --name=latency --ioengine=libaio --rw=randread --bs=4k --size=1G --numjobs=1 --iodepth=1 --runtime=60 --group_reporting --percentile_list=50:90:99:99.9:99.99
```

Key fio outputs:
- `IOPS` - Operations per second
- `BW` - Bandwidth (MiB/s)
- `lat` - Latency (us): min, max, mean, stdev
- `clat` - Completion latency percentiles

### nvme-cli

```bash
# Perf stats
nvme perf-log /dev/nvme0

# Error log
nvme error-log /dev/nvme0

# Temperature
nvme smart-log /dev/nvme0 | grep temperature
```

## Performance Tuning

### Mount Options

```bash
# /etc/fstab
# ext4
/dev/nvme0n1p1  /data  ext4  defaults,noatime,discard,errors=remount-ro  0  2

# xfs
/dev/nvme0n1p1  /data  xfs   defaults,noatime,discard,allocsize=16m  0  2

# btrfs
/dev/nvme0n1p1  /data  btrfs  defaults,noatime,compress=zstd:3,space_cache=v2  0  2

# zfs (no fstab, use zfs mount)
```

### Kernel Parameters

```bash
# /etc/sysctl.d/99-storage.conf

# Dirty pages (writeback)
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
vm.dirty_expire_centisecs = 1500
vm.dirty_writeback_centisecs = 100

# Swap (avoid swapping with enough RAM)
vm.swappiness = 1
vm.vfs_cache_pressure = 50

# File handles
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288

# Network buffers (for NFS/iSCSI)
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864

# Apply
sysctl --system
```

### Disk Scheduler Tuning

```bash
# NVMe: increase queue depth
echo 1024 > /sys/block/nvme0n1/queue/nr_requests

# Read-ahead (sequential workloads)
blockdev --setra 4096 /dev/nvme0n1  # 2MB

# Disable write cache on HDD (safety)
hdparm -W0 /dev/sda
```

## NFS Performance

### Server (/etc/exports)

```
/data 192.168.1.0/24(rw,sync,no_subtree_check,no_root_squash)
```

### Client Mount Options

```bash
# /etc/fstab
server:/data  /mnt/data  nfs  defaults,vers=4.2,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport  0  0

# Options:
# rsize/wsize=1M  - Max read/write size
# hard            - Retry forever (vs soft = fail)
# timeo=600       - Timeout 60s (tenths of sec)
# retrans=2       - Retries before error
# noresvport      - Don't use reserved ports
# vers=4.2        - NFSv4.2
```

### NFS Tuning

```bash
# Server: /etc/nfs.conf
[nfsd]
threads=64
tcp=y
vers4=y

# Client: increase slots
echo 256 > /proc/fs/nfs/nfs_callback_tcpport
# Mount with: nconnect=4 (multiple TCP connections)
```

## Benchmarking Methodology

```bash
#!/bin/bash
# benchmark.sh

DEVICE="/dev/nvme0n1"
MOUNT="/mnt/test"
RESULTS="/root/benchmarks/$(date +%F)"

mkdir -p "$RESULTS"

# Pre-condition
fio --name=precond --ioengine=libaio --rw=randwrite --bs=128k --size=100% --numjobs=4 --iodepth=32 --runtime=600 --filename="$DEVICE" --direct=1

# Wait for GC
sleep 300

# Sequential
for bs in 128k 256k 512k 1M; do
    fio --name=seqread --ioengine=libaio --rw=read --bs=$bs --size=10G --numjobs=4 --iodepth=32 --runtime=60 --group_reporting --filename="$DEVICE" --direct=1 --output="$RESULTS/seqread_$bs.json" --output-format=json
    fio --name=seqwrite --ioengine=libaio --rw=write --bs=$bs --size=10G --numjobs=4 --iodepth=32 --runtime=60 --group_reporting --filename="$DEVICE" --direct=1 --output="$RESULTS/seqwrite_$bs.json" --output-format=json
done

# Random 4K
for rwmix in 100 70 50 0; do
    fio --name=rand_${rwmix} --ioengine=libaio --rw=randrw --rwmixread=$rwmix --bs=4k --size=10G --numjobs=4 --iodepth=32 --runtime=60 --group_reporting --filename="$DEVICE" --direct=1 --output="$RESULTS/rand_${rwmix}.json" --output-format=json
done

# Latency
fio --name=latency --ioengine=libaio --rw=randread --bs=4k --size=1G --numjobs=1 --iodepth=1 --runtime=60 --group_reporting --filename="$DEVICE" --direct=1 --percentile_list=50:90:99:99.9:99.99 --output="$RESULTS/latency.json" --output-format=json
```

## Troubleshooting

| Symptom | Check | Fix |
|---------|-------|-----|
| High `await` | `iostat -xz 1` | Check scheduler, queue depth, hardware |
| High `%util` but low IOPS | `iostat` | Small I/O size, increase `nr_requests` |
| Write stalls | `vm.dirty_*` | Tune dirty ratios, faster storage |
| iowait CPU | `top` / `htop` | Identify process with `iotop` |
| NFS slow | `nfsiostat` | Increase rsize/wsize, nconnect |
| SSD wear | `nvme smart-log` | Check percentage_used, reduce writes |
| TRIM not working | `fstrim -v /` | Enable discard, check filesystem support |

## Capacity Planning

```
Usable Space:
- RAID 1:  50% (n/2)
- RAID 5:  (n-1)/n  (67% for 3, 75% for 4)
- RAID 6:  (n-2)/n  (50% for 4, 60% for 5)
- RAID 10: 50% (n/2)

Overhead:
- Filesystem: 1-5%
- LVM: ~1%
- Compression: -20% to -60% (data dependent)
- Snapshots: +10-20% per snapshot

IOPS Estimation:
- NVMe: 100K-1M+ IOPS
- SATA SSD: 50K-100K IOPS
- 15K HDD: 180 IOPS
- 10K HDD: 120 IOPS
- 7.2K HDD: 80 IOPS

Throughput:
- NVMe PCIe 4.0: 7 GB/s
- NVMe PCIe 3.0: 3.5 GB/s
- SATA SSD: 550 MB/s
- HDD: 150-250 MB/s
```