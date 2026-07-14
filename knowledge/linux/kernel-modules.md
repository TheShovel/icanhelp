# Linux Kernel Modules & Drivers

Prefer the `sys kern` wrapper for module ops; it maps to `lsmod`/`modprobe`/`modinfo`/`rmmod` and handles initramfs rebuild automatically.

## Module Management
```bash
sys kern lsmod                 # list loaded modules (lsmod)
sys kern lsmod | grep nvidia   # filter
sys kern modinfo <module>      # module info (modinfo)
sys kern modinfo -p <module>   # parameters only
sys kern modinfo -F filename <module>  # filename
sys kern modprobe <module>     # load with dependencies (root)
sys kern rmmod <module>        # remove (root)
# Native (not wrapped): depmod -a   # rebuild module dependency DB (root)
```

Note: `modinfo`/`modprobe` resolve against `/lib/modules/$(uname -r)`. Built-in modules (e.g. ext4) report "not found" — that is expected. `lsmod -t` is NOT a valid option (use `lsmod | grep`).

## Configuration
```bash
# /etc/modprobe.d/*.conf
blacklist nouveau             # prevent module from loading
options snd_hda_intel power_save=1   # set parameter
install nouveau /bin/false    # hard-block loading
```
Check parameter availability: `sys kern modinfo <module> | grep -E "parm"`.

## Loading at Boot
```bash
# /etc/modules-load.d/*.conf  — list modules to load
echo "module_name" | tee -a /etc/modules-load.d/my.conf
# Rebuild initramfs after changes — use the wrapper (maps to
# update-initramfs / dracut / mkinitcpio automatically):
sys kern initramfs
```

## DKMS (Dynamic Kernel Module Support)
```bash
dkms status                  # all modules
dkms status -m nvidia        # specific
dkms install nvidia/535.129.03
dkms remove nvidia/535.129.03 --all
```

## Driver Troubleshooting
```bash
lspci -nn                    # hardware IDs (tested: works)
lspci -k                     # driver in use (tested: works)
lsusb -v | grep -E "idVendor|idProduct"
dmesg | grep -i firmware     # missing firmware (root in sandbox)
sys kern modinfo <module> | grep depends
```

## Graphics Drivers
```bash
# NVIDIA
nvidia-smi                   # driver version + stats
lspci -k -s 01:00.0          # driver for GPU (replace address)
sys kern lsmod | grep nouveau   # open-source driver loaded?

# AMD (amdgpu)
sys kern lsmod | grep amdgpu
lspci -k -s 01:00.0

# Intel (i915)
sys kern lsmod | grep i915
```

## WiFi
```bash
lspci | grep -i wireless
lsusb | grep -i wireless
rfkill list                  # blocked state
dmesg | grep -i "wireless\|wlan"   # (root in sandbox)
# Common: iwlwifi (Intel), ath9k/ath10k (Atheros), rtl* (Realtek), wl (Broadcom)
```

## KVM Virtualization
```bash
sys kern lsmod | grep kvm
kvm-ok                       # support check (Ubuntu)
sys kern modprobe kvm_intel  # Intel (root)
sys kern modprobe kvm_amd    # AMD (root)
cat /sys/module/kvm_intel/parameters/nested   # nested virt
```

## USB & Sound Modules
```bash
sys kern lsmod | grep -E "usbhid|usbcore|xhci"
sys kern lsmod | grep -E "^snd"       # audio modules
aplay -l ; arecord -l        # playback/capture devices
```

## Module Signing (Secure Boot)
```bash
mokutil --sb-state           # check Secure Boot
# Sign: openssl req -new -x509 ... ; then sign-file sha256 key.der module.ko
# Register: mokutil --import MOK.der  (enroll in MOK manager on reboot)
```
