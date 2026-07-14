# systemd User Services

Run services under your user (no root), managed by a per-user `systemd --user` instance. Units live in `~/.config/systemd/user/`. Common operations use `systemctl --user`; timers in `systemd-timers.md`.

## Management
```
systemctl --user daemon-reload
systemctl --user list-units
systemctl --user enable --now myapp
systemctl --user status myapp
journalctl --user -u myapp        # user-service logs
journalctl --user -f
systemctl --user list-timers       # user timers
```

## Unit file
```ini
# ~/.config/systemd/user/myapp.service
[Unit]
Description=My Application
After=network.target

[Service]
Type=simple
ExecStart=%h/.local/bin/myapp --config %h/.config/myapp/config.yaml
WorkingDirectory=%h
Restart=on-failure
RestartSec=5s
Environment=PATH=%h/.local/bin:/usr/bin:/bin
NoNewPrivileges=yes
PrivateTmp=yes

[Install]
WantedBy=default.target
```

## Specifiers
- `%h` — home directory, `%u` — user name, `%U` — user ID
- `%t` — runtime dir (`$XDG_RUNTIME_DIR`, e.g. `/run/user/1000`)
- `%i` — instance name (for templates)

## Persistent environment
```
# ~/.config/environment.d/*.conf
PATH="$HOME/.local/bin:$PATH"
EDITOR=vim
```
Or import the shell env: `systemctl --user import-environment`. Inspect with `systemctl --user show-environment`.

## Lingering (run without login)
```
loginctl enable-linger username     # user services survive logout
loginctl disable-linger username
loginctl show-user $USER | grep Linger
```
Without lingering, user services stop when the session ends.

## Runtime / state directories
```ini
[Service]
RuntimeDirectory=myapp            # $RUNTIME_DIRECTORY/myapp
StateDirectory=myapp              # %S/myapp (persistent)
CacheDirectory=myapp              # %C/myapp
LogsDirectory=myapp               # %L/myapp
```

## Socket activation (user)
```ini
# ~/.config/systemd/user/mysocket.socket
[Socket]
ListenStream=%t/myapp.sock
[Install]
WantedBy=sockets.target
```

## D-Bus activation
```ini
# ~/.config/systemd/user/org.example.MyApp.service
[Unit]
Description=My App D-Bus Service
[Service]
Type=dbus
BusName=org.example.MyApp
ExecStart=%h/.local/bin/myapp-daemon
```

## Troubleshooting
```
ps aux | grep "systemd --user"     # is the user instance running?
echo $XDG_RUNTIME_DIR              # should be /run/user/$(id -u)
systemctl --user status myapp -l
journalctl --user -u myapp -o json
# No instance? sudo loginctl enable-linger $USER
```
