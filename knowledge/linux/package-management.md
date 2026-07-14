# Linux Package Management

Use the `sys` wrapper for all package operations — it auto-detects apt/dnf/pacman/zypper and runs the right native command on every distro. Run it via `sys pkg ...` (sudo is added automatically when needed).

## Everyday operations (all distros)
```bash
sys pkg update                 # refresh package lists
sys pkg upgrade                # upgrade all packages
sys pkg install curl git       # install one or more packages
sys pkg remove vim             # remove (keeps config on apt)
sys pkg purge vim              # remove + config (apt) / +deps (pacman)
sys pkg search nginx           # search by name/description
sys pkg info nginx             # version, deps, description
sys pkg list-installed         # all installed packages
sys pkg owns /usr/bin/ls       # which package owns a file
sys pkg files nginx            # files owned by a package
sys pkg clean                  # clear the package cache
sys pkg check                  # list pending updates (does NOT install)
```

**Checking for updates:** when the user asks "any updates?" / "available updates" /
"what can I upgrade", run `sys pkg check` and report the pending count. It refreshes
package lists and lists upgradable packages for the detected distro. Do NOT web-search
for this — it is a question about THEIR system.

Raw equivalents (only when you need distro specifics):
- Debian/Ubuntu: `sudo apt-get update`, `sudo apt-get install -y pkg`, `sudo apt-get purge pkg`, `apt-cache search`, `dpkg -L pkg`, `dpkg -S /path`.
- Arch: `sudo pacman -Syu`, `sudo pacman -S pkg`, `sudo pacman -Rns pkg`, `pacman -Ss`, `pacman -Ql`, `pacman -Qo /path`.
- Fedora/RHEL: `sudo dnf upgrade`, `sudo dnf install pkg`, `dnf info`, `rpm -qf /path`.

## Distro-specific edge cases (use native)
- **Local .deb**: `sudo apt-get install -f ./pkg.deb` (Debian) or `sudo pacman -U pkg.tar.zst` (Arch).
- **Fix broken deps**: `sudo apt-get install -f` / `sudo dpkg --configure -a` (Debian).
- **Holds (Debian)**: `sudo apt-mark hold pkg` / `apt-mark showhold`.
- **AUR (Arch)**: `yay -S pkg` / `paru -S pkg`; init keys with `sudo pacman-key --populate archlinux`.
- **Repos (Debian)**: `sudo add-apt-repository ppa:user/name`.
- **Orphans (Arch)**: `pacman -Qtdq` then `sudo pacman -Rns -`.

## Containers & sandboxed apps (not wrapped)
```bash
flatpak install flathub org.gimp.GIMP   # flatpak update / flatpak list
snap install pkg / snap list
docker pull img:tag / podman pull img:tag
```
See `distros.md` for the full apt↔dnf↔pacman mapping.
