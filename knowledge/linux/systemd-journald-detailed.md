# systemd-journald - System Logging

## Overview
- `systemd-journald` — systemd's logging service
- Binary log format (not text files)
- Persistent storage support
- Structured log metadata

## journald Configuration

### Main Config File
- `/etc/systemd/journald.conf` — main configuration
- `/etc/systemd/journald.conf.d/*.conf` — drop-in overrides
- `/usr/lib/systemd/journald.conf.d/` — vendor defaults

### Configuration Options
```
# /etc/systemd/journald.conf
[Journal]
Storage=persistent
Compress=yes
Seal=yes
SplitMode=none
SyncIntervalSec=1s
ForwardToSyslog=yes
ForwardToKafka=no
ForwardToWall=yes
MaxRetentionSec=1month
MaxFileSec=1week
MaxFileSizeSec=100M
MaxFiles=100
RuntimeMaxUse=200M
RuntimeKeepFree=100M
RuntimeMaxFileSize=10M
```

### Storage Modes
- `Storage=persistent` — on disk (`/var/log/journal/`)
- `Storage=volatile` — in memory (/run/log/journal/)
- `Storage=Runtime` — symlink to /run/log/journal/
- `Storage=none` — no storage (discard immediately)

### Compression
- `Compress=yes` — compress old entries
- `Compress=no` — no compression
- Saves disk space for repetitive logs

## journalctl Commands

### Basic Operations
- `journalctl` — all logs (pager)
- `journalctl -n 50` — last 50 lines
- `journalctl -f` — follow logs
- `journalctl -f --since "1 hour ago"` — follow from time
- `journalctl -e` — jump to end

### Time Filtering
- `journalctl --since "2024-01-01"` — from date
- `journalctl --since "yesterday"` — from yesterday
- `journalctl --since "1 hour ago"` — from 1 hour
- `journalctl --until "1 hour ago"` — until time
- `journalctl --since "2024-01-01" --until "2024-01-02"` — date range

### Service Filtering
- `journalctl -u nginx` — nginx logs
- `journalctl -u nginx -u php-fpm` — multiple services
- `journalctl -u nginx.service` — explicit .service
- `journalctl _SYSTEMD_UNIT=nginx.service` — internal filter
- `journalctl -t sshd` — by syslog identifier

### Kernel Logs
- `journalctl -k` — kernel logs only
- `journalctl --dmesg` — dmesg format
- `journalctl -k -b` — current boot kernel logs

### Priority Filtering
- `journalctl -p err` — priority err and above
- `journalctl -p warning` — warning and above
- `journalctl -p debug` — all logs including debug
- Priority: 0=emerg, 1=alert, 2=crit, 3=err, 4=warning, 5=notice, 6=info, 7=debug

### Boot Selection
- `journalctl -b` — current boot
- `journalctl -b -1` — previous boot
- `journalctl -b -2` — two boots ago
- `journalctl --list-boots` — list all boots

### Field Filtering
- `journalctl _PID=1234` — by process ID
- `journalctl _UID=1000` — by user ID
- `journalctl PRIORITY=3` — by priority (err)
- `journalctl SYSLOG_FACILITY=3` — by facility (daemon)
- `journalctl MESSAGE_ID=...` — by message ID

## Structured Logging

### Log Fields
- `_PID`, `_UID`, `_GID` — process identifiers
- `SYSLOG_IDENTIFIER` — program name
- `SYSLOG_FACILITY` — syslog facility
- `PRIORITY` — log priority
- `MESSAGE` — log message
- `_BOOT_ID` — boot identifier
- `_MACHINE_ID` — machine identifier

### View Fields
```bash
# Show all fields
journalctl -o json

# Show specific fields
journalctl -o json MESSAGE PRIORITY _SYSTEMD_UNIT

# Export for processing
journalctl -o json --since "1 hour ago"
```

### Output Formats
- `journalctl -o short` — traditional format (default)
- `journalctl -o short-iso` — with ISO timestamp
- `journalctl -o short-monotonic` — monotonic timestamp
- `journalctl -o verbose` — all fields
- `journalctl -o json` — JSON format
- `journalctl -o json-pretty` — pretty JSON
- `journalctl -o export` — export format
- `journalctl -o cat` — message only

## journald Maintenance

### Manual Cleanup
```bash
# Vacuum by size
journalctl --vacuum-size=100M

# Vacuum by time
journalctl --vacuum-time=1month

# Vacuum by files
journalctl --vacuum-files=100

# Clean all
journalctl --vacuum-size=0
```

### Disk Usage
- `journalctl --disk-usage` — show disk usage
- `journalctl --verify` — check integrity
- `journalctl --disk-usage` — disk space used

### Rotation Settings
```
# In journald.conf
SystemMaxUse=1G        # Max disk space
SystemFree=100M         # Min free space
SystemMaxFileSize=100M   # Max file size
SystemMaxFiles=100       # Max files
```

## Forwarding and Integration

### Forward to Syslog
```
# /etc/systemd/journald.conf
ForwardToSyslog=yes
```
- Requires rsyslog/systemd-journal-gateway

### Forward to Console
```
# /etc/systemd/journald.conf
ForwardToConsole=yes
TTYPath=/dev/console
MaxLevelConsole=info
```

### Forward to Wall
- `ForwardToWall=yes` — send to all logged-in users
- Controlled by wall messages

### Remote Logging
```
# /etc/systemd/journald.conf
ForwardToSyslog=yes
SyslogFacility=daemon
SyslogPriority=info
```

## journald Troubleshooting

