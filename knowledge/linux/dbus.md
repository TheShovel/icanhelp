# D-Bus System and Session Bus

## D-Bus Overview
- `dbus-daemon` — message bus daemon
- System bus — system services (`/usr/share/dbus-1/system.d/`)
- Session bus — user services (`~/.config/dbus-1/session.d/`)
- Service activation — on-demand service startup

## D-Bus Commands

### dbus-send
- `dbus-send --session --dest=org.freedesktop.Notifications --type=method_call --print-reply /org/freedesktop/Notifications org.freedesktop.Notifications.Notify string:"app" uint32:0 string:"" string:"Message" string:"" array:{} dict:string:string:{}`
- `dbus-send --system --dest=org.freedesktop.hostname1 --print-reply /org/freedesktop/hostname1 org.freedesktop.hostname1.Hostname`
- `dbus-send --print-reply --system / org.freedesktop.DBus.Introspectable.Introspect`

### dbus-monitor
- `dbus-monitor` — monitor all messages
- `dbus-monitor --session "type='signal',interface='org.freedesktop.DBus.Properties'"`
- `dbus-monitor --system "destination='org.freedesktop.NetworkManager'"`
- `dbus-monitor --profile` — show timing
- `dbus-monitor --timestamp` — show timestamps

### dbus-daemon
- `dbus-daemon --session --address=unix:path=/tmp/dbus-$(dbus-launch --sh-syntax | grep DBUS_SESSION_BUS_ADDRESS | cut -d'=' -f2)`
- `dbus-daemon --system --fork --pidfile=/run/dbus/pid`

## Common D-Bus Services

### System Services
- `org.freedesktop.systemd1` — systemd
- `org.freedesktop.hostname1` — hostname
- `org.freedesktop.timedate1` — time/date
- `org.freedesktop.network1` — network
- `org.freedesktop.login1` — login/session
- `org.freedesktop.PolicyKit1` — authorization
- `org.freedesktop.Accounts1` — accounts
- `org.freedesktop.ModemManager1` — modem manager

### Session Services
- `org.freedesktop.Notifications` — desktop notifications
- `org.gnome.SessionManager` — GNOME session
- `org.kde.klauncher` — KDE launcher
- `org.freedesktop.portal.*` — Flatpak portals

## D-Bus Introspection

### List Services
```bash
# System services
dbus-send --system --print-reply --dest=org.freedesktop.DBus / org.freedesktop.DBus.ListNames

# Session services
dbus-send --session --print-reply --dest=org.freedesktop.DBus / org.freedesktop.DBus.ListNames
```

### Introspect Objects
```bash
# Introspect systemd
dbus-send --system --print-reply --dest=org.freedesktop.systemd1 / org.freedesktop.DBus.Introspectable.Introspect

# Introspect systemd service
dbus-send --system --print-reply --dest=org.freedesktop.systemd1 /org/freedesktop/systemd1 org.freedesktop.DBus.Introspectable.Introspect
```

### Method Calls
```bash
# Get hostname
dbus-send --system --print-reply --dest=org.freedesktop.hostname1 /org/freedesktop/hostname1 org.freedesktop.hostname1.Hostname

# Get systemd unit file
dbus-send --system --print-reply --dest=org.freedesktop.systemd1 /org/freedesktop/systemd1/unit/nginx_2eservice org.freedesktop.systemd1.Unit.GetUnitFile
```

## D-Bus Configuration

### System Policy
- `/usr/share/dbus-1/system.d/` — default policies
- `/etc/dbus-1/system.d/` — admin overrides
- `/etc/dbus-1/session.d/` — session policies

### Policy Example
```xml
<!-- /etc/dbus-1/system.d/myapp.conf -->
<!DOCTYPE busconfig PUBLIC "-//freedesktop//DTD D-BUS Bus Configuration 1.0//EN"
 "http://www.freedesktop.org/2006/dbus-1.dtd">
<busconfig>
  <policy user="root">
    <allow own="org.example.MyApp"/>
  </policy>

  <policy group="myapp">
    <allow send_destination="org.example.MyApp"/>
    <allow receive_sender="org.example.MyApp"/>
  </policy>
</busconfig>
```

## Service Files

### System Service
```ini
# /usr/share/dbus-1/system-services/org.example.MyApp.service
[D-BUS Service]
Name=org.example.MyApp
Exec=/usr/bin/myapp-daemon
User=myapp
SystemdService=myapp.service
```

### Session Service
```ini
# ~/.local/share/dbus-1/services/org.example.MyApp.service
[D-BUS Service]
Name=org.example.MyApp
Exec=/usr/bin/myapp-client
```

## systemd Integration

### D-Bus Activatable Service
```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My D-Bus Service
BusName=org.example.MyApp

[Service]
Type=simple
ExecStart=/usr/bin/myapp-daemon
```

### Template Units
```ini
# /etc/systemd/system/myapp@.service
[Unit]
Description=My App Instance %i
BusName=org.example.MyApp%i

[Service]
ExecStart=/usr/bin/myapp --instance %i
```

## Monitoring and Debugging

### Debug Service
```bash
# Enable debug logging
export DBUS_DEBUG=1

# Run with verbose
dbus-monitor --system --debug
```

### Monitor Specific Service
```bash
# Monitor systemd
dbus-monitor --system "destination='org.freedesktop.systemd1'"

# Monitor NetworkManager
dbus-monitor --system "destination='org.freedesktop.NetworkManager'"

# Monitor signal changes
dbus-monitor --system "type='signal',interface='org.freedesktop.DBus.Properties'"
```

