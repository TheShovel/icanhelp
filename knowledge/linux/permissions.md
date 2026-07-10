# Linux Permissions & Users

## File Permissions
Mode format: `-rwxr-xr--`
- 1st char: `-` file, `d` directory, `l` symlink, `c` char device, `b` block device
- chars 2-4: owner (u) permissions
- chars 5-7: group (g) permissions
- chars 8-10: others (o) permissions

Permission values:
- `r` (4): read — view content, list directory
- `w` (2): write — modify, create/delete files in dir
- `x` (1): execute — run file, enter directory
- `-` (0): no permission

Common modes:
- `755` — rwxr-xr-x: default for executables/directories
- `644` — rw-r--r--: default for files
- `600` — rw-------: private files
- `700` — rwx------: private executables/directories
- `777` — rwxrwxrwx: wide open (avoid)
- `400` — r--------: read-only for owner

## Changing Permissions
```
chmod 755 script.sh            — set mode numerically
chmod u+x script.sh            — add execute for user
chmod g-w file                 — remove write for group
chmod o+r file                 — add read for others
chmod a+x file                 — add execute for all
chmod -R 755 dir/              — recursive
chmod u=rw,g=r,o=r file        — symbolic mode
chmod +t /tmp                  — sticky bit (only owner can delete)
chmod g+s dir/                 — setgid (files inherit group)
chmod u+s file                 — setuid (run as file owner)
```

## Ownership
```
chown user file                — change owner
chown user:group file          — change owner and group
chown :group file              — change group only
chown -R user:group dir/       — recursive
chgrp group file               — change group
chgrp -R group dir/            — recursive group change
```

## Special Permissions (setuid/setgid/sticky)
- **Setuid (4000)**: `chmod u+s file` — runs with owner's privileges (e.g., `/usr/bin/passwd` has setuid root)
- **Setgid (2000)**: `chmod g+s dir` — new files inherit directory's group
- **Sticky (1000)**: `chmod +t dir` — only file owners can delete (e.g., `/tmp`)

Find them:
```
find / -perm -4000        — find setuid files
find / -perm -2000        — find setgid files
find / -perm -1000        — find sticky bit dirs
```

## umask
```
umask                      — show current mask (e.g., 022)
umask 077                  — set mask (restrictive)
```
umask subtracts from default (666 for files, 777 for dirs):
- `022` → files 644, dirs 755 (common)
- `077` → files 600, dirs 700 (private)
- `002` → files 664, dirs 775 (group-writable)

## ACL (Access Control Lists)
```
getfacl file                — view ACL
setfacl -m u:user:rwx file — add user permission
setfacl -m g:group:rx file — add group permission
setfacl -x u:user file     — remove user ACL
setfacl -b file            — remove all ACLs
setfacl -R -m u:user:rx dir/ — recursive
setfacl -d -m g:group:rwx dir/ — default ACL for new files
```

## Users & Groups
```
useradd -m -G wheel,audio bob   — create user with groups
usermod -aG docker bob          — add user to group
userdel -r bob                  — delete user + home
passwd bob                      — change password
passwd -l bob                   — lock account
passwd -u bob                   — unlock account
groupadd developers             — create group
groupmod -n newname oldname     — rename group
groupdel developers             — delete group
gpasswd -a bob developers       — add user to group
gpasswd -d bob developers       — remove from group
id bob                          — show UID/GID/groups
who                             — who is logged in
w                               — detailed who
last                            — login history
lastlog                         — all users last login
users                           — list logged-in users
groups                          — show group memberships
```

## Authentication Files
- `/etc/passwd` — user accounts (world-readable)
  Format: `username:password:x:UID:GID:gecos:home:shell`
- `/etc/shadow` — encrypted passwords (root-readable)
  Format: `username:hash:lastchange:minage:maxage:warn:inactive:expire:reserved`
- `/etc/group` — group definitions
- `/etc/gshadow` — group passwords
- `/etc/sudoers` — sudo privileges
- `/etc/login.defs` — password policy defaults

## Sudo
```
sudo -l                       — list allowed commands
sudo -u user cmd              — run as specific user
sudo -i                       — login shell as root
sudo -s                       — shell as root
sudo -E cmd                   — preserve environment
sudo -e file                  — edit file as root
visudo                        — safe sudoers editor
```
sudoers allow syntax:
```
user ALL=(ALL:ALL) ALL             — full access
user ALL=(ALL:ALL) NOPASSWD: ALL   — no password
%wheel ALL=(ALL:ALL) ALL           — group
user hostname=(root) /usr/bin/apt  — limited
```

## PAM (Pluggable Authentication Modules)
Config files: `/etc/pam.d/`
Common modules:
- `pam_unix.so` — traditional password auth
- `pam_sss.so` — SSSD auth (LDAP, AD)
- `pam_faillock.so` — account lockout on failures
- `pam_limits.so` — resource limits
- `pam_google_authenticator.so` — TOTP 2FA

## AppArmor / SELinux
- **AppArmor** (Debian/Ubuntu/SUSE):
  - Profiles in `/etc/apparmor.d/`
  - `aa-status` — list profiles
  - `aa-enforce /path/to/bin` — enforce profile
  - `aa-complain /path/to/bin` — log violations only
- **SELinux** (Fedora/RHEL/CentOS):
  - `getenforce` — check mode
  - `setenforce 0` — permissive (temporary)
  - `setenforce 1` — enforcing
  - `semanage fcontext -l` — list file contexts
  - `restorecon -Rv /path` — restore contexts
  - `audit2allow -a` — generate policy from logs