### Check Status
```bash
# Check service
systemctl status systemd-journald

# Check configuration
journalctl --verify

# Check disk usage
journalctl --disk-usage
```

### Common Issues

#### No Persistent Storage
```bash
# Create directory
mkdir -p /var/log/journal

# Set permissions
systemd-tmpfiles --create --user

# Or enable
echo "Storage=persistent" >> /etc/systemd/journald.conf
systemctl restart systemd-journald
```

#### Too Much Disk Usage
```bash
# Reduce size
journalctl --vacuum-size=100M
journalctl --vacuum-time=2 weeks

# Or change config
echo "SystemMaxUse=500M" >> /etc/systemd/journald.conf
```

#### Missing Logs
```bash
# Check forwarding
journalctl -o short --since "1 hour ago"

# Check syslog
grep something /var/log/syslog

# Check if dropped
journalctl --disk-usage
journalctl --verify
```

## journalctl Advanced Usage

### Field Queries
```bash
# Complex queries
journalctl _SYSTEMD_UNIT=nginx.service PRIORITY=3 + PRIORITY=4

# Field matching
journalctl SYSLOG_IDENTIFIER=sshd _SOURCE_REALTIME_TIMESTAMP

# Field presence
journalctl MESSAGE_ID=
```

### JSON Processing
```bash
# Extract specific field
journalctl -o json | jq '.MESSAGE'

# Filter by priority
journalctl -o json | jq 'select(.PRIORITY <= 4)'

# Show timestamps
journalctl -o json | jq '.[_SOURCE_REALTIME_TIMESTAMP]'
```

### Monitoring
```bash
# Count messages per service
journalctl --since "1 hour" --no-pager | grep -c "_SYSTEMD_UNIT"

# Watch for errors
journalctl -f -p err

# Watch specific service
journalctl -fu nginx -f
```

## journald Configuration Examples

### Server Configuration
```
# /etc/systemd/journald.conf
[Journal]
Storage=persistent
Compress=yes
Seal=yes
SystemMaxUse=2G
RuntimeMaxUse=100M
MaxRetentionSec=3month
ForwardToSyslog=yes
MaxFileSec=1week
```

### Embedded Configuration
```
# /etc/systemd/journald.conf
[Journal]
Storage=volatile
RuntimeMaxUse=50M
RuntimeMaxFileSize=5M
MaxRetentionSec=1day
ForwardToWall=no
```

### Security-focused
```
# /etc/systemd/journald.conf
[Journal]
Storage=persistent
Seal=yes
SplitMode=uid
ForwardToSyslog=yes
SystemMaxUse=1G
```

## journald Integration

### rsyslog Integration
```
# /etc/systemd/journald.conf
ForwardToSyslog=yes
```

### File Output
```
# /etc/rsyslog.d/journal.conf
$ModLoad imjournal
$JournalStateFile /var/lib/rsyslog/journal.state
```

### Logstash Integration
```
# journalbeat configuration
inputs:
  - type: journald
    paths:
      - /run/log/journal
```

## Custom Logging

### Using logger
```bash
# Basic log
logger "Application event"

# With tag
logger -t myapp "Something happened"

# With priority
logger -p local0.info "Info message"

# To journal with structured fields
logger --journald METADATA_KEY=METADATA_VALUE "Message"
```

### Using systemd-cat
```bash
# Log to journal
echo "Message" | systemd-cat -t myapp

# With priority
echo "Error" | systemd-cat -p err -t myapp

# Identifier only
echo "Done" | systemd-cat -s
```

## Access Control

### Permissions
- `/var/log/journal/` — root only by default
- `/run/log/journal/` — world readable
- Use `systemd-tmpfiles` to set permissions

### Group Access
```
# /etc/systemd/journald.conf
[Journal]
Storage=persistent
# Then set permissions
```

```bash
# Add admin to systemd-journal
usermod -a -G systemd-journal alice
```

### Namespace Isolation
- `journalctl --user` — user logs
- `journalctl --system` — system logs
- Separate namespaces automatically

## Debugging journald

### Debug Mode
```bash
# Verbose logging
SYSTEMD_LOG_LEVEL=debug journalctl

# Or enable in config
echo "LogLevel=debug" >> /etc/systemd/journald.conf
systemctl restart systemd-journald
```

### Inspect Internal State
```bash
# Show internal state
journalctl --disk-usage --verify

# Check file descriptors
ls -la /proc/$(pgrep journald)/fd/

# Monitor activity
strace -p $(pgrep journald)
```

## journald vs Traditional Logging

### Comparison Table
| Feature | journald | syslog |
|---------|----------|--------|
| Binary format | Yes | No |
| Structured fields | Yes | Limited |
| Forward compatibility | Excellent | Poor |
| Disk space | Efficient | Varies |
| Network protocol | None built-in | rsyslog, syslog |
| Log retention | Configurable | External tools |

### Migration Strategy
1. Keep both during transition
2. Configure forwarding
3. Update log analysis tools
4. Eventually disable rsyslog

## journald Best Practices

### Server Best Practices
```
# /etc/systemd/journald.conf
[Journal]
Storage=persistent
SystemMaxUse=2G
SystemMaxFileSize=100M
MaxRetentionSec=6month
ForwardToSyslog=yes
Seal=yes
```

### Security Best Practices
- Enable `Seal=yes` for log integrity
- Use `Storage=persistent` for audit trails
- Restrict access to journal directory
- Forward to centralized logging

### Performance Best Practices
- Enable `Compress=yes`
- Limit `SystemMaxUse` appropriately
- Use `RuntimeMaxUse` for embedded
- Regular vacuum operations