# Process Accounting & System Auditing

## Process Accounting (acct / psacct)

Tracks every command executed with CPU/memory/user. Package: `acct` (Debian/Fedora) or `acct` (Arch).

```bash
# Enable (root)
sys svc enable --now acct
# or manually: accton /var/log/account/pacct

# Query
ac                  # connect time
ac -p               # per-user breakdown
lastcomm            # list executed commands
lastcomm command    # specific command
sa -m               # per-user summary
sa -k               # sort by CPU time
```

Data file: `/var/log/account/pacct` (binary; read with `sa`/`lastcomm`). Note: `accton`/`ac` are NOT installed in this sandbox.

## systemd-coredump

Core dumps are captured by systemd automatically.

```bash
coredumpctl list                       # list dumps (tested: works)
coredumpctl info PID                   # details
coredumpctl dump PID --output=/tmp/core
coredumpctl gdb PID                    # debug with gdb
coredumpctl list --executable=/usr/bin/myapp
```

Config: `/etc/systemd/coredump.conf` (`Storage=external`, `Compress=yes`). Set `DefaultLimitCORE=infinity` in `/etc/systemd/system.conf`.

## auditd (Linux Audit)

```bash
auditctl -l                              # list rules
auditctl -w /etc/passwd -p wa -k passwd  # watch file writes/attrs
auditctl -a always,exit -F arch=b64 -S execve -k cmd  # watch execve
auditctl -D                              # delete all rules
augenrules --load                        # load /etc/audit/rules.d/*
```

Search & report:
```bash
ausearch -k passwd_changes     # by key
ausearch -p PID                # by process
ausearch -ts today             # since midnight
aureport --summary             # executive summary
aureport -x                    # executable report
```

Persistent rules in `/etc/audit/rules.d/audit.rules`:
```ini
-w /etc/passwd -p wa -k passwd_changes
-w /etc/shadow -p wa -k shadow_changes
-a always,exit -F arch=b64 -S execve -k command_exec
```

## atop (Historical Monitoring)

```bash
atop -w /var/log/atop/atop.log 60   # record, 60s interval
atop -r /var/log/atop/atop.log      # replay history
```

## Log Analysis

```bash
ausearch -m USER_AUTH -sv no -i      # failed auth
sys log show ssh | grep "Failed password"
grep sudo /var/log/auth.log
```

## Performance Impact

- `acct` — ~1-5% CPU overhead
- `auditd` — ~5-10% (depends on rules)
- `sysdig` — significant; avoid in production
