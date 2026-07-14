# Disk Performance & Tuning

## Storage Stack
```
App → VFS → Filesystem (ext4/xfs/btrfs/zfs) → Block layer
    → I/O scheduler (none/mq-deadline/kyber/bfq) → Driver → Hardware
```

## I/O Schedulers
```bash
cat /sys/block/nvme0n1/queue/scheduler      # current
echo none > /sys/block/nvme0n1/queue/scheduler   # NVMe (root)
echo mq-deadline > /sys/block/sda/queue/scheduler
echo bfq > /sys/block/sdb/queue/scheduler
```
udev rule (`/etc/udev/rules.d/60-ioscheduler.rules`):
```udev
ACTION=="add|change", KERNEL=="nvme*", ATTR{queue/scheduler}="none"
ACTION=="add|change", KERNEL=="sd*",   ATTR{queue/scheduler}="mq-deadline"
```

| Workload | Scheduler |
|----------|-----------|
| NVMe SSD | `none` |
| SATA SSD | `mq-deadline` / `kyber` |
| HDD | `bfq` (desktop) / `mq-deadline` (server) |
| Virtualized | `none` |
| Database | `none` / `mq-deadline` |

## Monitoring
```bash
iostat -xz 1                 # per-device I/O (sysstat) — install sysstat
iostat -xz 1 nvme0n1
iotop -o                     # I/O by process (root) — install iotop
dstat -d                     # disk stats (root)
sys perf io                  # quick I/O snapshot (vmstat)
```

## Benchmarking
```bash
# fio (install: pacman -S fio)
fio --name=seqread  --ioengine=libaio --rw=read      --bs=1M --size=4G --numjobs=4 --iodepth=32 --runtime=60 --group_reporting
fio --name=randread --ioengine=libaio --rw=randread  --bs=4k --size=4G --numjobs=4 --iodepth=32 --runtime=60 --group_reporting
fio --name=mixed    --ioengine=libaio --rw=randrw --rwmixread=70 --bs=4k --size=4G --numjobs=4 --iodepth=32 --runtime=60 --group_reporting

# hdparm (root)
hdparm -Tt /dev/sda          # cache + disk speed
hdparm -I /dev/sda           # drive info

# dd write test (then delete the file)
dd if=/dev/zero of=/testfile bs=1G count=1 oflag=dsync; rm /testfile
```

## Kernel Tuning (/etc/sysctl.d/99-storage.conf)
```bash
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
vm.dirty_expire_centisecs = 1500
vm.dirty_writeback_centisecs = 100
vm.swappiness = 1
vm.vfs_cache_pressure = 50
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288
# Apply: sysctl --system
```

## Queue / Cache Tuning (root)
```bash
echo 1024 > /sys/block/nvme0n1/queue/nr_requests   # queue depth
blockdev --setra 4096 /dev/nvme0n1                  # read-ahead 2MB
hdparm -W0 /dev/sda                                 # disable write cache (HDD safety)
```

## NVMe (nvme-cli — install nvme-cli)
```bash
nvme list
nvme smart-log /dev/nvme0
nvme error-log /dev/nvme0
```

## NFS Tuning
```bash
# Client /etc/fstab
server:/data /mnt/data nfs defaults,vers=4.2,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport 0 0
# nconnect=4  - multiple TCP connections
```
Server `/etc/nfs.conf`: `[nfsd] threads=64`.

## Troubleshooting
| Symptom | Check | Fix |
|---------|-------|-----|
| High `await` | `iostat -xz 1` | scheduler, queue depth, hardware |
| High `%util`, low IOPS | `iostat` | increase `nr_requests` |
| Write stalls | `vm.dirty_*` | tune dirty ratios |
| iowait | `top` / `iotop` | find process |
| NFS slow | `nfsiostat` | rsize/wsize, nconnect |
| SSD wear | `nvme smart-log` | check percentage_used |
| TRIM not working | `fstrim -v /` | enable discard |
