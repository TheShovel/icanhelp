# Process Accounting and System Auditing

## Process Accounting (acct)

### Installation
```bash
# Debian/Ubuntu
apt install acct

# RHEL/Fedora
dnf install acct

# Arch
pacman -S acct
```

### Enable Process Accounting
```bash
# Start service
systemctl enable --now acct

# Or manually (if no systemd)
accton /var/log/account/pacct
```

### Accounting Commands

#### Basic Usage
- `ac` — connect time accounting
- `ac -u username` — time for specific user
- `ac -p` — per-user breakdown
- `ac -d` — per-day breakdown

#### Process Accounting
- `lastcomm` — list executed commands
- `lastcomm username` — commands by user
- `lastcomm command` — specific command history
- `lastcomm -x` — commands by terminal
- `lastcomm -H` — human readable times

#### Statistics
- `sa` — summarize accounting
- `sa -m` — per-user summary
- `sa -u` — per-user with time (not sorted by count)
- `sa -k` — sort by CPU time (MB)
- `sa -n` — sort by CPU time (user time + system time)
- `sa -r` — per-real-user (uid not changed to login)
- `sa -c` — percentage of total

### Accounting Fields
The accounting database tracks:
- User, group, process ID
- Start time, end time
- CPU time (user + system)
- Memory used
- Terminal
- Command name

### Example Usage
```bash
# Find most active users
sa -m | head -10

# Find resource-heavy commands
sa -k | head -10

# Track specific user activity
lastcomm -u alice

# Find recently run commands
lastcomm | head -20
```

### Accounting Storage
- `/var/log/account/pacct` — main accounting file
- Rotate with logrotate
- Binary format, read with sa/lastcomm

## systemd-coredump

### Enable coredump
```bash
# Usually enabled by default
systemctl enable --now systemd-coredump.socket

# Check status
coredumpctl --version
```

### Coredump Commands
- `coredumpctl list` — list core dumps
- `coredumpctl info PID` — details by PID
- `coredumpctl gdb PID` — debug with gdb
- `coredumpctl dump PID` — extract core file
- `coredumpctl dump PID --output=/tmp/core` — specific location
- `coredumpctl list --executable=/usr/bin/myapp` — filter by binary

### Configuration
```bash
# /etc/systemd/coredump.conf
[Coredump]
Storage=external  # or "none" to disable
Compress=yes
```

### Coredump Limits
```bash
# /etc/systemd/system.conf
DefaultLimitCORE=infinity  # or specific size
```

## auditd (Audit Daemon)

### Installation
```bash
# Debian/Ubuntu
apt install auditd

# RHEL/Fedora (usually preinstalled)
dnf install audit
```

### Audit Rules
- `auditctl -l` — list current rules
- `auditctl -a always,exit -F arch=b64 -S open,openat` — watch file opens
- `auditctl -w /etc/passwd -p wa -k passwd_changes` — watch file
- `auditctl -D` — delete all rules
- `auditctl -e 1` — enable auditing
- `auditctl -e 0` — disable auditing temporarily

### Rule Syntax
```
auditctl -a|-w rule-key [options]
-w path -p permissions -k key
-a list,action -S syscall [options]
```

#### Watch Rules
- `auditctl -w /file -p r` — watch reads
- `auditctl -w /file -p w` — watch writes
- `auditctl -w /file -p x` — watch execute
- `auditctl -w /file -p wa` — watch write/attribute

#### Syscall Rules
- `auditctl -a always,exit -F arch=b64 -S open,openat -k file_access`
- `auditctl -a always,exit -F arch=b64 -S execve -k command_exec`
- `auditctl -a always,exit -F arch=b64 -S socket -F a2=2 -k network_connect` (AF_INET)

### Audit Search
- `ausearch -k passwd_changes` — search by key
- `ausearch -p PID` — search by process
- `ausearch -u username` — search by user
- `ausearch -sc open,openat` — search by syscall
- `ausearch -i` — interpret (decode) results
- `ausearch -ts recent` — since boot
- `ausearch -ts today` — since midnight
- `ausearch -ts 01/01/2024 12:00:00` — since date/time

### aureport
- `aureport` — summary report
- `aureport --summary` — executive summary
- `aureport -u` — user report
- `aureport -x` — executable report
- `aureport -f` — file report
- `aureport -s` — syscall report
- `aureport -l` — login report
- `aureport -i` — interpret output

### Persistent Rules
```
# /etc/audit/rules.d/audit.rules
-w /etc/passwd -p wa -k passwd_changes
-w /etc/shadow -p wa -k shadow_changes
-w /etc/group -p wa -k group_changes
-a always,exit -F arch=b64 -S execve -k command_execution
-a always,exit -F arch=b64 -S open,openat -F exit=-ENOENT -k failed_opens
```

