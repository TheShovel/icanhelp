# D-Bus System and Session Bus

## Overview
- `dbus-daemon` — message bus. System bus (`/usr/share/dbus-1/system.d/`), session bus (per-user).
- Services activate on demand. `busctl` is the modern introspection tool.

## Service (use `sys svc`)
```bash
sys svc status dbus
sys svc restart dbus
```

## Inspect with busctl (verified)
```bash
busctl list --acquired
busctl list --activatable
busctl status org.freedesktop.systemd1
busctl --system get-property org.freedesktop.hostname1 /org/freedesktop/hostname1 org.freedesktop.hostname1 StaticHostname
busctl --system introspect org.freedesktop.systemd1 /org/freedesktop/systemd1
busctl --system call org.freedesktop.login1 /org/freedesktop/login1 org.freedesktop.login1.Manager TerminateSession s "session-id"
```

## Inspect with dbus-send (verified)
```bash
dbus-send --system --print-reply --dest=org.freedesktop.DBus / org.freedesktop.DBus.ListNames
dbus-send --system --print-reply --dest=org.freedesktop.DBus / org.freedesktop.DBus.Introspectable.Introspect
dbus-send --system --print-reply --dest=org.freedesktop.hostname1 /org/freedesktop/hostname1 org.freedesktop.hostname1.Hostname
dbus-send --session --print-reply --dest=org.freedesktop.Notifications /org/freedesktop/Notifications org.freedesktop.Notifications.Notify string:"app" uint32:0 string:"" string:"Title" string:"Msg" array:{} dict:string:string:{} uint32:5000
```

## Monitor (verified)
```bash
dbus-monitor --system "destination='org.freedesktop.systemd1'"
dbus-monitor --session "type='signal',interface='org.freedesktop.DBus.Properties'"
```

## Common system services
`org.freedesktop.systemd1`, `hostname1`, `timedate1`, `network1`, `login1`, `PolicyKit1`, `Accounts1`.

## Troubleshooting
```bash
sys svc status dbus.socket
ls -la /run/dbus/system_bus_socket
cat /usr/share/dbus-1/system.d/org.freedesktop.systemd1.conf   # policy
```
- **Permission denied**: check policy file and your groups (`groups`); add to `wheel`/`systemd-journal` as needed.
- **Session bus**: `echo $DBUS_SESSION_BUS_ADDRESS`; in a script use `eval $(dbus-launch --sh-syntax)`.
