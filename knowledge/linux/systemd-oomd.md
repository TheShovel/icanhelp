# systemd-oomd (Out-of-Memory Daemon)

`systemd-oomd` monitors memory pressure via cgroup v2 events and kills the worst-offending process before the kernel OOM killer triggers. Requires systemd 247+ (`systemctl --version`).

## Enable / control — use `sys svc`
```bash
sys svc enable systemd-oomd
sys svc status systemd-oomd
sys svc mask systemd-oomd      # prevent start (debugging)
sys svc unmask systemd-oomd
```
Raw equivalent: `sudo systemctl enable --now systemd-oomd`.

Config: `/etc/systemd/oomd.conf` (vendor default at `/usr/lib/systemd/oomd.conf`), drop-ins in `/etc/systemd/oomd.conf.d/`.
```
# /etc/systemd/oomd.conf
[OOM]
DefaultMemoryPressureDurationSec=30s
DefaultMemoryPressureThresholdSec=30s
```

## Inspect state
```
oomctl            # show configuration + active monitors
oomctl dump      # dump internal state (monitors, pressure)
```
Note: `oomctl` only works while `systemd-oomd.service` is running.

## Memory pressure (cgroup v2)
```
cat /sys/fs/cgroup/system.slice/memory.events   # low/medium/critical counters
cat /sys/fs/cgroup/system.slice/memory.pressure # PSI pressure file
```
Pressure levels: `low` (reclaim needed), `medium` (actively reclaiming), `critical` (near OOM).

## Process selection & OOM score
- Kills the highest-RSS process in the most-pressured cgroup, excluding root, realtime, and processes with `OOMScoreAdjust=-1000`.
- `/proc/<pid>/oom_score_adj`: `-1000` immune, `1000` most likely killed.
```ini
# in a unit
[Service]
OOMScoreAdjust=500     # more likely to be killed
MemoryHigh=4G          # start reclaim at 4G
MemoryMax=8G           # hard limit
```

## Custom monitors
```ini
# /etc/systemd/oomd.conf.d/database.conf
[Monitor]
Type=user
User=mysql
MemoryPressureDurationSec=60s
MemoryPressureThreshold=70.0
```
Monitor `Type`: `user`, `system`, `root`.

## Simulate pressure (test only)
```bash
systemd-run --scope -p MemoryMax=100M stress --vm 1 --vm-bytes 200M
sys log follow | grep -i kill
```

## Troubleshooting
```
oomctl
sys svc status systemd-oomd
sys log show systemd-oomd     # journal (since "1 hour ago")
cat /sys/fs/cgroup/system.slice/memory.events
```

## vs earlyoom
- `earlyoom` — userspace killer using RSS only.
- `systemd-oomd` — integrated, uses PSI pressure levels, per-cgroup aware.
