# Linux Virtualization (QEMU/KVM)

## KVM Setup

```bash
# Check support
kvm-ok                                 # Ubuntu/Debian
grep -E "vmx|svm" /proc/cpuinfo          # Intel/AMD flags

# Install packages
sudo apt install qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils virt-manager
sudo dnf install @virtualization virt-manager

# Enable services
sudo systemctl enable --now libvirtd
sudo systemctl enable --now virtlogd

# Add user to groups
sudo usermod -aG libvirt,kvm $USER
newgrp libvirt
```

## libvirt Management

```bash
# List VMs
virsh list --all                        # All VMs
virsh list                             # Running only

# Start/stop VMs
virsh start vm-name
virsh shutdown vm-name
virsh destroy vm-name               # Force stop
virsh suspend vm-name                 # Pause
virsh resume vm-name                  # Resume

# VM info
virsh dominfo vm-name
virsh domstats vm-name
virsh dumpxml vm-name                  # XML config

# XML editing
virsh edit vm-name
virsh define /path/to/config.xml
```

## QEMU Direct Usage

```bash
# Basic VM
qemu-system-x86_64 \
    -enable-kvm \
    -m 4G \
    -drive file=disk.img,format=qcow2 \
    -cdrom iso.iso \
    -boot d \
    -net nic -net user

# With virtio (better performance)
qemu-system-x86_64 \
    -enable-kvm \
    -m 4G \
    -drive file=disk.qcow2,if=virtio,format=qcow2 \
    -net nic,model=virtio \
    -net user \
    -display gtk

# Snapshot mode (temporary)
qemu-system-x86_64 -snapshot -enable-kvm ...

# Using libvirt backend
qemu-system-x86_64 -enable-kvm -libvirt qemu.conf ...
```

## Disk Images

```bash
# Create images
qemu-img create -f qcow2 vm.qcow2 20G
qemu-img create -f raw vm.raw 20G

# Convert formats
qemu-img convert -f vmdk -O qcow2 vm.vmdk vm.qcow2
qemu-img convert -f qcow2 -O raw vm.qcow2 vm.raw

# Resize images
qemu-img resize vm.qcow2 +10G

# Check image info
qemu-img info vm.qcow2
qemu-img map vm.qcow2

# Compress image
qemu-img convert -O qcow2 -c vm.qcow2 compressed.qcow2
```

## Network Bridging

```bash
# Create bridge for VM networking
# /etc/netplan/01-bridge.yaml (Ubuntu)
network:
  version: 2
  renderer: networkd
  bridges:
    br0:
      interfaces: [eth0]
      addresses: [192.168.1.100/24]
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8]

# Or with systemd-networkd
# /etc/systemd/network/20-br0.netdev
[NetDev]
Name=br0
Kind=bridge

# /etc/systemd/network/25-br0.network
[Match]
Name=br0

[Network]
DHCP=yes
```

## VM Configuration Files

```xml
<!-- /etc/libvirt/qemu/vm-name.xml -->
<domain type='kvm'>
  <name>myvm</name>
  <memory unit='MiB'>4096</memory>
  <currentMemory unit='MiB'>4096</currentMemory>
  <vcpu>2</vcpu>
  <os>
    <type arch='x86_64'>hvm</type>
  </os>
  <features>
    <acpi/>
    <apic/>
    <vmport state='off'/>
  </features>
  <cpu mode='host-model'/>
  <devices>
    <disk type='file' device='disk'>
      <driver name='qemu' type='qcow2'/>
      <source file='/var/lib/libvirt/images/disk.qcow2'/>
      <target dev='vda' bus='virtio'/>
    </disk>
    <interface type='bridge'>
      <source bridge='br0'/>
      <model type='virtio'/>
    </interface>
    <graphics type='spice' autoport='yes'/>
    <console type='pty'/>
    <input type='tablet' bus='usb'/>
  </devices>
</domain>
```

## SPICE Client Access

```bash
# Connect to VM
virt-viewer vm-name
remote-viewer spice://192.168.1.100:5900

# Disable password auth (for local testing only)
# In XML:
<graphics type='spice' autoport='yes'>
  <listen type='address'/>
  <image compression='off'/>
</graphics>

# Add to autostart
# ~/.config/autostart/vm-viewer.desktop
[Desktop Entry]
Name=VM Viewer
Exec=virt-viewer -a vm-name
```

## CPU Passthrough

```bash
# Check host CPU features
lscpu
cat /proc/cpuinfo

# CPU passthrough modes
# In VM XML:
<cpu mode='host-passthrough'/>        # Full passthrough
<cpu mode='host-model'/>              # Recommended for migration
<cpu mode='host-model' check='partial'/>  # Ignore missing features

# Enable nested virtualization (for VMs inside VM)
# Intel:
echo 1 | sudo tee /sys/module/kvm_intel/parameters/nested

# AMD:
echo 1 | sudo tee /sys/module/kvm_amd/parameters/nested
```

## GPU Passthrough

```bash
# Check IOMMU groups
for d in /sys/kernel/iommu_groups/*/devices/*; do
    n=$(basename $(dirname $d))
    printf 'IOMMU Group %s ' "$n"
    lspci -nns $(basename $d)
done

# Enable IOMMU
# Intel:
# GRUB: intel_iommu=on iommu=pt

# AMD:
# GRUB: amd_iommu=on iommu=pt

# VFIO binding
# /etc/modprobe.d/vfio.conf
options vfio-pci ids=10de:1f07,10de:10f0

# Check binding
dmesg | grep -i vfio
lspci -k -s 01:00.0
```

