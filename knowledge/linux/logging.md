# Linux Logging: journald, rsyslog, logrotate

## systemd-journald

### Configuration

```ini
# /etc/systemd/journald.conf
[Journal]
Storage=persistent
Compress=yes
Seal=yes
SplitMode=uid
SyncIntervalSec=5m
RateLimitIntervalSec=30s
RateLimitBurst=10000
SystemMaxUse=4G
SystemKeepFree=1G
SystemMaxFileSize=1G
SystemMaxFiles=100
RuntimeMaxUse=500M
RuntimeKeepFree=100M
RuntimeMaxFileSize=100M
RuntimeMaxFiles=100
MaxRetentionSec=1month
MaxFileSec=1month
ForwardToSyslog=yes
ForwardToKMsg=no
ForwardToConsole=no
ForwardToWall=yes
TTYPath=/dev/console
MaxLevelStore=debug
MaxLevelSyslog=debug
MaxLevelKMsg=notice
MaxLevelConsole=info
MaxLevelWall=emerg
```

```bash
# Apply changes
systemctl restart systemd-journald
```

### Viewing Logs

```bash
# All logs
journalctl

# Follow live
journalctl -f

# Since boot
journalctl -b
journalctl -b -1   # Previous boot
journalctl -b -2   # Two boots ago

# Since timestamp
journalctl --since "2024-01-01 10:00:00"
journalctl --since "1 hour ago"
journalctl --since "yesterday"
journalctl --until "2024-01-01 12:00:00"

# By unit
journalctl -u nginx
journalctl -u nginx -f

# By priority
journalctl -p err
journalctl -p 0..3  # emerg to err
journalctl -p 3     # errors only

# By PID
journalctl _PID=1234

# By executable
journalctl /usr/bin/nginx

# Kernel messages only
journalctl -k
journalctl -k -b -1

# Specific fields
journalctl _SYSTEMD_UNIT=nginx.service _PID=1234

# Output formats
journalctl -o json
journalctl -o json-pretty
journalctl -o short-iso
journalctl -o cat
journalctl -o export

# Reverse order
journalctl -r

# Number of lines
journalctl -n 100
journalctl -n 100 -u nginx

# Disk usage
journalctl --disk-usage

# Vacuum (clean old logs)
journalctl --vacuum-time=2weeks
journalctl --vacuum-size=1G
journalctl --vacuum-files=50
```

### Field Filtering

```bash
# List all fields
journalctl -F _SYSTEMD_UNIT
journalctl -F _COMM
journalctl -F PRIORITY

# Filter by field
journalctl _SYSTEMD_UNIT=nginx.service
journalctl _COMM=nginx
journalctl _UID=0
journalctl _GID=0
journalctl _CAP_EFFECTIVE=1

# Multiple values (OR)
journalctl _SYSTEMD_UNIT=nginx.service + _SYSTEMD_UNIT=apache2.service

# Field=value with pattern
journalctl _COMM=nginx _PID=1234

# Invert match
journalctl _COMM!=systemd
```

### Persistent Storage

```bash
# Create directory
mkdir -p /var/log/journal
systemd-tmpfiles --create --prefix /var/log/journal

# Set permissions
chown root:systemd-journal /var/log/journal
chmod 2755 /var/log/journal

# Verify
journalctl --disk-usage
```

### Forwarding to Syslog

```ini
# /etc/systemd/journald.conf
ForwardToSyslog=yes
```

```bash
# Restart both
systemctl restart systemd-journald rsyslog
```

## rsyslog

### Configuration

```conf
# /etc/rsyslog.conf or /etc/rsyslog.d/*.conf

# Modules
module(load="imuxsock")   # Local syslog
module(load="imklog")     # Kernel logs
module(load="imjournal")  # systemd journal

# Templates
template(name="PreciseFormat" type="string"
  string="%TIMESTAMP:::date-rfc3339% %HOSTNAME% %syslogtag%%msg:::sp-if-no-1st-sp%%msg:::drop-last-lf%\n"
)

template(name="JSONFormat" type="list") {
  property(name="timestamp" dateFormat="rfc3339")
  property(name="hostname")
  property(name="syslogtag")
  property(name="msg")
}

# Rules
# Kernels
kern.*                                                 /var/log/kern.log

# Auth
auth.*,authpriv.*                                      /var/log/auth.log

# Mail
mail.*                                                 /var/log/mail.log

# Cron
cron.*                                                 /var/log/cron.log

# All messages
*.*                                                    /var/log/syslog

# Emergency
*.emerg                                                :omusrmsg:*

# Forward to remote
# *.* @@logserver.example.com:514

# Structured logging to file
*.*                                                    /var/log/syslog-json;JSONFormat

# Discard debug
*.=debug                                               stop
```

### High-Performance Config

