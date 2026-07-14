# Users & Groups Management

Use `sys user` / `sys group` for the common operations — they wrap `useradd`/`usermod`/`groupadd` on every distro. Run via `sys user ...` / `sys group ...` (sudo added automatically).

## Users — `sys user` (all distros)
```bash
sys user add -m -s /bin/bash username   # create with home + shell
sys user del -r username                # delete + home
sys user mod -l newname oldname         # rename
sys user info username                  # id + group info
sys user list                           # all users (getent passwd)
```
Raw equivalents: `sudo useradd -m -s /bin/bash`, `sudo userdel -r`, `sudo usermod`, `id`, `getent passwd`.

### Passwords & aging (native)
```bash
passwd username
passwd -l username                   # lock
passwd -u username                   # unlock
passwd -e username                   # expire (force change)
chage -M 90 username                 # max age 90 days
chage -l username                    # show aging
```

### Sessions & environment (native)
```bash
who / w                              # logged-in users + processes
last                                  # login history
lastlog                               # last login per user
chsh -s /bin/zsh username            # change shell
```
Login scripts: `/etc/profile`, `/etc/bash.bashrc`, `~/.bashrc`, `/etc/profile.d/*.sh`. Skeleton: `/etc/skel/`.

## Groups — `sys group` (all distros)
```bash
sys group add groupname
sys group del groupname
sys group mod -n newname oldname
sys group list                        # all groups (getent group)
```
Raw equivalents: `sudo groupadd`, `sudo groupdel`, `sudo groupmod`, `getent group`.

Add/remove a user from a supplementary group (native `usermod`):
```bash
sudo usermod -aG groupname username   # add to supplementary group
sudo usermod -g groupname username    # change primary group
gpasswd -d username groupname         # remove
groups username
```
Files: `/etc/passwd`, `/etc/shadow` (root), `/etc/group`, `/etc/gshadow`, `/etc/login.defs`.

## sudo
```bash
sudo -l                             # list privileges
sudo -u username cmd                # run as user
visudo                              # safe sudoers edit
```
```ssh
username ALL=(ALL:ALL) ALL                  # full
username ALL=(ALL) NOPASSWD: ALL            # no password
%admin ALL=(ALL) ALL                        # group
username ALL=(root) /usr/bin/systemctl restart nginx   # specific cmd
```

## Limits & Quotas (native)
```bash
ulimit -a                           # show shell limits
ulimit -n 65536                     # max open files
```
```bash
# /etc/security/limits.conf
username soft nofile 65536
@groupname soft nproc 4096
```
```bash
quotacheck -cum /mnt               # create quota files
edquota username
setquota username 100M 120M 1000 1200 /mnt
```

## PAM
Config in `/etc/pam.d/`. Common modules: `pam_unix.so` (passwords), `pam_limits.so` (limits), `pam_faillock.so` (lockout), `pam_google_authenticator.so` (TOTP 2FA).
```bash
# /etc/security/access.conf
- : john : ALL                     # deny john everywhere
+ : @admin : ALL                   # allow admin group
```

## Failed login tracking (native)
```bash
faillog -a                         # all failed logins
faillog -r -u user                 # reset
```

## Sessions (loginctl — see systemd-logind.md)
```bash
loginctl list-sessions
loginctl terminate-session <id>
```
