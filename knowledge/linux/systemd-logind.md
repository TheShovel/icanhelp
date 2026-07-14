# systemd-logind - Session and Seat Management

## Overview
- `systemd-logind` — manages user sessions and seats
- `loginctl` — command-line interface
- Tracks login sessions, power management, device access
- Replaces consolekit/ConsoleKit

## loginctl Commands

### Sessions
- `loginctl list-sessions` — show all sessions
- `loginctl show-session $XDG_SESSION_ID` — show session details
- `loginctl show-session 2 --property=Active` — specific property
- `loginctl kill-session 2` — kill session
- `loginctl terminate-session 2` — terminate session
- `loginctl lock-session 2` — lock session

### Users
- `loginctl list-users` — show users with sessions
- `loginctl show-user $UID` — user properties
- `loginctl show-user 1000 --property=Linger` — linger status
- `loginctl enable-linger username` — allow background user services
- `loginctl disable-linger username` — disable background services

### Seats
- `loginctl list-seats` — show seats
- `loginctl show-seat seat0` — seat details
- `loginctl flush-devices` — flush device state

### Inhibitor Locks
- `loginctl list-inhibitors` — show inhibitor locks
- Who is blocking shutdown/suspend

## Session Properties

### Common Properties
```
Id=2
User=1000
Name=alice
Timestamp=...
TimestampMonotonic=...
VTNr=1
Seat=seat0
TTY=tty1
Remote=no
RemoteHost=
RemoteUser=
Service=login
Desktop=gnome
Scope=session-2.scope
Leader=1234
Audit=0
Type=tty
Class=user
Active=yes
State=active
# ... more properties
```

### Key Properties
- `Active` — session is active (foreground)
- `State` — active, closing, or offline
- `Desktop` — desktop environment (gnome, kde, etc.)
- `Remote` — remote or local session
- `TTY` — terminal (tty1, ttyS0, etc.)
- `VTNr` — virtual terminal number

## User Properties

### User Info
```
UID=1000
GID=1000
Name=alice
Timestamp=...
...
Sessions=2 3
Linger=yes
# ... more
```

### Lingering
- `Linger=yes` — user services run without login
- `Linger=no` — user services stop at logout
- Set with `loginctl enable-linger $USER`

## Seat Management

### What is a Seat?
- A seat represents a physical workstation
- Contains keyboards, mice, displays
- Multiple seats = multi-seat system

### Multi-Seat Setup
```
# /etc/systemd/logind.conf
[Login]
NAutoVTs=6
ReserveVT=6
```

### Seat Devices
- USB devices assigned to seats
- `loginctl seat-status seat0` — show devices
- `loginctl attach seat1 /dev/input/by-id/...` — assign device

## Configuration

### logind.conf Options
```
# /etc/systemd/logind.conf
[Login]
HandlePowerKey=poweroff
HandlePowerKey=ignore
HandleSuspendKey=suspend
HandleHibernateKey=hibernate
HandleLidSwitch=suspend
HandleLidSwitch=lock  # for laptops
HandleLidSwitchDocked=ignore
HandleRebootKey=reboot
HandleLidSwitchExternalPower=lock
```

### Inactivity Timeouts
```
[Login]
IdleAction=ignore
IdleAction=suspend
IdleAction=hibernate
IdleAction=hybrid-sleep
IdleAction=lock-session

IdleActionSec=15min  # default: 15min for suspend
```

### Sessions Limits
```
SessionsMax=32000  # max concurrent sessions
RemoveIPC=yes     # remove IPC on logout
RemoveIPC=no      # keep IPC (security risk)
UserTasksMax=inf   # tasks per user
```

## Power Management

### Handle Events
- Power key pressed → action
- Suspend key pressed → action
- Lid closed → action
- Reboot key pressed → action

### Configuration
```
HandlePowerKey=poweroff    # or suspend, hibernate, ignore, lock
HandleSuspendKey=suspend
HandleHibernateKey=hibernate
HandleRebootKey=reboot
HandleLidSwitch=suspend
```

### systemd Integration
- Creates inhibitor lock during boot
- Releases on shutdown
- Respects desktop environment locks

## Autovt Management

### Virtual Terminals
- `NAutoVTs=6` — auto-spawn VTs
- `VTAutoAssign=yes` — assign to sessions
- `ReserveVT=6` — reserve for getty

### agetty Integration
- `autovt@.service` spawned automatically
- `loginctl enable-linger` prevents auto-logout

## D-Bus API

### Interface
- `org.freedesktop.login1` — logind interface
- Methods: TerminateSession, KillSession, etc.
- Properties on `/org/freedesktop/login1`

### Example Calls
```bash
# List sessions via D-Bus
dbus-send --system --print-reply --dest=org.freedesktop.login1 \
  /org/freedesktop/login1 org.freedesktop.login1.Manager.ListSessions

# Get session by PID
loginctl show-session $(loginctl show --property=SessionLeader MyPID)
```