```conf
# /etc/rsyslog.d/high-performance.conf

# Async writing
$ActionQueueType LinkedList
$ActionQueueFileName rsyslog_queue
$ActionQueueMaxDiskSpace 1g
$ActionQueueSaveOnShutdown on
$ActionResumeRetryCount -1

# Batch writing
$ActionQueueBatchSize 1000
$ActionQueueTimeoutEnqueue 10
$ActionQueueWorkerThreads 4

# Compression
$ActionQueueCompress on
```

### Remote Logging

```conf
# Client: /etc/rsyslog.d/remote.conf
*.* @@logserver.example.com:514
# Or with TLS
*.* @@(o)logserver.example.com:6514

# Server: /etc/rsyslog.d/remote-server.conf
module(load="imtcp")
input(type="imtcp" port="514")
# TLS
module(load="imtcp" StreamDriver.Name="gtls" StreamDriver.Mode="1" StreamDriver.AuthMode="anon")
input(type="imtcp" port="6514" StreamDriver.Name="gtls" StreamDriver.Mode="1" StreamDriver.AuthMode="anon")

# Template for per-host logs
template(name="RemoteHost" type="string" string="/var/log/remote/%HOSTNAME%/%$YEAR%$MONTH%$DAY%.log")
*.* ?RemoteHost
```

### Filtering

```conf
# Property-based filters
:msg, contains, "error"    /var/log/errors.log
:msg, !contains, "debug"   /var/log/no-debug.log
:programname, isequal, "nginx"  /var/log/nginx.log
:syslogfacility, isequal, "local0"  /var/log/local0.log

# Expression-based filters (RainerScript)
if $msg contains "error" then /var/log/errors.log
if $programname == "nginx" and $msg contains "error" then /var/log/nginx-errors.log
if $syslogfacility-text == "local0" then /var/log/local0.log
```

## logrotate

### Configuration

```conf
# /etc/logrotate.conf
weekly
rotate 4
create
dateext
dateformat -%Y-%m-%d
compress
delaycompress
missingok
notifempty
sharedscripts
postrotate
    /usr/lib/rsyslog/rsyslog-rotate
endscript

include /etc/logrotate.d
```

### Application Configs

```conf
# /etc/logrotate.d/nginx
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/log/nginx.pid`
    endscript
}

# /etc/logrotate.d/postgresql
/var/log/postgresql/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 postgres postgres
    sharedscripts
    postrotate
        /usr/bin/pg_ctl reload > /dev/null 2>&1 || true
    endscript
}

# /etc/logrotate.d/docker
/var/lib/docker/containers/*/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
    maxsize 100M
}

# /etc/logrotate.d/syslog
/var/log/syslog
/var/log/auth.log
/var/log/kern.log
/var/log/mail.log
/var/log/cron.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root adm
    sharedscripts
    postrotate
        /usr/lib/rsyslog/rsyslog-rotate
    endscript
}

# /etc/logrotate.d/journald (if not using persistent journal)
/var/log/journal/*/*.journal {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 root systemd-journal
    su root systemd-journal
}
```

### Common Options

| Option | Description |
|--------|-------------|
| `daily/weekly/monthly/yearly` | Rotation frequency |
| `rotate N` | Keep N rotated logs |
| `size N` | Rotate when size > N (e.g., `size 100M`) |
| `maxsize N` | Rotate when size > N (with time) |
| `minsize N` | Don't rotate if smaller than N |
| `compress` | Compress rotated logs |
| `delaycompress` | Compress on next rotation |
| `nocompress` | Don't compress |
| `compresscmd` | Compression command (default: gzip) |
| `compressext` | Extension for compressed (default: .gz) |
| `create mode owner group` | Create new log file |
| `nocreate` | Don't create new log |
| `copytruncate` | Copy then truncate (for apps that don't reopen) |
| `nocopytruncate` | Move file (default) |
| `missingok` | No error if log missing |
| `nomissingok` | Error if missing |
| `notifempty` | Don't rotate empty logs |
| `ifempty` | Rotate even if empty |
| `dateext` | Use date extension |
| `dateformat` | Date format (strftime) |
| `extension` | Keep extension after rotation |
| `olddir` | Move rotated logs to directory |
| `sharedscripts` | Run scripts once for all logs |
| `postrotate/endscript` | Script after rotation |
| `prerotate/endscript` | Script before rotation |
| `firstaction/endscript` | Before all rotations |
| `lastaction/endscript` | After all rotations |
| `mail address` | Mail rotated logs |
| `nomail` | Don't mail |

### Testing & Debugging

```bash
# Test config (dry run)
logrotate -d /etc/logrotate.conf

# Force rotation
logrotate -f /etc/logrotate.conf

# Debug specific config
logrotate -d /etc/logrotate.d/nginx

# View status
cat /var/lib/logrotate/status

# Manual rotation
logrotate -f /etc/logrotate.d/nginx
```

## Structured Logging

### JSON Logging with rsyslog

```conf
# /etc/rsyslog.d/json.conf
template(name="json" type="list") {
  constant(value="{")
  constant(value="\"timestamp\":\"") property(name="timereported" dateFormat="rfc3339") constant(value="\",")
  constant(value="\"host\":\"") property(name="hostname") constant(value="\",")
  constant(value="\"severity\":") property(name="syslogseverity") constant(value=",")
  constant(value="\"facility\":") property(name="syslogfacility") constant(value=",")
  constant(value="\"program\":\"") property(name="programname") constant(value="\",")
  constant(value="\"message\":\"") property(name="msg") constant(value="\"")
  constant(value="}\n")
}

