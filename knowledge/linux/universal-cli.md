# Universal Linux CLI (`sys`)

When administering the user's system, **prefer the `sys` wrapper over raw
distro-specific commands**. It auto-detects the distro (Ubuntu/Debian, Arch,
Fedora/RHEL, openSUSE) and translates to the correct native tool, so you only
learn ONE vocabulary that works everywhere. The scripts live in the app's
`bin/` directory (on PATH after install).

Always call it through `run_bash`, e.g. `sys pkg install curl`.

## Why use it
- One command set for all distros (no need to remember apt vs dnf vs pacman).
- SSH unit name, firewall tool, and initramfs command are handled for you.
- `sudo` is added automatically when not root.
- Destructive ops (remove/purge/reset) are explicit and safe by design.

## Package management (`sys pkg`)
```bash
sys pkg update                 # refresh package lists
sys pkg upgrade                # upgrade all packages
sys pkg install curl git       # install packages
sys pkg remove vim             # remove (keeps config on apt)
sys pkg purge vim              # remove + config (apt) / +deps (pacman)
sys pkg search nginx           # search by name/description
sys pkg info nginx             # show version, deps, description
sys pkg list-installed         # all installed packages
sys pkg owns /usr/bin/ls       # which package owns a file
sys pkg files nginx            # files owned by a package
sys pkg clean                  # clear package cache
sys pkg check                  # list pending updates (does NOT install)
```

## Services (`sys svc`, systemd on every supported distro)
```bash
sys svc status ssh             # status + recent logs (uses ssh or sshd automatically)
sys svc start nginx
sys svc stop nginx
sys svc restart nginx
sys svc enable nginx           # enable at boot
sys svc disable nginx
sys svc mask nginx             # prevent any activation
sys svc unmask nginx
```

## Firewall (`sys firewall` — UFW/firewalld/nftables)
```bash
sys firewall status            # show active rules
sys firewall allow 22/tcp      # open a port (proto defaults to tcp)
sys firewall allow 80          # tcp assumed
sys firewall deny 23/tcp       # block a port
sys firewall reset             # reset to defaults (use with care)
```

## Networking (`sys net` — inspection; config files stay native)
```bash
sys net apply                  # apply netplan (Debian) or restart systemd-networkd (Arch)
sys net interfaces             # ip -br addr show
sys net routes                 # ip route show
sys net dns                    # resolvectl status / /etc/resolv.conf
sys net listen                 # ss -tulnp (listening sockets)
sys net scan 22 80             # filter listeners for given ports
```

## Disk & filesystem (`sys disk` — read-only inspection)
```bash
sys disk list                  # lsblk -f
sys disk usage                 # df -h
sys disk fs /var               # du -sh <path>
sys disk mounts                # findmnt
```

## Users & groups (`sys user` / `sys group`)
```bash
sys user add -m alice          # create user with home dir
sys user del -r alice          # delete user + home
sys user mod -aG wheel alice   # add to group
sys user info alice            # id alice
sys user list                  # getent passwd
sys group add devs
sys group del devs
sys group mod -n developers devs
sys group list                 # getent group
```

## Time & date (`sys time` — timedatectl)
```bash
sys time status                # timedatectl status
sys time set "2026-07-14 13:00:00"   # set clock
sys time zone Europe/Berlin    # set timezone
sys time ntp on                # enable NTP sync
sys time ntp off
sys time zones                 # list available zones
```

## Logging (`sys log` — journalctl)
```bash
sys log show                   # full journal
sys log show nginx             # journal for a unit
sys log follow                 # follow live
sys log follow nginx
sys log errors                 # priority=err for current boot
sys log boot                   # current boot
sys log boot -1                # previous boot
sys log disk                   # journal disk usage
sys log vacuum 100M            # trim journal to a size
```

## Kernel modules & initramfs (`sys kern`)
```bash
sys kern lsmod                 # loaded modules
sys kern modinfo nvidia        # module info
sys kern modprobe nvidia       # load a module
sys kern rmmod nvidia          # unload a module
sys kern blacklist nouveau     # persistently block a module
sys kern initramfs             # rebuild initramfs (distro-aware)
```

## Security status (`sys secure` — SELinux / AppArmor)
```bash
sys secure status              # SELinux getenforce / AppArmor aa-status / none
sys secure audit               # recent AVC denials (ausearch)
```

## SSH keys (`sys ssh`)
```bash
sys ssh key ed25519            # generate ~/.ssh/id_ed25519 (default)
sys ssh key rsa "me@host"      # generate RSA 4096 with comment
sys ssh pub                    # print ed25519 public key
sys ssh pub rsa                # print rsa public key
```

## Swap & zram (`sys swap`)
```bash
sys swap status                # swapon --show + free -h
sys swap on /dev/sdx2          # enable a swap device
sys swap off /dev/sdx2         # disable a swap device
sys swap file /swapfile 8G     # create + enable an 8G swap file
```

## Performance snapshot (`sys perf` — universal tools)
```bash
sys perf top                   # top snapshot (busiest processes)
sys perf mem                   # free -h
sys perf load                  # load average + uptime
sys perf io                    # vmstat 1 2
sys perf cpu                   # lscpu model/CPU/MHz
```

## Inspect the environment
```bash
sys detect                     # prints family, pkg manager, firewall, ssh unit, etc.
sys help                       # full usage
```

## Fallback
If `sys` is unavailable or a task needs a tool `sys` doesn't cover, use the
native command directly. Universal tools NOT wrapped by `sys`:
`rsync`, `tar`, `find`, `grep`, `sed`, `awk`, `openssl`, `ip`, `ss`, `curl`,
`git`, `pactl`, `wpctl`, `bluetoothctl`, `xrandr`, `nmcli`, `virt-manager`,
`docker`, `podman`, `lpstat`, `lpadmin`. For distro-specific edge cases the
`distros.md` file has the full apt/dnf/pacman mapping.