### Check Service Status
```bash
# List activatable services
ls /usr/share/dbus-1/system-services/

# Check if service is running
busctl --system list --acquired | grep org.example.MyApp

# Get service PID
busctl --system get-property org.freedesktop.systemd1 /org/freedesktop/systemd1 org.freedesktop.systemd1.Manager NNNN
```

## busctl (Modern Tool)

### busctl Commands
- `busctl list` — list all names
- `busctl list --acquired` — acquired names
- `busctl list --activatable` — activatable services
- `busctl status org.freedesktop.systemd1` — service status
- `busctl get-property org.freedesktop.systemd1 /org/freedesktop/systemd1 org.freedesktop.systemd1.Manager Version`

### Property Operations
```bash
# Get property
busctl --system get-property org.freedesktop.hostname1 /org/freedesktop/hostname1 org.freedesktop.hostname1 HostName

# Set property
busctl --system set-property org.freedesktop.hostname1 /org/freedesktop/hostname1 org.freedesktop.hostname1 HostName s "newhostname"

# Introspect
busctl --system introspect org.freedesktop.systemd1 /org/freedesktop/systemd1
```

### Method Calls with busctl
```bash
# Call method
busctl --system call org.freedesktop.systemd1 /org/freedesktop/systemd1 org.freedesktop.systemd1.Manager ListUnitFiles s "a(ssso)"

# With parameters
busctl --system call org.freedesktop.login1 /org/freedesktop/login1 org.freedesktop.login1.Manager TerminateSession s "session-id"
```

## D-Bus in Python

### pydbus Example
```python
import pydbus

# System bus
systemd = pydbus.SystemBus()["org.freedesktop.systemd1"]
units = systemd.ListUnits()

# Session bus
bus = pydbus.SessionBus()
notifications = bus.get("org.freedesktop.Notifications")
notifications.Notify("app", 0, "", "Title", "Message", [], {}, 5000)
```

### GDBus Example
```python
# Using Gio
from gi.repository import Gio

connection = Gio.bus_get_sync(Gio.BusType.SYSTEM, None)
proxy = Gio.DBusProxy.new_sync(connection,
    Gio.DBusProxyFlags.NONE,
    None,
    "org.freedesktop.hostname1",
    "/org/freedesktop/hostname1",
    "org.freedesktop.hostname1",
    None)
```

## Common Tasks

### Desktop Notification
```bash
dbus-send --session --print-reply --dest=org.freedesktop.Notifications \
  /org/freedesktop/Notifications \
  org.freedesktop.Notifications.Notify \
  string:"Test" uint32:0 string:"" string:"Message body" \
  string:"" array:{} dict:string:string:{} uint32:5000
```

### Systemd via D-Bus
```bash
# Start service
dbus-send --system --print-reply --dest=org.freedesktop.systemd1 \
  /org/freedesktop/systemd1 \
  org.freedesktop.systemd1.Manager.StartUnit \
  string:"nginx.service" string:"replace"

# Stop service
dbus-send --system --print-reply --dest=org.freedesktop.systemd1 \
  /org/freedesktop/systemd1 \
  org.freedesktop.systemd1.Manager.StopUnit \
  string:"nginx.service" string:""
```

### Network Manager
```bash
# List connections
dbus-send --system --print-reply --dest=org.freedesktop.NetworkManager \
  /org/freedesktop/NetworkManager/Settings \
  org.freedesktop.NetworkManager.Settings.ListConnections

# Get active connections
dbus-send --system --print-reply --dest=org.freedesktop.NetworkManager \
  /org/freedesktop/NetworkManager \
  org.freedesktop.NetworkManager.ActiveConnections
```

## Troubleshooting

### D-Bus Not Starting
```bash
# Check socket
systemctl status dbus.socket

# Check service
systemctl status dbus

# Check for stale socket
ls -la /run/dbus/system_bus_socket

# Remove stale
rm -f /run/dbus/system_bus_socket
systemctl restart dbus
```

### Permission Denied
```bash
# Check policy
cat /usr/share/dbus-1/system.d/org.freedesktop.systemd1.conf

# Check user groups
groups

# Add to required group
usermod -aG wheel alice  # or adm, systemd-journal, etc.
```

### Debug Message Loop
```bash
# Use busctl with less output
busctl --system call org.freedesktop.systemd1 /org/freedesktop/systemd1 org.freedesktop.systemd1.Manager GetUnit s "nginx.service"

# Avoid dbus-monitor infinite loop
dbus-monitor --session --profile > /tmp/bus.log
# Then analyze file
```

### Session Bus Issues
```bash
# Check address
echo $DBUS_SESSION_BUS_ADDRESS

# With display manager
eval $(dbus-launch --sh-syntax)

# In systemd user service
# Service can connect to session bus via XDG_RUNTIME_DIR/systemd/private
```

## Security Considerations

### D-Bus Security
- Services run with their own permissions
- PolicyKit handles authorization
- Session bus isolated per user
- System bus requires root for sensitive operations

### Common Security Issues
```xml
<!-- Don't use this (allows everyone) -->
<allow send_destination="org.freedesktop.systemd1"/>

<!-- Use group restrictions -->
<policy group="systemd-journal">
  <allow send_destination="org.freedesktop.systemd1"/>
</policy>
```

### Hardening Example
```bash
# Limit memory for D-Bus
systemctl set-property dbus.service MemoryMax=100M
```