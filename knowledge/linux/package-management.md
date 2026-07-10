# Linux Package Management

## APT (Debian, Ubuntu, Mint, Pop!_OS)
```
apt update              — refresh package index
apt upgrade             — upgrade all packages
apt full-upgrade        — upgrade with dependency resolution
apt install <pkg>       — install package
apt remove <pkg>        — remove package (leave config)
apt purge <pkg>         — remove package and config
apt autoremove          — remove unused dependencies
apt search <term>       — search packages
apt show <pkg>          — show package details
apt list --installed    — list installed packages
apt list --upgradable   — list upgradable packages
apt policy <pkg>        — show version/apt pin info
apt edit-sources        — edit sources.list
apt-mark hold <pkg>     — prevent upgrade
apt-mark unhold <pkg>   — allow upgrade
dpkg -i <file.deb>      — install local .deb
dpkg -r <pkg>           — remove package
dpkg -l                 — list installed packages
dpkg -L <pkg>           — list files owned by package
dpkg -S /path/to/file   — find which package owns file
dpkg --configure -a     — fix broken installs
apt-get -f install      — fix broken dependencies
```

## DNF (Fedora, RHEL 8+, CentOS Stream)
```
dnf install <pkg>       — install package
dnf remove <pkg>        — remove package
dnf update              — upgrade all packages
dnf upgrade <pkg>       — upgrade specific package
dnf search <term>       — search packages
dnf info <pkg>          — show package details
dnf list installed      — list installed packages
dnf provides /path      — find which package owns file
dnf group list          — list package groups
dnf group install "gnome" — install group
dnf autoremove          — remove unused dependencies
dnf clean all           — clean cache
dnf repolist            — list enabled repos
dnf history             — show transaction history
dnf history undo <n>    — revert transaction
dnf downgrade <pkg>     — downgrade to older version
dnf reinstall <pkg>     — reinstall package
rpm -ivh <file.rpm>     — install local RPM
rpm -e <pkg>            — erase package
rpm -qa                 — query all packages
rpm -ql <pkg>           — list files in package
rpm -qf /path/to/file   — find owning package
```

## Pacman (Arch Linux, Manjaro, EndeavourOS)
```
pacman -Syu             — full system upgrade
pacman -S <pkg>         — install package
pacman -R <pkg>         — remove package
pacman -Rs <pkg>        — remove + dependencies
pacman -Rn <pkg>        — remove + config
pacman -Ss <term>       — search packages
pacman -Si <pkg>        — show package info
pacman -Q               — list installed packages
pacman -Qe              — list explicitly installed
pacman -Qo /path        — find owning package
pacman -Qi <pkg>        — show local package info
pacman -Qdt             — orphaned packages
pacman -Rns $(pacman -Qdtq) — remove orphans
pacman -Sw <pkg>        — download only
pacman -U <file.pkg.tar.zst> — install local package
pacman -Sc              — clean package cache
pacman -Scc             — clean all cached packages
```

## AUR Helpers (yay, paru)
```
yay -S <pkg>            — install from AUR or repos
yay -Syu                — full system upgrade + AUR
yay -Ss <term>          — search AUR and repos
yay -Qi <pkg>           — show AUR package info
yay -Yc                 — clean orphaned AUR deps
paru -S <pkg>           — install (Rust-based, fast)
paru -G <pkg>           — download PKGBUILD only
```

## Zypper (openSUSE)
```
zypper install <pkg>    — install package
zypper remove <pkg>     — remove package
zypper update           — upgrade packages
zypper dup              — distribution upgrade
zypper search <term>    — search packages
zypper info <pkg>       — show package info
zypper lp               — list needed patches
zypper pt               — list patch categories
```

## Snap (Cross-distro, Canonical)
```
snap install <pkg>      — install snap
snap remove <pkg>       — remove snap
snap refresh             — update all snaps
snap list               — list installed snaps
snap find <term>        — search snaps
snap info <pkg>         — show snap details
snap revert <pkg>       — revert to previous version
snap changes            — show recent changes
```

## Flatpak (Cross-distro, Red Hat)
```
flatpak install <remote> <pkg>  — install
flatpak remove <pkg>            — remove
flatpak update                  — update all
flatpak list                    — list installed
flatpak search <term>           — search
flatpak info <pkg>              — show details
flatpak run <pkg>               — run application
flatpak override <pkg> --user   — user overrides
flatpak remote-add --if-not-exists flathub \
  https://dl.flathub.org/repo/flathub.flatpakrepo
```

## AppImage
- `.AppImage` files are portable, self-contained executables
- `chmod +x app.AppImage && ./app.AppImage` to run
- Extract: `./app.AppImage --appimage-extract`
- Integration: `./app.AppImage --appimage-extract-and-run`
- Tools: `appimaged` for desktop integration

## Build from Source
```
./configure (--prefix=/usr)
make
sudo make install
```
Or CMake:
```
mkdir build && cd build
cmake .. -DCMAKE_INSTALL_PREFIX=/usr
make -j$(nproc)
sudo make install
```

## Cleaning Disk Space
- Debian: `apt autoremove && apt autoclean`
- Arch: `pacman -Sc && pacman -Rns $(pacman -Qdtq)`
- Fedora: `dnf autoremove`
- Snap: `snap list --all | grep disabled | awk '{print $1}' | xargs -r snap remove`
- Flatpak: `flatpak uninstall --unused`
- Logs: `journalctl --vacuum-size=100M`
- Docker: `docker system prune -a`
- npm: `npm cache clean --force`
