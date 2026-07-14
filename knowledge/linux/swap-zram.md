# Linux Swap & ZRAM Management

## Swap Overview

Swap provides additional virtual memory when RAM is exhausted. It can be:
- A swap partition
- A swap file
- ZRAM (compressed swap in RAM)
- ZSwap (compressed cache for swap)

## Swap Setup

### Swap Partition
```bash
# Check swap
swapon --show
cat /proc/swaps
free -h

# Create swap partition
sudo fdisk /dev/sda
# Create new partition (type 82)

# Format swap
sudo mkswap /dev/sda2

# Enable swap
sudo swapon /dev/sda2

# Make permanent
# /etc/fstab
/dev/sda2 none swap sw 0 0

# Set priority
sudo swapon -p 10 /dev/sda2
# In fstab: /dev/sda2 none swap sw,pri=10 0 0
```

### Swap File
```bash
# Create swap file
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile               # Security: only root

# Or with dd (if fallocate not supported)
sudo dd if=/dev/zero of=/swapfile bs=1M count=8192

# Format and enable
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
# /etc/fstab
/swapfile none swap sw 0 0
```

### Swap File for Hibernation
```bash
# Swap file must be contiguous and have correct offset
sudo fallocate -l 16G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile

# Get UUID and offset
sudo blkid /swapfile
# Find offset (required for hibernation)
sudo filefrag -v /swapfile | grep "Physical"| head -1 | awk '{print $3}'  # Offset in ext4 blocks

# GRUB kernel parameters
# /etc/default/grub
GRUB_CMDLINE_LINUX="... resume=UUID=xxx resume_offset=xxx"

# Apply
sudo update-grub
```

## Swap Tuning

### Swappiness
```bash
# Check current
cat /proc/sys/vm/swappiness

# Change temporarily (0-100)
echo 10 | sudo tee /proc/sys/vm/swappiness
# 0 = avoid swap until OOM
# 100 = swap aggressively

# Make permanent
# /etc/sysctl.d/99-swappiness.conf
vm.swappiness=10

# Apply
sudo sysctl -p /etc/sysctl.d/99-swappiness.conf
```

### Cache Pressure
```bash
# Check current
cat /proc/sys/vm/vfs_cache_pressure

# Change (100 is default, higher = more cache reclaim)
echo 150 | sudo tee /proc/sys/vm/vfs_cache_pressure

# Make permanent
# /etc/sysctl.d/99-cache-pressure.conf
vm.vfs_cache_pressure=150
```

### Swap Priority
```bash
# Set priority (higher = used first)
sudo swapon -p 10 /dev/sda2
sudo swapon -p 5 /swapfile

# Check priority
swapon --show --raw
```

## ZRAM (Compressed Swap in RAM)

```bash
# Check if available
ls /dev/zram*

# Load module
sudo modprobe zram

# Configure
echo 4G | sudo tee /sys/block/zram0/disksize

# Format and enable
sudo mkswap /dev/zram0
sudo swapon -p 100 /dev/zram0

# Permanent setup (systemd)
# /etc/systemd/zram-generator.conf
[zram0]
zram-size = ram
compression-algorithm = lz4
swap-priority = 100
```

### systemd-zram-generator
```bash
# Install
sudo apt install systemd-zram-generator
sudo dnf install zram-generator

# Configure
# /etc/systemd/zram-generator.conf
[zram0]
zram-size = min(ram, 4096)             # Min of RAM or 4GB
compression-algorithm = lz4
swap-priority = 100

# Apply
sudo systemctl restart systemd-zram-setup@zram0.service
```

## ZSwap (Compressed Swap Cache)

```bash
# Check if enabled
cat /sys/module/zswap/parameters/enabled

# Enable at boot
# /etc/default/grub
GRUB_CMDLINE_LINUX="... zswap.enabled=1 zswap.compressor=lz4"

# Parameters
# zswap.enabled=1
# zswap.compressor=lz4|zstd|lz4hc
# zswap.max_pool_percent=25
# zswap.accept_threshold_percent=80
```

## Swap Monitoring

```bash
# Check swap usage
free -h
swapon --show
cat /proc/swaps

# Swap activity
vmstat 1                                 # si/so columns
cat /proc/vmstat | grep -E "si|so"
sar -W 1                                 # Requires sysstat

# Per-process swap usage
for file in /proc/*/status; do
    awk '/VmSwap|Name/{printf $2 " " $3}END{ print ""}' $file
done | grep -v "0 kB" | sort -k 3 -n

# No need to swap
sudo grep -r . /proc/sys/vm/ | grep -E "swappiness|swap"
```

## Swap Tuning Parameters

