# Linux Users and Groups Management

## User Management

### Create/Delete Users
- `useradd -m -s /bin/bash username` — create user with home directory and shell
- `useradd -M username` — create user without home directory
- `useradd -r username` — create system user (no login, UID < 1000)
- `userdel -r username` — delete user and home directory
- `userdel -f username` — force delete (even if logged in)
- `usermod -l newname oldname` — rename user
- `usermod -d /home/newdir -m username` — change home directory

### Password Management
- `passwd username` — change user password
- `passwd -l username` — lock account
- `passwd -u username` — unlock account
- `passwd -e username` — expire password (force change on next login)
- `passwd -d username` — remove password (set empty)
- `chage -M 90 username` — set max password age to 90 days
- `chage -m 7 username` — set min password age to 7 days
- `chage -W 7 username` — warn 7 days before expiry
- `chage -E YYYY-MM-DD username` — set expiry date

### User Information
- `id username` — show UID, GID, and groups
- `whoami` — current username
- `who` — logged in users
- `w` — logged in users + processes
- `last` — last logged in users (from /var/log/wtmp)
- `lastlog` — last login per user
- `finger username` — detailed user info
- `getent passwd` — show all users from all sources (files, LDAP, etc.)
- `getent shadow` — show shadow entries (requires root)

## Group Management

### Group Commands
- `groupadd groupname` — create group
- `groupdel groupname` — delete group
- `groupmod -n newname oldname` — rename group
- `usermod -aG groupname username` — add user to supplementary group
- `usermod -g groupname username` — change primary group
- `gpasswd -d username groupname` — remove user from group
- `groups username` — show all groups for user

### Group Files
- `/etc/passwd` — user accounts (username:x:UID:GID:GECOS:home:shell)
- `/etc/shadow` — encrypted passwords (root only)
- `/etc/group` — groups (groupname:x:GID:members)
- `/etc/gshadow` — secure group info
- `/etc/login.defs` — login settings (UID ranges, password aging)

## sudo Configuration

### Basic sudo
- `sudo -l` — list user privileges
- `sudo -u username command` — run as specific user
- `sudo -i` — become root with root's environment
- `sudo -s` — become root with current shell
- `visudo` — edit sudoers safely (checks syntax)

### sudoers Syntax
```
username ALL=(ALL:ALL) ALL                    # Full sudo access
username ALL=(ALL) NOPASSWD: ALL              # Full sudo without password
username ALL=(root) /usr/bin/systemctl restart nginx  # Specific command only
%admin ALL=(ALL) ALL                         # Group sudo access
```

### /etc/sudoers Defaults
- `Defaults secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin"`
- `Defaults logfile=/var/log/sudo.log`
- `Defaults loglinelen=0` — disable line wrapping in logs
- `Defaults !requiretty` — allow sudo without TTY
- `Defaults !lecture` — disable lecture on first sudo use

## User Limits and Quotas

### ulimit (Shell Limits)
- `ulimit -a` — show all limits
- `ulimit -n 65536` — set max open files
- `ulimit -u 4096` — set max processes
- `ulimit -f 102400` — set max file size (blocks)
- `ulimit -v 524288` — set max virtual memory (KB)

### Persistent Limits
```
# /etc/security/limits.conf
username soft nofile 65536
username hard nofile 65536
@groupname soft nproc 4096
```

### systemd User Limits
```
# /etc/systemd/system.conf
DefaultLimitNOFILE=65536
DefaultLimitNPROC=4096
```

### Disk Quotas
- `quotacheck -cum /mnt` — create quota files
- `quotaon /mnt` — enable quotas
- `quotaoff /mnt` — disable quotas
- `edquota username` — edit quotas interactively
- `repquota -a` — report all quotas
- `setquota username 100M 120M 1000 1200 /mnt` — set quotas (block/soft block/hard inode/soft inode/hard)

## PAM (Pluggable Authentication Modules)

### PAM Configuration
- `/etc/pam.d/common-auth` — authentication
- `/etc/pam.d/common-account` — account management
- `/etc/pam.d/common-password` — password management
- `/etc/pam.d/common-session` — session management

### PAM Modules
- `pam_unix.so` — standard Unix authentication
- `pam_deny.so` — always deny
- `pam_permit.so` — always permit
- `pam_limits.so` — enforce limits.conf
- `pam_time.so` — time-based access control
- `pam_access.so` — access control by host/user
- `pam_listfile.so` — allow/deny based on file contents

### PAM Control Flags
- `required` — success required, continue on failure
- `requisite` — success required, fail immediately on failure
- `sufficient` — success skips remaining, failure ignored
- `optional` — doesn't affect success/failure directly

## User Sessions

### Session Management
- `loginctl list-sessions` — list all sessions
- `loginctl show-session $XDG_SESSION_ID` — show session details
- `loginctl terminate-session id` — kill session
- `loginctl kill-session id signal` — send signal to session

### Login Scripts
- `/etc/profile` — system-wide for login shells
- `/etc/bash.bashrc` — system-wide for interactive non-login shells
- `~/.bash_profile` — user's login shell script
- `~/.bashrc` — user's interactive non-login shell script
- `/etc/profile.d/*.sh` — scripts sourced by /etc/profile

### Profile Management
- `source /etc/profile` — reload system profile
- `echo $PATH` — check current PATH
- `echo $SHELL` — current shell
- `echo $HOME` — home directory
- `echo $USER` — current username

## Security Related to Users

### Account Lockout
```
# /etc/pam.d/sshd or /etc/pam.d/login
auth required pam_tally2.so deny=3 unlock_time=300 even_deny_root
```

### Two-Factor Authentication
- `auth required pam_google_authenticator.so` — add to /etc/pam.d/sudo
- Requires `libpam-google-authenticator` package
- Run `google-authenticator` per user to set up

### Login Restrictions
```
# /etc/security/access.conf
-:ALL EXCEPT root : LOCAL  # Deny remote except root
+ : @admin : ALL         # Allow admin group everywhere
- : john : ALL           # Deny john everywhere
```

### SSH Login Restrictions
```
# /etc/ssh/sshd_config
AllowUsers alice bob@192.168.1.*
DenyUsers root john
AllowGroups ssh-users
```

## User Environment

### Shell Customization
- `chsh -s /bin/zsh username` — change shell
- `chfn username` — change full name/GECOS field
- `chage -d 0 username` — force password change on next login

### Home Directory Templates
- `/etc/skel/` — files copied to new user home
- `useradd -m -k /custom/skel username` — use custom skeleton
- `mkdir -p /etc/skel/.config/myapp/` — add custom configs

### Cron Access
- `echo "username" >> /etc/cron.allow` — allow cron
- `echo "username" >> /etc/cron.deny` — deny cron
- `echo "username" >> /etc/at.allow` — allow at
- `crontab -e` — edit user crontab

## Audit Commands

### su/sudo Logging
- `/var/log/auth.log` (Debian) or `/var/log/secure` (RHEL) — authentication logs
- `journalctl _SYSTEMD_UNIT=sudo.service` — sudo logs
- `grep "sudo:" /var/log/auth.log` — filter sudo entries
- `aureport -u -i -x` — audit report for users and executables

### Failed Login Tracking
```bash
faillog -a        # Show all failed logins
faillog -u user   # Show for specific user
faillog -r -u user # Reset failed attempts
```

### Account Expiration Report
```bash
chage -l username | grep -E "(Account|Password)"
# Account expires : Never
# Password inactive: Never
# Account expires : Apr 01, 2025
```