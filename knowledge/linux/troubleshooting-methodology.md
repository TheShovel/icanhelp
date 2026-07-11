# Linux Troubleshooting Methodology

## General Approach

### 1. Define the Problem
- What are the symptoms?
- When did it start?
- What changed recently?
- Can you reproduce it?
- What's the impact?

### 2. Gather Information
```bash
# System info
uname -a
cat /etc/os-release
uptime
who -b

# Resource usage
top / htop / btop
free -h
df -h
iostat -xz 1
vmstat 1

# Logs
journalctl -xe
journalctl -u service-name -f
dmesg -T
tail -f /var/log/syslog
tail -f /var/log/messages

# Network
ss -tulnp
ip addr show
ip route show
ping -c 3 8.8.8.8
```

### 3. Form Hypothesis
- Use binary search / divide and conquer
- Check recent changes first
- Eliminate variables

### 4. Test Hypothesis
- Make one change at a time
- Document what you tried
- Have rollback plan

### 5. Implement Fix
- Apply fix
- Verify resolution
- Monitor for regression

### 6. Document
- Root cause
- Resolution
- Prevention

## Common Issue Categories

### Boot Issues
```bash
# GRUB
grub2-mkconfig -o /boot/grub2/grub.cfg
grub2-install /dev/sda

# Initramfs
dracut -f
mkinitcpio -P

# systemd
systemctl default
systemctl isolate multi-user.target
systemctl isolate graphical.target

# Emergency shell
# Kernel param: systemd.unit=emergency.target
# Or: rd.break

# Check failed units
systemctl --failed
systemctl list-units --state=failed

# Journal from previous boot
journalctl -b -1 -p err
```

### Network Connectivity
```bash
# Layer 1: Physical
ethtool eth0
ip link show eth0

# Layer 2: Data Link
ip neighbor show
bridge link show

# Layer 3: Network
ip route show
ip route get 8.8.8.8
traceroute 8.8.8.8
mtr 8.8.8.8

# Layer 4: Transport
ss -tulnp
nc -zv host port
telnet host port

# DNS
dig example.com
dig @8.8.8.8 example.com
getent hosts example.com
systemctl status systemd-resolved

# Firewall
iptables -L -n -v
nft list ruleset
firewall-cmd --list-all
ufw status verbose

# Capture
tcpdump -i eth0 -nn -s0 -w capture.pcap port 80
```

### Disk Space Issues
```bash
# Find large files
du -h / | sort -hr | head -20
find / -xdev -type f -size +100M -exec ls -lh {} \;

# Find deleted but open files
lsof +L1
lsof | grep deleted

# Inode exhaustion
df -i

# Clean package cache
apt clean
dnf clean all
pacman -Sc
journalctl --vacuum-time=30d

# Docker
docker system prune -a
docker image prune -a

# Logs
find /var/log -type f -name "*.log" -exec truncate -s 0 {} \;
```

### Memory Issues
```bash
# Check usage
free -h
cat /proc/meminfo

# Find memory hogs
ps aux --sort=-%mem | head
smem -r

# OOM killer
dmesg -T | grep -i "out of memory"
journalctl -k | grep -i oom

# Swap
swapon --show
cat /proc/sys/vm/swappiness

# Memory leaks
valgrind --leak-check=full ./program
heaptrack ./program
```

### CPU Issues
```bash
# Top consumers
top -c
htop
pidstat 1

# Per-process
pidstat -u -p PID 1
perf top -p PID
strace -p PID -c

# System-wide
mpstat -P ALL 1
perf record -a -g -- sleep 30
perf report

# Interrupts
cat /proc/interrupts
watch -n1 cat /proc/interrupts
```

### Process Issues
```bash
# Stuck process
ps aux | grep D
# D state = uninterruptible sleep (usually I/O)

# Zombie process
ps aux | grep Z
# Kill parent to reap zombie

# High CPU
pidstat 1
perf top

# Memory growth
pidstat -r 1
pmap -x PID

# File descriptors
lsof -p PID
ls -l /proc/PID/fd/

# Threads
ps -eLf | grep PID
top -H -p PID
```

### Service Issues
```bash
# Status
systemctl status service
systemctl is-active service
systemctl is-enabled service

# Logs
journalctl -u service -f
journalctl -u service --since "1 hour ago"
journalctl -u service -n 100

# Debug
systemctl cat service
systemctl show service
systemd-analyze verify service

# Dependencies
systemctl list-dependencies service
systemctl list-dependencies --reverse service

# Restart
systemctl restart service
systemctl reload service
systemctl daemon-reload
```

### Permission Issues
```bash
# Check permissions
ls -la /path
stat /path
getfacl /path

# SELinux
getenforce
ausearch -m avc -ts recent
sealert -a /var/log/audit/audit.log
setenforce 0  # Temporary disable

# AppArmor
aa-status
dmesg -T | grep apparmor

# Capabilities
getcap /path/to/binary
setcap cap_net_bind_service=+ep /path/to/binary

# sudo
sudo -l
visudo
```

## Performance Troubleshooting

