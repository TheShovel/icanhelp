# systemd User Services

## User vs System Services

### System Services
- `systemctl start nginx` — system-wide service
- `systemctl enable nginx` — start at boot
- `systemctl status nginx` — check status
- Config in `/etc/systemd/system/` or `/usr/lib/systemd/system/`

### User Services
- `systemctl --user start myapp` — user service
- `systemctl --user enable myapp` — start on user login
- `systemctl --user status myapp` — check status
- Config in `~/.config/systemd/user/`

## User Service Units

### Service Location
```
~/.config/systemd/user/
├── myapp.service
├── myapp.timer
└── default.target.wants/
```

### Unit File Structure
```ini
# ~/.config/systemd/user/myapp.service
[Unit]
Description=My Application
Documentation=https://example.com
After=network.target

[Service]
Type=simple
ExecStart=%h/.local/bin/myapp --config %h/.config/myapp/config.yaml
WorkingDirectory=%h
Restart=on-failure
RestartSec=5s
Environment=HOME=%h
Environment=PATH=%h/.local/bin:/usr/bin:/bin

# User-specific settings
NoNewPrivileges=yes
PrivateTmp=yes

[Install]
WantedBy=default.target
```

## User Service Commands

### Management
- `systemctl --user daemon-reload` — reload unit files
- `systemctl --user list-units` — running user units
- `systemctl --user list-unit-files` — all user units
- `systemctl --user enable --now myapp` — enable and start
- `systemctl --user edit myapp` — override configuration

### Status and Logs
- `systemctl --user status myapp` — service status
- `journalctl --user -u myapp` — user service logs
- `journalctl --user -f` — follow user logs
- `journalctl --user -u myapp -f` — follow specific service

### Timer Commands
- `systemctl --user list-timers` — user timers
- `systemctl --user start myapp.timer` — start timer
- `systemctl --user enable myapp.timer` — enable timer
- `systemctl --user status myapp.timer` — timer status

## Environment Variables

### User Environment
- `%h` — home directory
- `%u` — user name
- `%U` — user ID
- `%i` — instance name (for templates)

### Persistent Environment
```bash
# ~/.config/environment.d/*.conf
PATH="$HOME/.local/bin:$PATH"
EDITOR=vim
GOPATH=$HOME/go
```

Or in shell profile:
```bash
# ~/.profile or ~/.bash_profile
export PATH="$HOME/.local/bin:$PATH"
```

## User Lingering

### Enable Lingering
- `loginctl enable-linger username` — allow user services without login
- `loginctl disable-lingering username` — disable lingering
- `loginctl show-user username` — show user properties

### Check Lingering
```bash
loginctl show-user $USER | grep Linger
# Linger=yes if enabled

# Without login
ps aux | grep systemd --user
# systemd user instance runs if lingering
```

### System Admin Setup
```bash
# Enable for user
loginctl enable-linger alice

# Check
loginctl show-user alice

# Service runs even when user not logged in
systemctl --user enable --now syncthing
```

## Socket Activation

### User Socket
```ini
# ~/.config/systemd/user/mysocket.socket
[Unit]
Description=My Socket

[Socket]
ListenStream=%t/myapp.sock
Accept=no

[Install]
WantedBy=sockets.target
```

### Service for Socket
```ini
# ~/.config/systemd/user/mysocket@.service
[Unit]
Description=My Socket Service

[Service]
ExecStart=%h/.local/bin/myapp %t/myapp.sock
```

## Runtime Directory

### XDG Runtime
- `%t` — runtime directory (`${XDG_RUNTIME_DIR}`)
- Typically `/run/user/1000/`
- Automatically created on login
- Cleaned on logout

### Private Runtime
- `RuntimeDirectory=myapp` — creates `$RUNTIME_DIRECTORY/myapp`
- `RuntimeDirectoryMode=0755` — permissions
- `StateDirectory=myapp` — persistent state in `%S/myapp`
- `CacheDirectory=myapp` — cache in `%C/myapp`
- `LogsDirectory=myapp` — logs in `%L/myapp`