```bash
# /etc/sysctl.d/99-swap.conf
# Swappiness (default 60)
vm.swappiness=10

# Cache pressure
vm.vfs_cache_pressure=150

# Watermark scale (memory pressure detection)
vm.watermark_scale_factor=200            # Higher = less swap

# Page clustering
vm.page-cluster=0                        # Disable read-ahead clustering

# Apply
sudo sysctl --system
```

## Swap Encryption

```bash
# Check if encrypted
lsblk -f | grep swap

# Create encrypted swap
# Requires cryptsetup
sudo cryptsetup open --type plain /dev/sda2 swap_encrypted --key-file /dev/urandom
sudo mkswap /dev/mapper/swap_encrypted
sudo swapon /dev/mapper/swap_encrypted

# Or with LUKS
sudo cryptsetup luksFormat /dev/sda2
sudo cryptsetup open /dev/sda2 swap_crypt
sudo mkswap /dev/mapper/swap_crypt
sudo swapon /dev/mapper/swap_crypt
```

## Swap File Optimization

```bash
# Create optimized swap file
sudo fallocate -l 8G --posix-expand /swapfile
# Or use dd with direct I/O
sudo dd if=/dev/zero of=/swapfile bs=1M count=8192 oflag=direct

# Ensure file is contiguous
sudo filefrag -v /swapfile | grep -E "size|length"
# Should show single extent

# For SSD - reduce wear
# Swap on separate partition mounted with noatime
# Or use ZRAM to avoid swap entirely
```

## Swap on NVMe/SSD

```bash
# Mount swap partition with special options
# /etc/fstab for swap file partition
/dev/sda2 /var/swap ext4 defaults,noatime,nodiratime 0 2

# Optimize for SSD
# Consider lower swappiness to reduce writes
echo 5 | sudo tee /proc/sys/vm/swappiness

# Enable discard (TRIM)
# GRUB: nvme_core.default_ps_max_latency_us=0
```

## Container Swap

```bash
# Docker - disable swap limit by default
# /etc/docker/daemon.json
{
  "default-ulimits": {
    "memlock": {
      "Name": "memlock",
      "Hard": -1,
      "Soft": -1
    }
  }
}

# podman - inherit host swap
# No special config needed

# Check container swap
cat /sys/fs/cgroup/memory/memory.memsw.usage_in_bytes
```

## Swap Troubleshooting

### Swap not being used
```bash
# Check swappiness
cat /proc/sys/vm/swappiness

# Check if swap is actually needed
free -h
# If plenty of cache, kernel may not need swap

# Force swap usage (test)
sudo swapon /dev/sda2
sudo dd if=/dev/zero of=/tmp/test bs=1M count=1024
# Should trigger swap when RAM fills
rm /tmp/test
```

### Swap thrashing
```bash
# Check swap activity
vmstat 1

# Reduce swappiness
echo 1 | sudo tee /proc/sys/vm/swappiness

# Add more RAM or swap

# Check process memory usage
ps aux --sort=-%mem | head -20
# Kill memory hogs if necessary
```

### Swap file fragmentation
```bash
# Check fragmentation
sudo filefrag -v /swapfile

# Defragment (recreate)
sudo swapoff /swapfile
sudo swapon /swapfile
# Or copy to new file if fragmented
```

## Swap Performance Comparison

```bash
# Test different swap types
echo "Testing swap performance..."

# ZRAM test
sudo modprobe zram
echo 4G | sudo tee /sys/block/zram0/disksize
sudo mkswap /dev/zram0
time sudo swapon -p 100 /dev/zram0

# SSD swap test
time sudo swapon /dev/nvme0n1p2

# Compare vmstat during load
# Run memory-intensive task, compare si/so values
```

## Emergency Swap Scripts

```bash
# Quick swap file creator
#!/bin/bash
SIZE=${1:-4G}
sudo fallocate -l $SIZE /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab

# Swap toggle script
#!/bin/bash
if grep -q "/swapfile" /proc/swaps; then
    sudo swapoff /swapfile
    echo "Swap disabled"
else
    sudo swapon /swapfile
    echo "Swap enabled"
fi
```

## Hibernation with Swap

```bash
# Check hibernation support
cat /sys/power/disk
# Should show: test testproc [shutdown] reboot

# Check swap size (must be >= RAM)
free -h
swapon --show

# Resume parameters in GRUB
# /etc/default/grub
GRUB_CMDLINE_LINUX="resume=UUID=xxx"

# For swap file
# Need UUID and offset
sudo blkid /swapfile
sudo filefrag -v /swapfile | head -1
```

## Swap Monitoring Script

```bash
#!/bin/bash
# swap-monitor.sh
while true; do
    SWAP=$(free | awk '/Swap/{printf "%.0f", $3/$2 * 100}')
    if [ "$SWAP" -gt 50 ]; then
        echo "Warning: Swap usage at ${SWAP}%"
        free -h
        vmstat 1 3
    fi
    sleep 60
done
```