### Audit Log Location
- `/var/log/audit/audit.log` — main log
- Binary format, requires ausearch/aureport
- JSON format: `journalctl -u auditd` (if configured)

## sysdig/falco (Advanced Monitoring)

### sysdig
- `sysdig` — live system monitoring
- `sysdig -c topfiles` — top accessed files
- `sysdig -c topfiles_bytes` — top bytes transferred
- `sysdig proc.name=nginx` — filter by process
- `sysdig fd.port=80` — filter by port
- `sysdig -w trace.scap` — capture to file

### sysdig Filters
- `proc.name` — process name
- `fd.name` — file name
- `fd.port` — port number
- `evt.type` — event type (open, read, write)
- `evt.failed` — failed events
- `evt.args contains "password"` — string match

### sysdig Examples
```bash
# All network activity
sysdig evt.type=connect

# File access by user
sysdig "user.name=alice and evt.type=open"

# Process execution
sysdig evt.type=execve

# Failed file reads
sysdig "evt.type=open and evt.failed=true"
```

## atop (Advanced Monitoring)

### atop Features
- `atop` — TUI with history
- `atop -w /var/log/atop/atop.log 60` — write with 1min interval
- `atop -r /var/log/atop/atop.log` — read history
- `atop -g` — generic output (no colors)

### atop Fields
- CPU: sys, user, irq, idle
- Memory: total, free, cache, buff, slab
- Disk: reads, writes, MB/s
- Network: rcv, snd, KB/s

### atop Navigation
- `t` — next time snapshot
- `T` — previous snapshot
- `b` — jump to specific time
- `g` — generic process info

## psacct (Alternative)

### Basic Commands
- `accton` — enable/disable accounting
- `lastcomm` — list commands
- `sa` — summarize
- `dump-acct` — dump raw data

### Usage
```bash
# Start accounting
accton /var/log/pacct

# Start service
systemctl start acct

# View summary
sa -m  # per-user
sa -k  # by CPU time
```

## Process Monitoring Tools

### htop
- `htop` — enhanced top
- `htop -u username` — filter by user
- Tree view (F5)
- Thread view (F2)
- Custom columns (F2)

### atop Configuration
```
# ~/.atoprc
rawdatasize 10000
interval 10
```

### atop Raw Log
- `/var/log/atop/atop_YYYYMMDD` — daily logs
- Binary format for performance
- 10 minute intervals (default)

## Security Auditing Checklist

### Essential Rules
```bash
# /etc/audit/rules.d/security.rules
# Sudo and su usage
-w /usr/bin/sudo -p x -k sudo_exec
-w /bin/su -p x -k su_exec

# User management
-w /etc/passwd -p wa -k passwd_changes
-w /etc/shadow -p wa -k shadow_changes
-w /etc/group -p wa -k group_changes

# SSH
-w /etc/ssh/sshd_config -p wa -k sshd_config
-w /usr/sbin/sshd -p x -k sshd_exec

# Cron
-w /etc/crontab -p wa -k crontab
-w /etc/cron.d/ -p wa -k cron_config

# Library loading
-w /lib64/ld-linux-x86-64.so.2 -p x -k library_load

# Kernel modules
-w /sbin/insmod -p x -k kernel_module_load
-w /sbin/rmmod -p x -k kernel_module_remove
```

### Apply Rules
```bash
# Load rules
augenrules --load

# Or restart
systemctl restart auditd
```

## Log Analysis

### Failed Logins
```bash
# Process accounting
lastcomm | grep -E "(ssh|login)"

# Audit log
ausearch -m USER_AUTH -sv no -i

# Auth log
journalctl -u ssh | grep "Failed password"
```

### Privilege Escalation
```bash
# Audit
ausearch -k sudo_exec -i
ausearch -k su_exec -i

# Sudo log
grep sudo /var/log/auth.log
```

### File Integrity
```bash
# Audit watches
ausearch -k passwd_changes -ts today
ausearch -k shadow_changes -ts today

# Report
aureport -f -i | grep "/etc/"
```

## Integration with SIEM

### JSON Output
```bash
# ausearch JSON
ausearch -ts recent -i -o json

# Process accounting to syslog
sa -f | logger -t acct
```

### Remote Logging
```
# /etc/audisp/plugins.d/syslog.conf
active = yes
direction = out
path = builtin_syslog
type = builtin
```

## Performance Impact

### Accounting Overhead
- `acct` — ~1-5% CPU overhead (minimal)
- `audit` — ~5-10% overhead (depends on rules)
- `sysdig` — significant overhead (avoid on production)

### Tuning
```
# /etc/audit/auditd.conf
max_log_file = 100
num_logs = 5
max_log_file_action = ROTATE
```