# systemd-logind (Session & Seat Management)

`systemd-logind` tracks user sessions, seats, power-key handling, and inhibitor locks. `loginctl` is its CLI. User services are covered in `systemd-user-services.md`.

## Sessions
```
loginctl list-sessions                       # active sessions
loginctl show-session $XDG_SESSION_ID      # details
loginctl terminate-session 2                # clean terminate
loginctl lock-session 2                     # lock
```

## Users
```
loginctl list-users
loginctl show-user $UID
loginctl enable-linger username              # run user services without login
loginctl disable-linger username
```

## Seats
```
loginctl list-seats
loginctl seat-status seat0                   # assigned devices
loginctl attach seat1 /dev/input/by-id/...  # assign device
```

## Inhibitor locks
Inhibitors block power/sleep/lid actions (e.g. a package manager holding `shutdown`).
```
systemd-inhibit --list        # who is blocking what, and why
```
Inhibitor types: `sleep`, `shutdown`, `idle`, `handle-power-key`, `handle-suspend-key`, `handle-lid-switch`, `handle-lid-switch-docked`.

## Configuration (`/etc/systemd/logind.conf`)
```
[Login]
HandlePowerKey=poweroff      # or suspend, hibernate, ignore, lock
HandleLidSwitch=suspend      # laptops: lock, or ignore when docked
IdleAction=ignore            # ignore|suspend|hibernate|hybrid-sleep|lock-session
IdleActionSec=15min
RemoveIPC=yes                # drop shared memory on logout (security)
```
Apply: `sudo systemctl restart systemd-logind`.

## Troubleshooting
```
sys svc status systemd-logind
sys log follow systemd-logind
loginctl show-user $USER | grep Linger     # lingering not working?
pgrep -u $USER systemd                     # is the user instance running?
```