## USB Passthrough

```bash
# Find USB device
lsusb -v | grep -E "idVendor|idProduct"

# Pass through in VM
# In VM XML:
<hostdev mode='subsystem' type='usb'>
  <source>
    <vendor id='0x1234'/>
    <product id='0x5678'/>
  </source>
</hostdev>

# Temporary USB redirect
virsh attach-device vm-name usb-device.xml
virsh detach-device vm-name usb-device.xml
```

## Storage Backends

```bash
# Directory storage
mkdir /srv/vms
virsh pool-define-as --name vms --target /srv/vms --type dir
virsh pool-build vms
virsh pool-start vms
virsh pool-autostart vms

# LVM storage
pvcreate /dev/sdb
vgcreate vms /dev/sdb
lvcreate -L 20G -n vm1 vms

# ZFS storage
zfs create -V 20G -b 4k vms/vm1
zfs set compression=lz4 vms

# Ceph storage (for clusters)
# Requires ceph-common and rbd packages
```

## QEMU Guest Agent

```bash
# Install in guest
sudo apt install qemu-guest-agent
sudo dnf install qemu-guest-agent

# Enable service
sudo systemctl enable --now qemu-guest-agent

# In VM XML:
<channel type='unix'>
  <target type='virtio' name='org.qemu.guest_agent.0'/>
</channel>

# Guest commands
guest-info                            # VM info
guest-fsinfo                          # Filesystem info
guest-get-time                      # Get guest time
```

## Live Migration

```bash
# Shared storage required (NFS, Ceph, etc.)
# Check storage
virsh dumpxml vm-name | grep source

# Migrate VM
virsh migrate --live --persistent vm-name qemu+ssh://dest-host/system

# Offline migration
virsh migrate vm-name qemu+ssh://dest-host/system

# Cancel migration
virsh migrate-cancel vm-name
```

## QEMU Snapshots

```bash
# Internal snapshots (qcow2 only)
qemu-img snapshot -c snapshot-name disk.qcow2
qemu-img snapshot -l disk.qcow2
qemu-img snapshot -a snapshot-name disk.qcow2
qemu-img snapshot -d snapshot-name disk.qcow2

# External snapshots (libvirt)
virsh snapshot-create-as vm-name snapshot-name
virsh snapshot-list vm-name
virsh snapshot-revert vm-name snapshot-name
virsh snapshot-delete vm-name snapshot-name
```

## Performance Tuning

```bash
# I/O performance
# In VM XML:
<disk>
  <driver cache='none' io='native' .../>
</disk>

# CPU pinning
# In VM XML:
<vcpu placement='static'>4</vcpu>
<cputune>
  <vcpupin vcpu='0' cpuset='0'/>
  <vcpupin vcpu='1' cpuset='1'/>
</cputune>

# Huge pages
echo 2048 | sudo tee /proc/sys/vm/nr_hugepages
# In VM XML:
<memoryBacking>
  <hugepages/>
</memoryBacking>

# I/O threads
# In VM XML:
<iothreads>1</iothreads>
<disk>
  <driver iothread='1' .../>
</disk>
```

## Networking Modes

```bash
# NAT (default)
<interface type='network'>
  <source network='default'/>
</interface>

# Bridge
<interface type='bridge'>
  <source bridge='br0'/>
</interface>

# MacVTap
<interface type='direct'>
  <source dev='eth0' mode='bridge'/>
</interface>

# TAP without libvirt
ip tuntap add dev tap0 mode tap
ip link set tap0 up
```

## QEMU Monitor

```bash
# CLI monitor
qemu-system-x86_64 -monitor stdio

# Commands in monitor
info status                            # VM status
info network                           # Network devices
info block                             # Block devices
stop                                   # Pause VM
cont                                   # Resume VM
savevm snapshot-name                   # Create snapshot
loadvm snapshot-name                   # Load snapshot
quit                                   # Exit
```

## VM Creation Script

```bash
#!/bin/bash
# Quick VM creator
VM_NAME=$1
ISO=$2

virt-install \
    --name $VM_NAME \
    --vcpus 4 \
    --memory 4096 \
    --disk size=20,bus=virtio,format=qcow2 \
    --network bridge=br0,model=virtio \
    --graphics spice,listen=0.0.0.0 \
    --console pty,target_type=serial \
    --location $ISO,initrd=initrd.img \
    --extra-args "console=ttyS0,115200" \
    --noautoconsole
```

## Common Issues

### VM won't boot
```bash
# Check firmware
# In VM XML:
<os>
  <type arch='x86_64' machine='pc-q35-5.2'>hvm</type>
  <loader readonly='yes' type='pflash'>/usr/share/ovmf/OVMF_CODE.fd</loader>
  <nvram>/var/lib/libvirt/nvram/vm-name_VARS.fd</nvram>
</os>
```

### Poor performance
```bash
# Check virtio drivers in guest
lsmod | grep virtio

# Install virtio drivers
# Fedora: already included
# Windows: virtio-win drivers

# Check CPU features
lscpu | grep -E "vmx|svm"
```

### No network in VM
```bash
# Check bridge exists
ip link show type bridge

# Check libvirtd network
virsh net-list --all

# Default network
sudo virsh net-start default
sudo virsh net-autostart default
```