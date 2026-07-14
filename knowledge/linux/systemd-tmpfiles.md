# systemd-tmpfiles - Temporary Files Management

## Overview
- `systemd-tmpfiles` — create, remove, clean temporary files
- `systemd-tmpfiles-setup-dev.service` — early boot setup
- `systemd-tmpfiles-setup.service` — runtime setup
- `systemd-tmpfiles-clean.timer` — periodic cleanup
- `/usr/lib/tmpfiles.d/` — vendor configs
- `/etc/tmpfiles.d/` — admin overrides
- `~/.config/tmpfiles.d/` — user configs

## Configuration Files

### File Format
```
# Type, Path, Mode, UID, GID, Age, Argument
d /run/myapp 0755 myuser mygroup - -
f /run/myapp/pid 0644 myuser mygroup - PID
L /tmp/myapp - - - - /run/myapp
```

### Location Priority
- `/etc/tmpfiles.d/*.conf` — highest priority (admin)
- `/run/tmpfiles.d/*.conf` — runtime (temporary)
- `/usr/lib/tmpfiles.d/*.conf` — vendor defaults

### File Types
| Type | Description |
|------|-------------|
| f | Create file |
| d | Create directory |
| L | Symlink |
| D | Directory with subdirs |
| c | Character device |
| b | Block device |
| p | FIFO/pipe |
| s | Socket |

## File Age Actions

### Age Actions
| Action | Description |
|--------|-------------|
| - | No removal |
| q | Skip age check |
| Q | Ignore age, remove anyway |
| remove | Remove immediately |
| clean | Remove but preserve metadata |

### Age Format
- `1s` — 1 second
- `1min` — 1 minute
- `1h` — 1 hour
- `1d` — 1 day
- `1w` — 1 week
- `1month` — 1 month
- `1year` — 1 year

### Age Examples
```
# Remove files older than 1 day
d /tmp/cache 0755 - - 1d -

# Remove but keep directory
d /var/cache/myapp 0755 - - clean -

# Keep forever
d /var/lib/mysql 0700 - - - -
```

## Configuration Examples

### Runtime Directory
```
# /etc/tmpfiles.d/myapp.conf
d /run/myapp 0755 myuser mygroup - -
f /run/myapp/pid 0644 myuser mygroup - -
```

### Cache Directory
```
# /etc/tmpfiles.d/cache.conf
d /var/cache/apt 0755 root root 30d -
d /var/cache/pacman 0755 root root 7d -
```

### Log Directory
```
# /etc/tmpfiles.d/logs.conf
d /var/log/nginx 0750 www-data adm - -
d /var/log/mysql 0750 mysql adm - -
```

### Socket/FIFO
```
d /run/app 0755 app app - -
s /run/app/socket 0777 - - - -
p /run/app/pipe 0666 - - - -
```

### Permissions Fix
```
# /etc/tmpfiles.d/permissions.conf
z /var/log/nginx/* 0640 www-data adm - -
z /etc/ssl/private/* 0600 root root - -
```

## Commands

### Basic Operations
- `systemd-tmpfiles --create` — create missing files
- `systemd-tmpfiles --clean` — clean old files
- `systemd-tmpfiles --remove` — remove all managed files
- `systemd-tmpfiles --user --create` — user scope
- `systemd-tmpfiles --boot --create` — boot scope

### Check Configuration
- `systemd-tmpfiles --dry-run --create` — preview changes
- `systemd-tmpfiles --root=/mnt --create` — for alternate root
- `systemd-tmpfiles --prefix /run` — only /run operations

### Verbose Output
- `systemd-tmpfiles --verbose --create /etc/tmpfiles.d/*.conf`
- `systemd-tmpfiles --create --log-level=debug`

## systemd Integration

### Service Setup
```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Application
RuntimeDirectory=myapp
RuntimeDirectoryMode=0755

[Service]
ExecStart=/usr/bin/myapp
User=myuser

[Install]
WantedBy=multi-user.target
```

### Timer Setup
```ini
# /etc/systemd/system/myapp-clean.timer
[Unit]
Description=Clean MyApp Temp Files

[Timer]
OnCalendar=daily
AccuracySec=1h
Persistent=true

[Install]
WantedBy=timers.target
```

### User Services
```
# ~/.config/tmpfiles.d/myapp.conf
d /run/user/%U/myapp 0700 - - - -
```

## tmpfiles.d Directives

