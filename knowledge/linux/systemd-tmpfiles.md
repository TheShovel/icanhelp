# systemd-tmpfiles (Temporary Files)

`systemd-tmpfiles` creates, cleans, and removes files/dirs at boot and on a timer. Config dirs (priority high→low): `/etc/tmpfiles.d/`, `/run/tmpfiles.d/`, `/usr/lib/tmpfiles.d/`. Run by `systemd-tmpfiles-setup.service` and the `systemd-tmpfiles-clean.timer`.

## Line format
`Type Path Mode UID GID Age Argument`
```
d /run/myapp 0755 myuser mygroup - -
f /run/myapp/pid 0644 myuser mygroup - PID
L /tmp/myapp - - - - /run/myapp
z /var/log/nginx/* 0640 www-data adm - -
```

## Types
| Type | Meaning |
|------|----------|
| f | create file |
| d | create directory |
| D | directory + subdirs |
| L | symlink |
| c / b | char / block device |
| p | FIFO |
| s | socket |
| z / Z | set perms/SELinux ctx (file / recursive) |
| r / R | remove (file / recursive) |
| t / T | set sticky bit (file / recursive) |

## Age & cleanup
- Age: `1s`, `1min`, `1h`, `1d`, `1w`, `1month`, `1year`, or `-` (never).
- `d /tmp/cache 0755 - - 1d -` — remove entries older than 1 day.
- `d /var/cache/myapp 0755 - - clean -` — clean but keep the directory.

## Commands
```
systemd-tmpfiles --create            # create missing files/dirs
systemd-tmpfiles --clean             # age out old entries
systemd-tmpfiles --remove           # remove managed files
systemd-tmpfiles --user --create    # user scope (~/.config/tmpfiles.d/)
systemd-tmpfiles --dry-run --create --cat-config  # preview what runs
```

## Variables
`%m` machine-id, `%b` boot-id, `%h` home, `%t`/`%T` runtime dir, `%v` kernel, `%U`/`%u` user-id/name, `%G`/`%g` group-id/name.
```
d /run/app-%m 0755 app app - -
```

## Examples
```
# /etc/tmpfiles.d/nginx.conf
d /run/nginx 0755 www-data www-data - -
d /var/log/nginx 0750 www-data adm - -

# user runtime
# ~/.config/tmpfiles.d/sessions.conf
d /run/user/%U/myapp 0700 - - - -
```

## In a service
```ini
[Service]
RuntimeDirectory=myapp
RuntimeDirectoryMode=0755
# equivalent to a tmpfiles.d line, created/cleaned with the unit
```

## Troubleshooting
```
systemd-tmpfiles --dry-run --create --cat-config   # what would happen
sys svc status systemd-tmpfiles-setup.service
systemctl status systemd-tmpfiles-clean.timer
systemctl list-timers | grep tmpfiles
```
