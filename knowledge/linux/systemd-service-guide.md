# systemd Service Guide

Practical patterns for writing `.service` units. Common operations use `sys svc` (see `systemd.md`); timers in `systemd-timers.md`.

## Exec directives
```ini
ExecStart=/path/to/exe arg1 arg2          # required for non-oneshot
ExecStartPre=/path/to/pre-start.sh        # run before
ExecStartPost=/path/to/post-start.sh      # run after start
ExecStop=/path/to/stop.sh                # on stop
ExecReload=/path/to/reload.sh            # on `systemctl reload`
# Shell features need /bin/sh -c:
ExecStart=/bin/sh -c 'cd /opt/myapp && ./myapp >> /var/log/myapp.log 2>&1'
```

## Environment
```ini
Environment=VAR1=value1
EnvironmentFile=/etc/myapp/config.env          # one VAR=value per line
EnvironmentFile=-/etc/myapp/local.env         # leading - = ignore if missing
```
Runtime overrides: `systemctl set-environment VAR=value`.

## Restart policies
```ini
Restart=no                 # never (default)
Restart=on-failure        # non-zero exit or signal
Restart=on-abort          # uncaught signal
Restart=always            # any exit
RestartSec=5s 10s 30s    # exponential backoff
StartLimitIntervalSec=60  # rate-limit window
StartLimitBurst=3         # max restarts in window
```

## Common patterns

### App with migrations
```ini
[Service]
Type=simple
ExecStartPre=/opt/myapp/bin/migrate up
ExecStart=/opt/myapp/bin/server
```

### Multiple workers (template)
```ini
# myapp@.service
[Service]
Type=simple
ExecStart=/opt/myapp/bin/worker --id=%i
```
```bash
sudo systemctl enable --now myapp@1 myapp@2 myapp@3   # sys svc has no --now
```

### Dependency on a mount
```ini
[Unit]
Requires=mnt-data.mount
After=mnt-data.mount
```

### Watchdog
```ini
[Service]
Type=notify
WatchdogSec=30
# App must call sd_notify(0, "WATCHDOG=1") every <30s or systemd restarts it
```

### Container (podman)
```ini
[Service]
Type=simple
Restart=always
ExecStartPre=-/usr/bin/podman rm -f myapp
ExecStart=/usr/bin/podman run --rm --name myapp -p 8080:8080 myimage
ExecStop=/usr/bin/podman stop -t 10 myapp
```
Or generate units: `podman generate systemd --name myapp --files --new`.

## After writing a unit
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now myapp     # sys svc has no --now
sys svc status myapp
```

## Troubleshooting
```bash
sys svc status myservice
systemctl --failed                       # all failed units
systemd-analyze verify /etc/systemd/system/myservice.service
systemctl cat myservice
systemctl reset-failed myservice
systemd-cgtop                            # live cgroup resource usage
```