## User Timers

### Calendar Timers
```ini
# ~/.config/systemd/user/backup.timer
[Unit]
Description=Daily Backup

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

### OnCalendar Formats
- `daily` — every day at midnight
- `weekly` — every week on Monday
- `monthly` — first day of month
- `hourly` — every hour
- `*:0/15` — every 15 minutes
- `Mon..Fri 18:00` — weekdays at 6pm
- `2024-01-01..2024-12-31` — date range

### Timer Service
```ini
# ~/.config/systemd/user/backup.service
[Unit]
Description=Run Backup Script

[Service]
Type=oneshot
ExecStart=%h/bin/backup.sh
```

## Template Units

### User Timers
```ini
# ~/.config/systemd/user/task@.timer
[Unit]
Description=Task Timer

[Timer]
OnCalendar=*:0/30
Persistent=true

[Install]
WantedBy=timers.target
```

### Template Service
```ini
# ~/.config/systemd/user/task@.service
[Unit]
Description=Task Runner

[Service]
Type=oneshot
ExecStart=%h/bin/task.sh %i
```

### Usage
```bash
systemctl --user enable --now task@1.timer
systemctl --user enable --now task@2.timer
```

## D-Bus Integration

### User D-Bus Service
```ini
# ~/.config/systemd/user/org.example.MyApp.service
[Unit]
Description=My App D-Bus Service
BusName=org.example.MyApp

[Service]
Type=simple
ExecStart=%h/.local/bin/myapp-daemon
```

### D-Bus Activation
- Create `/usr/share/dbus-1/services/org.example.MyApp.service`
- Or for user-only: `~/.local/share/dbus-1/services/`

## Troubleshooting

### User Session Not Running
```bash
# Check if systemd user instance exists
ps aux | grep "systemd --user"

# If not, start manually
sudo loginctl enable-linger $USER
systemctl --user import-environment

# Check XDG_RUNTIME_DIR
echo $XDG_RUNTIME_DIR
# Should be /run/user/$(id -u)
```

### Environment Issues
```bash
# Check environment passed to service
systemctl --user show-environment

# Import shell environment
systemctl --user import-environment

# Or in unit file
[Service]
EnvironmentFile=%h/.config/systemd/user.env
```

### Lingering Problems
```bash
# Check lingering
loginctl show-user $USER

# Enable
loginctl enable-linger

# Check systemd user process
pgrep -u $USER systemd
```

### Debugging
```bash
# Verbose status
systemctl --user status myapp -l

# Journal with all fields
journalctl --user -u myapp -o json

# Export to file
journalctl --user -u myapp > ~/myapp.log
```

## Common Use Cases

### Background Sync
```ini
# ~/.config/systemd/user/syncthing.service
[Unit]
Description=Syncthing - Open Source Continuous File Synchronization
Documentation=https://github.com/syncthing/syncthing

[Service]
User=%i
ExecStart=/usr/bin/syncthing -no-browser -logflags=0
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
```

### Scheduled Tasks
```ini
# ~/.config/systemd/user/email-check.timer + .service
# Using systemd timer instead of cron
```

### Auto-start Applications
```ini
# ~/.config/systemd/user/discord.service
[Unit]
Description=Discord
After=network.target

[Service]
ExecStart=/usr/bin/discord
Restart=on-failure
Environment=DISPLAY=:0

[Install]
WantedBy=graphical-session.target
```

### Terminal Services
```bash
# tmux service
# mosh daemon
# ssh-agent
# gpg-agent
```

## Security Considerations

### Sandboxing
```ini
# User service with restrictions
[Service]
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=%h/.local/share/myapp
```

### User Isolation
- User services can't access system services directly
- Use D-Bus for communication
- File sharing via XDG directories
- Network access allowed by default