### USE Method (Utilization, Saturation, Errors)
```bash
# CPU
Utilization: mpstat 1, vmstat 1
Saturation: vmstat 1 (r column > CPU count)
Errors: dmesg | grep -i cpu

# Memory
Utilization: free -h
Saturation: vmstat 1 (si/so columns), swap usage
Errors: dmesg | grep -i memory

# Disk
Utilization: iostat -xz 1 (%util)
Saturation: iostat -xz 1 (await, aqu-sz)
Errors: smartctl -a /dev/sda, dmesg | grep -i disk

# Network
Utilization: sar -n DEV 1
Saturation: netstat -s | grep -i "segments retransmitted"
Errors: ethtool -S eth0 | grep -i error
```

### BPF Tools (Modern)
```bash
# Install bcc-tools / bpftrace

# CPU
profile-bpfcc
cpuwalk-bpfcc

# Memory
memleak-bpfcc
oomkill-bpfcc

# Disk
biolatency-bpfcc
biosnoop-bpfcc

# Network
tcplife-bpfcc
tcpconnect-bpfcc
tcpretrans-bpfcc

# File opens
opensnoop-bpfcc
```

### Flame Graphs
```bash
# CPU
perf record -F 99 -a -g -- sleep 30
perf script | stackcollapse-perf.pl | flamegraph.pl > cpu.svg

# Off-CPU
perf record -e sched:sched_switch -a -g -- sleep 30
perf script | stackcollapse-perf.pl | flamegraph.pl > offcpu.svg
```

## Specific Scenarios

### "Server is Slow"
```bash
# 1. Check load
uptime
top

# 2. Check resources
free -h
df -h
iostat -xz 1

# 3. Check network
ss -tulnp
netstat -s

# 4. Check logs
journalctl -p err -n 50
dmesg -T | tail -20

# 5. Check processes
ps aux --sort=-%cpu | head
ps aux --sort=-%mem | head
```

### "Website Down"
```bash
# 1. Local check
curl -I http://localhost
curl -I https://domain.com

# 2. DNS
dig domain.com
dig @8.8.8.8 domain.com

# 3. Port
nc -zv domain.com 443
telnet domain.com 80

# 4. Service
systemctl status nginx
systemctl status php-fpm

# 5. Upstream
curl -I http://backend:8080

# 6. Logs
tail -f /var/log/nginx/error.log
journalctl -u nginx -f
```

### "Database Slow"
```bash
# 1. Connections
SELECT count(*) FROM pg_stat_activity;

# 2. Long queries
SELECT * FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '30 seconds';

# 3. Locks
SELECT * FROM pg_locks WHERE NOT granted;

# 4. Index usage
SELECT * FROM pg_stat_user_tables WHERE idx_scan = 0;

# 5. Table bloat
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size DESC;
```

### "Can't SSH"
```bash
# 1. Port
nc -zv host 22
telnet host 22

# 2. Service
systemctl status sshd

# 3. Config
sshd -T | grep -i permit
cat /etc/ssh/sshd_config | grep -v ^#

# 4. Logs
journalctl -u sshd -f
tail -f /var/log/auth.log

# 5. Keys
ssh -vvv host
ssh -i ~/.ssh/id_rsa host

# 6. Firewall
iptables -L -n | grep 22
firewall-cmd --list-all
```

### "SSL Certificate Issues"
```bash
# Check cert
openssl s_client -connect domain.com:443 -servername domain.com
openssl x509 -in cert.pem -text -noout

# Check expiration
openssl x509 -in cert.pem -noout -dates

# Check chain
openssl s_client -connect domain.com:443 -showcerts

# Verify
openssl verify -CAfile ca.pem cert.pem

# Common issues
# - Expired cert
# - Wrong hostname (SAN)
# - Missing intermediate
# - Self-signed
# - Weak cipher
```

## Debugging Tools Cheatsheet

| Tool | Purpose |
|------|---------|
| `strace` | System calls |
| `ltrace` | Library calls |
| `gdb` | Debugger |
| `perf` | Profiling |
| `bpftrace` | eBPF tracing |
| `tcpdump` | Packet capture |
| `wireshark` | Packet analysis |
| `lsof` | Open files |
| `ss` | Socket statistics |
| `iotop` | I/O per process |
| `nethogs` | Network per process |
| `htop` | Interactive process viewer |
| `dstat` | System statistics |
| `sar` | Historical statistics |
| `vmstat` | Virtual memory stats |
| `iostat` | I/O statistics |
| `mpstat` | CPU statistics |
| `pidstat` | Per-process stats |
| `numastat` | NUMA statistics |

## Runbooks Template

```markdown
# Runbook: [Service Name] - [Issue Type]

## Symptoms
- [Observable behavior]

## Diagnosis Steps
1. [Command to run]
   Expected: [normal output]
   Alert if: [abnormal output]

2. [Next step]

## Resolution
### Option 1: [Quick fix]
```bash
command to fix
```

### Option 2: [Full fix]
```bash
steps
```

## Verification
- [How to confirm fix worked]

## Escalation
- [When to escalate]
- [Contact info]

## Prevention
- [Monitoring alerts to add]
- [Process changes]
```