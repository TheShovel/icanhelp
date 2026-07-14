# Linux Virtualization (QEMU/KVM)

## Check support (verified)
```bash
grep -E "vmx|svm" /proc/cpuinfo     # Intel/AMD virtualization flags
sys kern lsmod | grep kvm
```

## Install (use `sys pkg`)
```bash
sys pkg install qemu-base libvirt virt-manager
```

## libvirt service (use `sys svc`)
```bash
sys svc enable --now libvirtd
sys svc status libvirtd
sys user mod -aG libvirt,kvm "$USER"   # add user to groups
virsh list --all
virsh start vm-name
virsh shutdown vm-name
virsh destroy vm-name             # force
virsh dominfo vm-name
virsh dumpxml vm-name
```

## Disk images (qemu-img)
```bash
qemu-img create -f qcow2 vm.qcow2 20G
qemu-img convert -f vmdk -O qcow2 vm.vmdk vm.qcow2
qemu-img resize vm.qcow2 +10G
qemu-img info vm.qcow2
qemu-img snapshot -c snap disk.qcow2
qemu-img snapshot -l disk.qcow2
```

## Run directly (QEMU)
```bash
qemu-system-x86_64 -enable-kvm -m 4G \
  -drive file=disk.qcow2,if=virtio,format=qcow2 \
  -cdrom iso.iso -boot d -display gtk
```

## Snapshots (libvirt)
```bash
virsh snapshot-create-as vm-name snap1
virsh snapshot-list vm-name
virsh snapshot-revert vm-name snap1
```

## Networking
```bash
virsh net-list --all
sudo virsh net-start default
sudo virsh net-autostart default
ip link show type bridge
```

## Passthrough
```bash
# USB: virsh attach-device vm-name usb.xml
# GPU: check IOMMU groups
for d in /sys/kernel/iommu_groups/*/devices/*; do
  printf 'Group %s ' "$(basename $(dirname $d))"; lspci -nns $(basename $d); done
# Enable: intel_iommu=on iommu=pt (GRUB)
```

## Create VM
```bash
virt-install --name vm --vcpus 2 --memory 2048 \
  --disk size=20,bus=virtio,format=qcow2 \
  --network bridge=br0,model=virtio \
  --graphics spice --console pty,target_type=serial
```

## Troubleshooting
- **No boot**: ensure OVMF (`/usr/share/ovmf/OVMF_CODE.fd`) for UEFI guests.
- **Poor perf**: install `virtio` drivers in guest (`sys kern lsmod | grep virtio`).
- **No network**: start `default` libvirt network (above).
