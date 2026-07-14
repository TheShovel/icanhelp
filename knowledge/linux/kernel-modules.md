# Linux Kernel Modules & Drivers

## Module Management Commands

```bash
# List loaded modules
lsmod                                    # All loaded modules
lsmod | grep nvidia                     # Specific module
lsmod -t ext4                          # Filter by type

# Module info
modinfo ext4                             # Info about module
modinfo -p ext4                          # Parameters only
modinfo -F filename ext4                 # Get filename
modinfo -F version nvidia                # Get version

# Load/unload modules
sudo modprobe module_name                  # Load module
sudo modprobe -r module_name              # Remove module
sudo rmmod module_name                     # Remove (old way)
sudo modprobe -f module_name             # Force load

# Load with parameters
sudo modprobe module_name parameter=value
```

## Module Configuration

### Blacklisting Modules
```bash
# Create blacklist
# /etc/modprobe.d/blacklist.conf
blacklist nouveau                          # NVIDIA open source
blacklist pcspkr                           # PC speaker beep
blacklist uvcvideo                         # Webcam
blacklist btusb                           # Bluetooth USB
blacklist nvidia_uvm                      # NVIDIA UVM

# Blacklist with dependencies
blacklist nouveau
install nouveau /bin/false                # Prevent loading

# After blacklisting
sudo update-initramfs -u                   # Debian/Ubuntu
sudo dracut --force                      # Fedora/RHEL
```

### Module Parameters
```bash
# Set parameters at boot
# /etc/modprobe.d/audio.conf
options snd_hda_intel power_save=1
options snd_hda_intel model=auto
options i915 enable_dc=2
options nvidia NVreg_RegistryDwords="PowerMizerEnable=0x1"

# Check parameter availability
modinfo module_name | grep -E "parm|description"

# Runtime parameters (if module allows)
echo 1 | sudo tee /sys/module/module_name/parameters/param_name
```

## Module Loading at Boot

```bash
# Files for module loading
/etc/modules                              # List of modules to load
/etc/modules-load.d/*.conf                 # Additional modules

# Load module at boot
echo "module_name" | sudo tee -a /etc/modules

# Module config directory
/etc/modprobe.d/*.conf                    # Module parameters
/lib/modprobe.d/*.conf                    # Distro defaults

# Initramfs rebuild (after changes)
sudo update-initramfs -u                   # Debian/Ubuntu
sudo dracut --force                      # Fedora/RHEL
sudo mkinitcpio -P                       # Arch
```

## DKMS (Dynamic Kernel Module Support)

```bash
# Check status
dkms status                              # All modules
dkms status -m nvidia                    # Specific module

# Install new module
sudo dkms install nvidia/535.129.03
sudo dkms install rtl88x2bu/1.0          # Example: WiFi driver

# Remove module
sudo dkms remove nvidia/535.129.03 --all

# Build for specific kernel
sudo dkms build nvidia/535.129.03 -k 6.5.0-14-generic

# Install from source directory
sudo dkms install -m nvidia -v 535.129.03

# Automatic rebuild on kernel update
# DKMS modules are automatically rebuilt via initramfs hooks
```

## Driver Troubleshooting

### Finding the Right Driver
```bash
# Check hardware ID
lspci -nn
lsusb -v | grep -E "idVendor|idProduct"

# Search for driver
lspci -k                                # Show kernel driver in use
lspci -v | grep -A 5 "Kernel driver"    # Driver details

# Load required firmware
dmesg | grep -i "firmware"
sudo apt install firmware-linux-nonfree
sudo apt install firmware-linux
```

### Module Dependency Issues
```bash
# Check dependencies
lsmod | grep module_name
modinfo module_name | grep depends

# Force dependencies
# /etc/modules-load.d/custom.conf
# List modules in dependency order

# Check missing modules
sudo depmod -a                        # Rebuild module dependency DB
```

## Graphics Drivers

### NVIDIA (proprietary)
```bash
# Check driver version
nvidia-smi
cat /proc/driver/nvidia/version

# Install drivers
sudo apt install nvidia-driver-535     # Debian/Ubuntu
sudo dnf install akmod-nvidia            # Fedora (akmod rebuilds automatically)

# Check which driver
lspci -k -s 01:00.0                   # Replace with your GPU PCI address

# Nouveau (open source)
lsmod | grep nouveau
# Blacklist nouveau to use proprietary
```

### AMD (amdgpu)
```bash
# Check AMD driver
lspci -k -s 01:00.0
lsmod | grep amdgpu

# Enable features
# /etc/default/grub
# radeon.si_support=0 amdgpu.si_support=1    # Southern Islands
# radeon.cik_support=0 amdgpu.cik_support=1  # Sea Islands

# Power management
echo battery | sudo tee /sys/class/drm/card0/device/power_dpm_state
```

### Intel (i915)
```bash
# Check driver
lsmod | grep i915
lspci -k -s 00:02.0

# Enable features
# /etc/modprobe.d/i915.conf
options i915 enable_dc=2               # Power saving
options i915 enable_fbc=1              # Frame buffer compression
options i915 modeset=1                 # Modesetting
```