*.* /var/log/syslog.json;json
```

### systemd Journal Fields

```bash
# Common fields
_MESSAGE=              # Log message
_PRIORITY=             # Syslog priority (0-7)
_FACILITY=             # Syslog facility (0-23)
_SYSLOG_FACILITY=      # Text facility
_SYSLOG_IDENTIFIER=    # Program name
_PID=                  # Process ID
_UID=                  # User ID
_GID=                  # Group ID
_COMM=                 # Command name
_EXE=                  # Executable path
_CMDLINE=              # Command line
_SYSTEMD_UNIT=         # Systemd unit
_SYSTEMD_CGROUP=       # Control group
_SYSTEMD_SLICE=        # Slice unit
_BOOT_ID=              # Boot ID
_MACHINE_ID=           # Machine ID
_HOSTNAME=             # Hostname
_TRANSPORT=            # Transport (journal, syslog, kernel, etc.)
_AUDIT_LOGINUID=       # Audit login UID
_AUDIT_SESSION=        # Audit session
_SELINUX_CONTEXT=      # SELinux context
_CAP_EFFECTIVE=        # Effective capabilities
_SYSTEMD_OWNER_UID=    # Owner UID
_SYSTEMD_INVOCATION_ID=# Invocation ID
```

### Querying Structured Logs

```bash
# JSON output for parsing
journalctl -o json -u nginx | jq 'select(.PRIORITY <= 3)'

# Filter by custom field
journalctl _MY_APP_FIELD=value

# Export for analysis
journalctl -o json > logs.json
journalctl -o json-pretty > logs.json
```

## Log Analysis Tools

```bash
# journalctl
journalctl -u nginx --since "1 hour ago" -o json | jq -r '.MESSAGE' | sort | uniq -c | sort -rn

# grep journals
journalctl -u nginx -g "error" --since "1 hour ago"

# awk/sed
journalctl -u nginx -o cat | awk '/error/ {print $0}'

# goaccess (web log analyzer)
goaccess /var/log/nginx/access.log --log-format=COMBINED -o report.html

# lnav (log navigator)
lnav /var/log/syslog /var/log/nginx/*.log

# grep with context
journalctl -u nginx -g "error" -n 50 --since "1 hour ago"
```

## Centralized Logging

### rsyslog → Elasticsearch

```conf
# /etc/rsyslog.d/elasticsearch.conf
module(load="omelasticsearch")

template(name="json-template" type="list") {
  constant(value="{")
  constant(value="\"@timestamp\":\"") property(name="timereported" dateFormat="rfc3339") constant(value="\",")
  constant(value="\"host\":\"") property(name="hostname") constant(value="\",")
  constant(value="\"severity\":") property(name="syslogseverity") constant(value=",")
  constant(value="\"facility\":") property(name="syslogfacility") constant(value=",")
  constant(value="\"program\":\"") property(name="programname") constant(value="\",")
  constant(value="\"message\":\"") property(name="msg") constant(value="\"")
  constant(value="}")
}

*.* action(
  type="omelasticsearch"
  server="elasticsearch.example.com"
  serverport="9200"
  template="json-template"
  searchIndex="syslog"
  dynSearchIndex="on"
  bulkmode="on"
  queue.type="linkedlist"
  queue.size="10000"
  queue.dequeuebatchsize="1000"
)
```

### journald → Loki (Grafana)

```yaml
# promtail-config.yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: journal
    journal:
      max_age: 12h
      labels:
        job: systemd-journal
      path: /var/log/journal
    relabel_configs:
      - source_labels: ['__journal__systemd_unit']
        target_label: 'unit'
      - source_labels: ['__journal__hostname']
        target_label: 'host'
```

## Log Rotation Best Practices

| Scenario | Rotation | Retain | Compression |
|----------|----------|--------|-------------|
| High-traffic web | daily/size 100M | 30-90 days | yes (delaycompress) |
| Database logs | daily | 30 days | yes |
| System logs (syslog) | daily | 14 days | yes |
| Auth logs | daily | 90 days | yes |
| Audit logs | daily | 1 year+ | yes |
| Docker containers | size 100M | 7 days | yes |
| Application (low volume) | weekly | 52 weeks | yes |
| Debug/trace logs | size 50M | 3-7 days | yes |

## Troubleshooting

```bash
# Check if logs are rotating
ls -la /var/log/nginx/

# Check logrotate status
cat /var/lib/logrotate/status

# Test journalctl persistence
journalctl --disk-usage
ls -la /var/log/journal/

# Check rsyslog status
systemctl status rsyslog
rsyslogd -N1  # Test config

# Check for dropped
rsyslogd -n -d  # Debug mode
```