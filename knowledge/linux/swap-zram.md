# Swap & ZRAM

Swap extends virtual memory when RAM is full. Forms: partition, file, ZRAM (compressed in RAM), ZSwap (compressed cache).

## Check (safe)
Lead with the `sys` wrapper; native tools for detail.
```bash
sys swap status                # swapon --show + free -h
# Native detail (not wrapped by sys):
swapon --show --raw
cat /proc/swaps
free -h
```

## Swap File
```bash
# Create + enable (wraps fallocate/mkswap/swapon):
sys swap file /swapfile 8G
# /etc/fstab: /swapfile none swap sw 0 0
# If fallocate unsupported: dd if=/dev/zero of=/swapfile bs=1M count=8192
```

## Swap Partition
```bash
sudo mkswap /dev/sda2
sys swap on /dev/sda2          # swapon /dev/sda2
# /etc/fstab: /dev/sda2 none swap sw,pri=10 0 0
sudo swapon -p 10 /dev/sda2    # priority (higher used first)
```

## Tuning
```bash
cat /proc/sys/vm/swappiness          # 0-100, default 60
echo 10 | sudo tee /proc/sys/vm/swappiness
# /etc/sysctl.d/99-swappiness.conf: vm.swappiness=10
cat /proc/sys/vm/vfs_cache_pressure  # default 100
echo 150 | sudo tee /proc/sys/vm/vfs_cache_pressure
# Apply: sudo sysctl -p /etc/sysctl.d/99-swappiness.conf
```

## ZRAM (compressed swap in RAM)
```bash
ls /dev/zram*            # check devices
sudo modprobe zram
echo 4G | sudo tee /sys/block/zram0/disksize
sudo mkswap /dev/zram0
sys swap on -p 100 /dev/zram0
```
Persistent via systemd-zram-generator (`/etc/systemd/zram-generator.conf`):
```ini
[zram0]
zram-size = ram
compression-algorithm = lz4
swap-priority = 100
```

## ZSwap (compressed swap cache)
```bash
cat /sys/module/zswap/parameters/enabled
# Enable in GRUB: zswap.enabled=1 zswap.compressor=lz4 zswap.max_pool_percent=25
```

## Monitoring
```bash
vmstat 1                 # si/so = swap in/out
cat /proc/vmstat | grep -E "pswp|pgsteal"
sar -W 1                 # sysstat
# Per-process swap:
for f in /proc/*/status; do awk '/VmSwap|Name/{printf $2" "$3}END{print ""}' $f; done | grep -v "0 kB" | sort -k3 -n
```

## Encrypted Swap
```bash
sudo cryptsetup open --type plain /dev/sda2 swap_crypt --key-file /dev/urandom
sudo mkswap /dev/mapper/swap_crypt
sys swap on /dev/mapper/swap_crypt
```

## Troubleshooting
- Swap unused: check `swappiness` and that RAM+cache isn't sufficient.
- Thrashing: `vmstat 1`; lower `swappiness`; add RAM.
- Fragmented swap file: `swapoff` then `swapon` to rebuild.