## systemd Integration

### Session Scopes
- `session-*.scope` — user session
- `user-*.scope` — user systemd instance
- `user@.service` — template for user instances

### Device Access
- Input devices assigned to sessions
- VT switching managed by logind
- ACLs set on device nodes

## Inhibitor Locks

### Types
- `sleep` — prevent suspend/hibernate
- `shutdown` — prevent poweroff/reboot
- `idle` — prevent idle action
- `handle-power-key` — ignore power key
- `handle-suspend-key` — ignore suspend key
- `handle-lid-switch` — ignore lid switch
- `handle-lid-switch-docked` — ignore docked lid switch

### View Locks
```bash
# Show all inhibitors
loginctl list-inhibitors

# Who's blocking what
systemctl list-jobs  # may show blockers
```

### Common Sources
- Desktop environments (screensaver)
- Package managers (apt, dnf)
- Media players (paused audio)
- Backup tools (running backup)

## Security Considerations

### IPC Removal
- `RemoveIPC=yes` removes shared memory on logout
- Prevents credential leaks
- May break long-running services

### Session Limits
- `SessionsMax` prevents DoS
- `UserTasksMax` prevents fork bombs
- Use systemd slices for resource limits

## Troubleshooting

### Debug Sessions
```bash
# Verbose session info
loginctl show-session $XDG_SESSION_ID -p

# Check all properties
loginctl show-session --all $XDG_SESSION_ID

# Monitor changes
journalctl -u systemd-logind -f
```

### Common Issues

#### Session Not Detected
```bash
# Check D-Bus
systemctl status systemd-logind

# Check session creation
journalctl -u systemd-logind | grep session

# Force session check
loginctl terminate-user $USER  # from other session
```

#### Lingering Not Working
```bash
# Check lingering
loginctl show-user $USER | grep Linger

# Check systemd user process
pgrep -u $USER -f systemd --user

# Verify service
systemctl --user status myservice
```

#### VT Issues
```bash
# Check VTs
loginctl list-sessions

# Check VT assignment
loginctl show-seat seat0

# Debug getty
systemctl status [email protected]
```

## User Runtime Integration

### XDG_RUNTIME_DIR
- `%t` in systemd units
- `/run/user/$UID` — user runtime
- Managed by logind

### Directory Cleanup
- Cleanup on logout (by default)
- `RemoveIPC` controls IPC objects
- `RemoveMedia` controls removable media

## Desktop Integration

### PAM Integration
```bash
# /etc/pam.d/common-session
session optional pam_systemd.so
```

### Display Manager Integration
- GDM, SDDM, LightDM call logind
- Console login via getty calls logind
- SSH sessions also integrated

### Desktop Environment Hooks
- Screen lock/unlock
- Suspend/resume handling
- Session switching

## Examples

### Check Current Session
```bash
# Get session ID
loginctl show --property=Session $SHELL_PID

# Or use environment variable
echo $XDG_SESSION_ID

# Check active session
loginctl list-sessions | grep yes
```

### Kill User Sessions
```bash
# Kill all sessions for user
loginctl kill-user alice

# Kill specific session
loginctl kill-session 3

# Terminate cleanly
loginctl terminate-user bob
```

### Configure Lid Switch
```bash
# For laptop, ignore lid when docked
echo "HandleLidSwitchDocked=ignore" >> /etc/systemd/logind.conf

# Apply changes
systemctl restart systemd-logind

# Or use lock instead
echo "HandleLidSwitch=lock" >> /etc/systemd/logind.conf
```

### Multi-Head Setup
```bash
# Disable VT auto-switching
echo "AutoVTs=2" >> /etc/systemd/logind.conf

# Keep VT on session end
echo "KillUserProcesses=no" >> /etc/systemd/logind.conf
```

## systemd-logind Files

### Configuration
- `/etc/systemd/logind.conf` — main config
- `/etc/systemd/logind.conf.d/` — drop-ins
- `/run/systemd/logind.conf` — runtime overrides

### State Files
- `/run/systemd/seats/` — seat state
- `/run/systemd/sessions/` — session state
- `/run/systemd/users/` — user state

### Runtime Integration
- `/run/systemd/liveuser` — live user tracking
- `/run/systemd/shutdown/scheduled` — scheduled shutdown

## Emergency Access

### Without Session
```bash
# Create session manually
loginctl enable-linger $USER

# Or spawn getty
systemctl start [email protected]

# Check available VTs
loginctl list-sessions
```

### Override Power Button
```bash
# Ignore power button
echo "HandlePowerKey=ignore" >> /etc/systemd/logind.conf

# Restart logind
systemctl restart systemd-logind
```

### Force Logout
```bash
# Kill all processes
loginctl kill-user --signal=KILL $USER
# Or from user session
loginctl terminate-user $USER
```