# systemd Deep Dive

Advanced systemd topics beyond the common `sys svc`/`sys log` workflow in `systemd.md`: unit types, socket activation, cgroup resource control, security hardening, and `systemd-nspawn` containers.

## Unit types
| Type | Extension | Purpose |
|------|-----------|---------|
| Service | `.service` | Daemons, processes |
| Socket | `.socket` | IPC, network sockets |
| Device | `.device` | Kernel devices |
| Mount | `.mount` | Filesystem mount points |
| Automount | `.automount` | On-demand mounting |
| Swap | `.swap` | Swap files/partitions |
| Target | `.target` | Synchronization points |
| Path | `.path` | Path-based activation |
| Timer | `.timer` | Scheduled activation (see systemd-timers.md) |
| Slice | `.slice` | Resource grouping |
| Scope | `.scope` | External processes |

## Service types
```ini
Type=simple          # default: stays running, main process = service
Type=forking         # parent exits, child runs (needs PIDFile=)
Type=oneshot         # runs once, exits (use RemainAfterExit=yes)
Type=dbus           # acquires a D-Bus name
Type=notify         # sends READY=1 via sd_notify()
Type=idle           # waits until all jobs dispatched
```

## Socket activation
```ini
# /etc/systemd/system/myapp.socket
[Socket]
ListenStream=8080
ListenStream=[::]:8080
Accept=yes
[Install]
WantedBy=sockets.target
```
```ini
# /etc/systemd/system/myapp@.service (template, socket-activated)
[Service]
ExecStart=/opt/myapp/bin/worker
StandardInput=socket
```
Test a socket without a unit: `systemd-socket-activate -l 8080 -- /opt/myapp/bin/server`. Enable with `sys svc enable myapp.socket`.

## Resource control (cgroups v2)
```ini
[Service]
CPUQuota=200%            # 2 cores worth of time
CPUShares=1024          # relative weight
CPUAffinity=0 1         # pin to specific cores
MemoryMax=512M          # hard limit
MemoryHigh=400M         # throttle threshold
IOWeight=100            # relative weight (10-1000)
TasksMax=4096           # max tasks/threads
```
Inspect applied limits: `systemctl show myapp --property=MemoryMax`.

## Security hardening
```ini
[Service]
PrivateTmp=yes
PrivateDevices=yes
ProtectSystem=strict    # read-only /usr, /boot, /etc
ProtectHome=yes
ReadWritePaths=/var/lib/myapp /var/log/myapp
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
NoNewPrivileges=yes
SystemCallFilter=@system-service
```
Audit a unit: `systemd-analyze security my.service`. See `security.md` for host-wide guidance.

## Custom target
```ini
# /etc/systemd/system/myapp.target
[Unit]
Description=MyApp Stack
Requires=myapp.service myapp-worker.service
After=myapp.service myapp-worker.service
```

## systemd-nspawn (containers)
```bash
systemd-nspawn -D /var/lib/machines/mycontainer -b        # boot a directory tree
machinectl pull-tar --verify=no https://example.com/arch.tar.xz
systemd-nspawn -D /path --network-veth --bind-ro=/etc/resolv.conf
```

## Debug mode
```bash
systemd-analyze set-log-level debug
# or at boot: systemd.log_level=debug systemd.log_target=journald
```
