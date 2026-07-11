# Linux Package Management

## apt (Debian/Ubuntu)

### Basic Operations
```bash
apt update                    # Update package lists
apt upgrade                   # Upgrade installed packages
apt full-upgrade              # Upgrade with dependency resolution (may remove)
apt install package           # Install package
apt install package=version   # Install specific version
apt remove package            # Remove package (keep config)
apt purge package             # Remove package + config
apt autoremove                # Remove unused dependencies
apt clean                     # Clear downloaded .deb files
apt autoclean                 # Clear old .deb files
```

### Search & Info
```bash
apt search keyword            # Search packages
apt show package              # Show package details
apt policy package            # Show versions available/installed
apt list --installed          # List installed packages
apt list --upgradable         # List upgradable packages
apt depends package           # Show dependencies
apt rdepends package          # Show reverse dependencies
```

### Package File Operations
```bash
dpkg -i package.deb           # Install .deb file
dpkg -l                       # List all installed
dpkg -L package               # List files in package
dpkg -S /path/to/file         # Find package owning file
dpkg --configure -a           # Fix interrupted installs
apt install -f                # Fix broken dependencies
```

### Hold/Pin Packages
```bash
apt-mark hold package         # Prevent upgrades
apt-mark unhold package       # Allow upgrades
apt-mark showhold             # List held packages

# Pinning (/etc/apt/preferences.d/)
Package: nginx
Pin: version 1.18.*
Pin-Priority: 1000
```

### Repositories
```bash
add-apt-repository ppa:user/ppa
add-apt-repository "deb [arch=amd64] https://repo.example.com/ubuntu jammy main"
# Then: apt update

# Keys
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys KEYID
# Modern: gpg --dearmor -o /etc/apt/trusted.gpg.d/keyring.gpg < key.pub
```

### Offline/Debian Based
```bash
# Download without installing
apt download package
apt-get install --download-only package

# Create local repo
apt-ftparchive packages . > Packages
gzip -c Packages > Packages.gz
# In sources.list: deb [trusted=yes] file:/path/to/repo ./
```

## dnf/yum (RHEL/Fedora/CentOS)

### Basic Operations
```bash
dnf update                    # Update all
dnf upgrade                   # Same as update
dnf install package           # Install
dnf remove package            # Remove
dnf autoremove                # Remove unused deps
dnf clean all                 # Clean cache
```

### Search & Info
```bash
dnf search keyword
dnf info package
dnf list installed
dnf list updates
dnf repoquery --requires package
dnf repoquery --whatrequires package
dnf provides /path/to/file    # Find package owning file
```

### Modules (AppStream)
```bash
dnf module list
dnf module install nodejs:18
dnf module switch-to nodejs:20
dnf module reset nodejs
```

### Repositories
```bash
dnf config-manager --add-repo https://repo.example.com/repo.repo
dnf config-manager --set-enabled repo-name
dnf config-manager --set-disabled repo-name
```

## pacman (Arch Linux)

### Basic Operations
```bash
pacman -Syu                   # Update system
pacman -S package             # Install
pacman -R package             # Remove
pacman -Rs package            # Remove + unused deps
pacman -Rns package           # Remove + deps + config
pacman -Sc                    # Clean cache (keep 3 versions)
pacman -Scc                   # Clean all cache
```

### Search & Info
```bash
pacman -Ss keyword            # Search
pacman -Si package            # Info (remote)
pacman -Qi package            # Info (local)
pacman -Ql package            # List files
pacman -Qo /path/to/file      # Owns file
pacman -Q                     # List installed
pacman -Qe                    # Explicitly installed
pacman -Qd                    # Dependencies
```

### AUR Helpers
```bash
yay -S package                # Install from AUR
yay -Syu                      # Update system + AUR
paru -S package               # Alternative AUR helper
```

## zypper (openSUSE)

```bash
zypper refresh                # Update repos
zypper update                 # Update packages
zypper install package
zypper remove package
zypper search keyword
zypper info package
zypper packages --orphaned    # Unused packages
zypper packages --unneeded    # Not required by others
```

## nix (NixOS / Nix Package Manager)

### Basic Operations
```bash
nix-env -iA nixpkgs.package   # Install
nix-env -e package            # Uninstall
nix-env -u                    # Upgrade all
nix-env -q                    # List installed
nix-env -qa package           # Search available
```

### Nix Flakes (Modern)
```bash
nix profile install nixpkgs#package
nix profile list
nix profile remove 1
nix profile upgrade

# Run without installing
nix run nixpkgs#package
nix shell nixpkgs#package     # Enter shell with package
```

### NixOS Configuration
```nix
# /etc/nixos/configuration.nix
{ config, pkgs, ... }:
{
  environment.systemPackages = with pkgs; [
    vim git htop firefox
  ];
  
  services.nginx.enable = true;
  services.postgresql.enable = true;
  
  users.users.me = {
    isNormalUser = true;
    extraGroups = [ "wheel" "docker" ];
    packages = with pkgs; [ vscode ];
  };
}
```

```bash
sudo nixos-rebuild switch     # Apply config
sudo nixos-rebuild test       # Test without boot entry
sudo nixos-rebuild build-vm   # Build VM for testing
nixos-rebuild list-generations
sudo nixos-rebuild switch --upgrade  # Upgrade + rebuild
```

## Flatpak / Snap

### Flatpak
```bash
flatpak install flathub org.gimp.GIMP
flatpak run org.gimp.GIMP
flatpak update
flatpak uninstall org.gimp.GIMP
flatpak list
flatpak search gimp
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
```

### Snap
```bash
snap install package
snap refresh                  # Update all
snap remove package
snap list
snap info package
snap changes                  # Recent operations
```

## Container Package Managers

### Docker
```bash
docker pull image:tag
docker run --rm image:tag command
docker build -t myimage .
docker images
docker rmi image
docker system prune           # Clean unused
```

### Podman (Rootless)
```bash
podman pull image:tag
podman run --rm image:tag command
podman images
podman rmi image
podman system prune
```

## Version Comparison

| Feature | apt | dnf | pacman | zypper | nix |
|---------|-----|-----|--------|--------|-----|
| Atomic upgrades | No | No | No | Yes (transactional) | Yes |
| Rollback | Manual | `dnf history undo` | `pacman -U /var/cache/pacman/pkg/old.pkg` | `snapper rollback` | Generations |
| Multiple versions | No | Limited (modules) | No | No | Yes |
| Reproducible | No | No | No | Partial | Yes |
| Config management | Manual | Manual | Manual | YaST | Declarative |

## Troubleshooting

### apt Lock Errors
```bash
# "Could not get lock /var/lib/dpkg/lock-frontend"
lsof /var/lib/dpkg/lock-frontend
# Kill process, then:
rm /var/lib/dpkg/lock-frontend
rm /var/lib/apt/lists/lock
dpkg --configure -a
```

### dnf "Error: Failed to synchronize cache"
```bash
dnf clean all
rm -rf /var/cache/dnf
dnf makecache
```

### pacman Key Issues
```bash
pacman-key --init
pacman-key --populate archlinux
pacman-key --refresh-keys
```

### Nix "error: corrupted path"
```bash
nix-store --verify --check-contents --repair
nix-collect-garbage -d
```

## Cross-Distro Package Search

```bash
# pkcon (PackageKit) - works on most distros
pkcon search name package
pkcon install package

# distrobox - run other distro's package manager
distrobox create -n ubuntu -i ubuntu:22.04
distrobox enter ubuntu
apt install package
```