### Full Syntax
```
# Type Path Mode UID GID Age Argument
f /run/app/config 0644 app app - -
d /var/lib/app 0755 - - - -
L /etc/app.conf - - - - /usr/share/app/config
c /dev/app 0660 app app - - 10:20
b /dev/app 0660 app app - - 5:0
s /run/app/socket 0666 - - - -
```

### Directory Options
- `z` — set SELinux context
- `Z` — set SELinux context recursively
- `t` — set sticky bit
- `T` — set sticky bit recursively
- `r` — remove file/directory
- `R` — remove directory recursively

### Ownership
```
# Set ownership (not create)
z /var/log/app/* 0640 app app - -
Z /var/www/app/* 0644 - - - -

# Remove by pattern
r /tmp/*.tmp
R /var/cache/old/*
```

## Troubleshooting

### Debug Operations
```bash
# See what would happen
systemd-tmpfiles --dry-run --create --verbose

# Check for errors
systemd-tmpfiles --create --log-level=debug 2>&1

# Check specific file
systemd-tmpfiles --create /etc/tmpfiles.d/myapp.conf
```

### Check Status
```bash
# Was tmpfiles run?
systemctl status systemd-tmpfiles-setup.service

# Check cleanup timer
systemctl status systemd-tmpfiles-clean.timer

# When is next cleanup?
systemctl list-timers | grep tmpfiles
```

### Force Cleanup
```bash
# Immediate cleanup
systemd-tmpfiles --clean

# Remove and recreate
systemd-tmpfiles --remove
systemd-tmpfiles --create
```

### Permission Issues
```bash
# Check if running as correct user
systemd-tmpfiles --user --create  # user scope

# Check SELinux context
z /path/to/apply 0755 - - - -

# Check apparmor
# May need profile adjustment in /etc/apparmor.d/
```

## Common Patterns

### Web Server
```
# /etc/tmpfiles.d/nginx.conf
d /run/nginx 0755 www-data www-data - -
d /var/log/nginx 0750 www-data adm - -
```

### Database
```
# /etc/tmpfiles.d/mysql.conf
d /run/mysqld 0755 mysql mysql - -
d /var/lib/mysql 0750 mysql mysql - -
d /var/log/mysql 0750 mysql adm - -
```

### User Runtime
```
# ~/.config/tmpfiles.d/sessions.conf
d /run/user/%U 0700 - - - -
f /run/user/%U/session 0600 - - - -
```

### Development
```
# /etc/tmpfiles.d/dev.conf
d /tmp/build 1777 - - 7d -
d /var/cache/ccache 0755 - - 30d -
```

## Integration with Packages

### Package Integration
```bash
# Debian postinst
systemd-tmpfiles --create /usr/lib/tmpfiles.d/myapp.conf

# RPM %post
systemd-tmpfiles --create
```

### Verify Files
```bash
# Check if tmpfiles created directories
ls -la /run/myapp/

# Check permissions
stat /run/myapp/socket

# Compare to config
systemd-tmpfiles --dry-run --create
```

## Advanced Usage

### Variables
- `%m` — machine ID
- `%b` — boot ID
- `%h` — home directory
- `%t` — runtime directory
- `%T` — runtime directory (absolute)
- `%v` — kernel version
- `%U` — user ID
- `%G` — group ID
- `%u` — user name
- `%g` — group name

### Example with Variables
```
# /etc/tmpfiles.d/var.conf
d /run/app-%m 0755 app app - -
d /var/cache/app/%u 0755 - - - -
```

### Chroot Operations
```bash
# Apply to different root
systemd-tmpfiles --root=/ chroot/dir --create

# For container builds
systemd-tmpfiles --root=/var/lib/container --create
```

### Cleanup Strategies
```
# Aggressive cleanup
D /tmp 1777 - - 1d -

# Conservative (preserve structure)
d /tmp 1777 - - clean -
```

## Migration from tmpwatch/tmpreaper

### Old Way (tmpwatch)
```bash
# cron job
tmpwatch --mtime --nodirs 30d /tmp
```

### New Way (tmpfiles)
```
# /etc/tmpfiles.d/tmp.conf
d /tmp 1777 - - clean -
```

### Comparison
| Feature | tmpwatch | tmpfiles |
|---------|----------|----------|
| Pattern matching | glob | exact path |
| Age support | mtime/atime | age field |
| systemd integration | no | native |
| SELinux labeling | no | yes |
| Runtime dir management | no | yes |