## WiFi Drivers

### Check WiFi Chipset
```bash
# Find chipset
lspci | grep -i wireless
lsusb | grep -i wireless
dmesg | grep -i "wireless\|wlan"

# Check driver
lspci -k -s 03:00.0
iwconfig
rfkill list

# Common chipsets
# Intel: iwlwifi, iwlmvm modules
# Atheros: ath9k, ath10k
# Realtek: rtl8821ae, rtl8723de
# Broadcom: bcma, brcmsmac, wl
```

### Install Missing Firmware
```bash
# Debian/Ubuntu
sudo apt install firmware-iwlwifi
sudo apt install firmware-realtek
sudo apt install firmware-atheros

# Fedora
sudo dnf install linux-firmware

# Check missing
dmesg | grep -i "firmware missing\|request_firmware"
```

## Module Debugging

```bash
# Check module loading
dmesg | grep -i "module_name\|loading"
journalctl -k | grep modprobe

# Module parameters in use
cat /sys/module/module_name/parameters/*

# Module state
cat /proc/modules | grep module_name

# Check if module is available
modinfo module_name 2>/dev/null && echo "Available" || echo "Not found"
find /lib/modules/$(uname -r) -name "module_name*"

# Load with debug
sudo modprobe module_name debug=1
```

## USB Devices & Modules

```bash
# USB modules
lsmod | grep usb
lsmod | grep "usbhid\|usbcore\|xhci"

# Check USB device driver
lsusb -t
udevadm info -a -p $(udevadm info -q path -n /dev/bus/usb/001/002)

# Create udev rule for specific USB
# /etc/udev/rules.d/99-my-usb.rules
SUBSYSTEM=="usb", ATTR{idVendor}=="1234", ATTR{idProduct}=="5678", MODE="0666"

# Reload udev rules
sudo udevadm control --reload-rules
sudo udevadm trigger
```

## Sound Modules

```bash
# Check audio modules
lsmod | grep -E "snd|sound|audio"
aplay -l                                # Playback devices
arecord -l                             # Capture devices

# Common sound modules
snd_hda_intel                          # Intel HD audio
snd_usb_audio                           # USB audio
snd_pcm                                 # PCM (digital audio)
snd_hda_codec_realtek                   # Realtek codec
snd_hda_codec_hdmi                      # HDMI audio

# Reload audio
sudo modprobe -r snd_hda_intel
sudo modprobe snd_hda_intel
```

## Virtual Machine Modules

```bash
# KVM support
lsmod | grep kvm
kvm-ok                                 # Check KVM support (Ubuntu)

# Load KVM modules
sudo modprobe kvm_intel                  # Intel
sudo modprobe kvm_amd                    # AMD

# Check nested virtualization
cat /sys/module/kvm_intel/parameters/nested
```

## Module Signing (Secure Boot)

```bash
# Check Secure Boot
mokutil --sb-state

# Sign module for Secure Boot
# Generate key (one-time)
openssl req -new -x509 -newkey rsa:2048 -keyout MOK.priv -outform DER -out MOK.der -nodes -days 36500 -subj "/CN=Module Sign/"

# Sign module
/usr/src/linux-headers-$(uname -r)/scripts/sign-file sha256 ./MOK.priv ./MOK.der /lib/modules/$(uname -r)/kernel/drivers/.../module.ko

# Register key
sudo mokutil --import MOK.der
# Reboot and enroll in MOK manager
```

## Module Compression

```bash
# Check if modules are compressed
find /lib/modules/$(uname -r) -name "*.ko.xz"

# Decompress module
xz -d module.ko.xz

# Compress module
xz module.ko

# Build uncompressed modules
# In kernel config: CONFIG_MODULE_COMPRESS_NONE=y
```

## Common Module Issues

### Module not found
```bash
# Check kernel version
uname -r

# Update module database
sudo depmod -a

# Install missing package
sudo apt install linux-modules-extra-$(uname -r)
```

### Module loading fails
```bash
# Check why
dmesg | tail -20
sudo modprobe -v module_name

# Check missing dependencies
sudo modprobe --dump-modversions module_name

# Check for signature issues
dmesg | grep -i "signature\|module verification"
```

### Black screen after driver load
```bash
# Boot with nomodeset
# Add to GRUB: nomodeset

# Remove problematic driver
sudo modprobe -r nouveau
sudo modprobe -r nvidia

# Switch TTY
Ctrl+Alt+F2
# Then investigate
```

## Module Information Scripts

```bash
# Check all graphics modules
#!/bin/bash
echo "=== GPU Modules ==="
lsmod | grep -E "nvidia|amdgpu|radeon|i915"

# Check all audio modules
#!/bin/bash
echo "=== Audio Modules ==="
lsmod | grep "^snd"

# Check driver conflicts
#!/bin/bash
echo "=== Driver Conflicts ==="
lspci -k | grep -E "Kernel driver|Kernel modules"
```