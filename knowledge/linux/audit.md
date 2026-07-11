# Linux Audit System (auditd)

## Overview

The Linux Audit system tracks security-relevant events: system calls, file access, user actions, network connections, and more.

## Installation

```bash
# Ubuntu/Debian
apt install auditd audispd-plugins

# Fedora/RHEL
dnf install audit audit-libs

# Arch
pacman -S audit
```

## Configuration

### Main Config

```ini
# /etc/audit/auditd.conf
log_file = /var/log/audit/audit.log
log_format = RAW
log_group = root
priority_boost = 4
flush = INCREMENTAL_ASYNC
freq = 50
num_logs = 5
disp_qos = lossy
dispatcher = /sbin/audispd
name_format = NONE
max_log_file = 100
max_log_file_action = ROTATE
space_left = 75
space_left_action = SYSLOG
action_mail_acct = root
admin_space_left = 50
admin_space_left_action = SUSPEND
disk_full_action = SUSPEND
disk_error_action = SUSPEND
use_libwrap = yes
tcp_listen_port = 60
tcp_listen_queue = 5
tcp_max_per_addr = 1
tcp_client_max_idle = 0
enable_krb5 = no
krb5_principal = auditd
distribute_network = no
q_depth = 8192
overflow_action = SYSLOG
max_restarts = 10
plugin_dir = /etc/audit/plugins.d
end_of_event_timeout = 2.0
```

### Rules Directory

```bash
# /etc/audit/rules.d/
# Files processed in lexical order
10-base-config.rules
20-file-access.rules
30-system-calls.rules
40-privilege.rules
50-network.rules
90-finalize.rules
```

## Rule Syntax

### Basic Rules

```bash
# /etc/audit/rules.d/10-base-config.rules

# Delete all existing rules
-D

# Buffer size (kernel)
-b 8192

# Failure mode: 0=silent, 1=printk, 2=panic
-f 1

# Rate limit (messages/sec)
-r 100

# Ignore errors
--ignore-errors
```

### File/Directory Watching

```bash
# /etc/audit/rules.d/20-file-access.rules

# Watch file for all access
-w /etc/passwd -p wa -k passwd_changes
-w /etc/shadow -p wa -k shadow_changes
-w /etc/group -p wa -k group_changes
-w /etc/sudoers -p wa -k sudoers_changes
-w /etc/ssh/sshd_config -p wa -k sshd_config

# Watch directory recursively
-w /etc/ -p wa -k etc_changes
-w /bin/ -p wa -k bin_changes
-w /sbin/ -p wa -k sbin_changes
-w /usr/bin/ -p wa -k usrbin_changes
-w /usr/sbin/ -p wa -k usrsbin_changes

# Watch for specific actions
# p = permissions filter: r=read, w=write, x=execute, a=attribute change
-w /var/log/audit/ -p wa -k audit_log_changes
```

### System Call Rules

```bash
# /etc/audit/rules.d/30-system-calls.rules

# Architecture: b32 (32-bit), b64 (64-bit)
# Always specify both for compatibility

# File permission changes
-a always,exit -F arch=b64 -S chmod -S fchmod -S fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_mod
-a always,exit -F arch=b32 -S chmod -S fchmod -S fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_mod

# File ownership changes
-a always,exit -F arch=b64 -S chown -S fchown -S fchownat -S lchown -F auid>=1000 -F auid!=4294967295 -k perm_mod
-a always,exit -F arch=b32 -S chown -S fchown -S fchownat -S lchown -F auid>=1000 -F auid!=4294967295 -k perm_mod

# Extended attribute changes
-a always,exit -F arch=b64 -S setxattr -S lsetxattr -S fsetxattr -S removexattr -S lremovexattr -S fremovexattr -F auid>=1000 -F auid!=4294967295 -k perm_mod
-a always,exit -F arch=b32 -S setxattr -S lsetxattr -S fsetxattr -S removexattr -S lremovexattr -S fremovexattr -F auid>=1000 -F auid!=4294967295 -k perm_mod

# Mount/unmount
-a always,exit -F arch=b64 -S mount -S umount2 -F auid>=1000 -F auid!=4294967295 -k mounts
-a always,exit -F arch=b32 -S mount -S umount -S umount2 -F auid>=1000 -F auid!=4294967295 -k mounts

# Delete/rename
-a always,exit -F arch=b64 -S unlink -S unlinkat -S rename -S renameat -F auid>=1000 -F auid!=4294967295 -k delete
-a always,exit -F arch=b32 -S unlink -S unlinkat -S rename -S renameat -F auid>=1000 -F auid!=4294967295 -k delete

# Time changes
-a always,exit -F arch=b64 -S adjtimex -S settimeofday -S clock_settime -k time_change
-a always,exit -F arch=b32 -S adjtimex -S settimeofday -S clock_settime -k time_change
-a always,exit -F arch=b64 -S stime -k time_change
-a always,exit -F arch=b32 -S stime -k time_change

# Module loading
-a always,exit -F arch=b64 -S init_module -S delete_module -k modules
-a always,exit -F arch=b32 -S init_module -S delete_module -k modules

# Privilege escalation
-a always,exit -F arch=b64 -S setuid -S setgid -S setreuid -S setregid -F auid>=1000 -F auid!=4294967295 -k priv_esc
-a always,exit -F arch=b32 -S setuid -S setgid -S setreuid -S setregid -F auid>=1000 -F auid!=4294967295 -k priv_esc

# Sudo/su
-a always,exit -F arch=b64 -S execve -F uid=0 -F auid>=1000 -F auid!=4294967295 -k sudo_exec
-a always,exit -F arch=b32 -S execve -F uid=0 -F auid>=1000 -F auid!=4294967295 -k sudo_exec
```

### Network Rules

```bash
# /etc/audit/rules.d/50-network.rules

# Network configuration changes
-a always,exit -F arch=b64 -S sethostname -S setdomainname -k network_mod
-a always,exit -F arch=b32 -S sethostname -S setdomainname -k network_mod

# Socket operations (can be noisy)
# -a always,exit -F arch=b64 -S socket -S bind -S connect -k network_access
# -a always,exit -F arch=b32 -S socket -S bind -S connect -k network_access

# Firewall changes
-w /etc/firewalld/ -p wa -k firewall_changes
-w /etc/iptables/ -p wa -k firewall_changes
-w /etc/nftables/ -p wa -k firewall_changes
```

### Privilege/Identity Rules

```bash
# /etc/audit/rules.d/40-privilege.rules

# User login/logout
-w /var/log/lastlog -p wa -k logins
-w /var/log/faillock -p wa -k logins

# Authentication
-w /etc/pam.d/ -p wa -k pam_changes
-w /etc/security/ -p wa -k security_changes

# Sudoers
-w /etc/sudoers -p wa -k sudo_changes
-w /etc/sudoers.d/ -p wa -k sudo_changes

# Cron/at
-w /etc/cron.allow -p wa -k cron_changes
-w /etc/cron.deny -p wa -k cron_changes
-w /etc/at.allow -p wa -k cron_changes
-w /etc/at.deny -p wa -k cron_changes

# SSH keys
-w /root/.ssh/ -p wa -k ssh_keys
-w /home/*/.ssh/ -p wa -k ssh_keys

# Passwd/group changes
-w /etc/passwd -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/gshadow -p wa -k identity
```

### Kernel Rules

```bash
# /etc/audit/rules.d/30-kernel.rules

# Kernel parameter changes
-w /proc/sys/ -p wa -k kernel_param

# Kernel module parameters
-w /sys/module/ -p wa -k kernel_module

# Capability changes
-a always,exit -F arch=b64 -S capset -k capabilities
-a always,exit -F arch=b32 -S capset -k capabilities
```

### Immutable Mode

```bash
# /etc/audit/rules.d/90-finalize.rules

# Make configuration immutable (requires reboot to change)
-e 2

# Or just require root to change (can be changed at runtime)
# -e 1
```

## Managing Rules

```bash
# Load rules from directory
augenrules --load

# Check if rules loaded
auditctl -l

# Show current rules with line numbers
auditctl -l -k

# Add rule at runtime (not persistent)
auditctl -w /etc/passwd -p wa -k passwd

# Remove rule at runtime
auditctl -W /etc/passwd -p wa -k passwd

# Delete all rules
auditctl -D

# Set buffer size
auditctl -b 8192

# Set failure mode
auditctl -f 1

# Set rate limit
auditctl -r 100

# Check status
auditctl -s
```

## Querying Logs

### ausearch

```bash
# All events
ausearch -i

# By key
ausearch -k passwd_changes -i

# By time
ausearch -ts today -i
ausearch -ts 01/15/2024 -te 01/16/2024 -i
ausearch -ts "1 hour ago" -i

# By user
ausearch -ui 1000 -i

# By executable
ausearch -x /usr/bin/passwd -i

# By syscall
ausearch -sc chmod -i

# By success/failure
ausearch --success yes -i
ausearch --success no -i

# By PID
ausearch -p 1234 -i

# By terminal
ausearch -tt pts/0 -i

# By host
ausearch -hn hostname -i

# Follow (like tail -f)
ausearch -c -i

# Raw output (for parsing)
ausearch -k passwd_changes --raw | aureport -f -i

# Limit results
ausearch -k passwd_changes -i -l 100
```

### aureport

```bash
# Summary report
aureport -i

# File access report
aureport -f -i

# Syscall report
aureport -s -i

# User report
aureport -u -i

# Login report
aureport -l -i

# Failed events
aureport --failed -i

# Executable report
aureport -x -i

# Host report
aureport -h -i

# Time range
aureport -ts today -i
aureport -ts 01/15/2024 -te 01/16/2024 -i

# Key-based report
aureport -k -i

# Rule-based report
aureport -r -i

# Summary with column formatting
aureport -f -i --summary
aureport -s -i --summary
```

### ausearch + aureport Pipeline

```bash
# File access by user
ausearch -ui 1000 --raw | aureport -f -i

# Failed syscalls
ausearch --success no --raw | aureport -s -i

# Events for specific key
ausearch -k perm_mod --raw | aureport -s -i
```

## Understanding Audit Records

### Record Format

```
type=SYSCALL msg=audit(1705315200.123:456): arch=c000003e syscall=2 success=yes exit=3 a0=7ffd12345678 a1=941 a2=1b6 a3=0 items=2 ppid=1234 pid=5678 auid=1000 uid=1000 gid=1000 euid=1000 suid=1000 fsuid=1000 egid=1000 sgid=1000 fsgid=1000 tty=pts0 ses=1 comm="cat" exe="/usr/bin/cat" key="passwd_changes"
type=PATH msg=audit(1705315200.123:456): item=0 name="/etc/passwd" inode=12345 dev=fc:00 mode=0100644 ouid=0 ogid=0 rdev=00:00 obj=system_u:object_r:etc_t:s0 objtype=NORMAL cap_fp=0 cap_fi=0 cap_fe=0 cap_fver=0
type=PATH msg=audit(1705315200.123:456): item=1 name="/etc/" inode=12 dev=fc:00 mode=040755 ouid=0 ogid=0 rdev=00:00 obj=system_u:object_r:etc_t:s0 objtype=PARENT cap_fp=0 cap_fi=0 cap_fe=0 cap_fver=0
```

### Key Fields

| Field | Description |
|-------|-------------|
| `type` | Record type (SYSCALL, PATH, CWD, PROCTITLE, etc.) |
| `msg=audit(time:id)` | Timestamp and event ID |
| `arch` | Architecture (c000003e = x86_64) |
| `syscall` | Syscall number (2 = open) |
| `success` | yes/no |
| `exit` | Return value (fd or errno) |
| `a0-a3` | Syscall arguments |
| `items` | Number of PATH records |
| `ppid/pid` | Parent/process ID |
| `auid` | Audit UID (login UID, immutable) |
| `uid/gid/euid/suid/fsuid/egid/sgid/fsgid` | Various UIDs/GIDs |
| `tty` | Controlling terminal |
| `ses` | Session ID |
| `comm` | Command name (truncated) |
| `exe` | Executable path |
| `key` | Rule key |
| `name` | Path (in PATH records) |
| `inode` | Inode number |
| `mode` | File mode |
| `obj` | SELinux context |

### Syscall Numbers (x86_64)

```
0  read          1  write         2  open          3  close
4  stat          5  fstat         6  lstat         7  poll
8  lseek         9  mmap         10 mprotect      11 munmap
12 brk          13 rt_sigaction  14 rt_sigprocmask 15 rt_sigreturn
16 ioctl        17 pread64       18 pwrite64      19 readv
20 writev       21 access        22 pipe          23 select
24 sched_yield  25 mremap        26 msync         27 mincore
28 madvise      29 shmget        30 shmat         31 shmctl
32 dup          33 dup2          34 pause         35 nanosleep
36 getitimer    37 alarm         38 setitimer     39 getpid
40 sendfile     41 socket        42 connect       43 accept
44 sendto       45 recvfrom      46 sendmsg       47 recvmsg
48 shutdown     49 bind          50 listen        51 getsockname
52 getpeername  53 socketpair    54 setsockopt    55 getsockopt
56 clone        57 fork          58 vfork         59 execve
60 exit         61 wait4         62 kill          63 uname
64 semget       65 semop         66 semctl        67 shmdt
68 msgget       69 msgsnd        70 msgrcv        71 msgctl
72 fcntl        73 flock         74 fsync         75 fdatasync
76 truncate     77 ftruncate     78 getdents      79 getcwd
80 chdir        81 fchdir        82 rename        83 mkdir
84 rmdir        85 creat         86 link          87 unlink
88 symlink      89 readlink      90 chmod         91 fchmod
92 chown        93 fchown        94 lchown        95 umask
96 gettimeofday 97 getrlimit     98 getrusage     99 sysinfo
100 times       101 ptrace       102 getuid        103 syslog
104 getgid      105 setuid        106 setgid        107 geteuid
108 getegid     109 setpgid      110 getppid      111 getpgrp
112 setsid      113 setreuid     114 setregid     115 getgroups
116 setgroups   117 init_module  118 delete_module 119 quotactl
120 setfsuid    121 setfsgid     122 getfsuid     123 getfsgid
124 getsid      125 capget       126 capset       127 rt_sigpending
128 rt_sigtimedwait 129 rt_sigqueueinfo 130 rt_sigsuspend 131 sigaltstack
132 utime       133 mknod        134 uselib       135 personality
136 ustat       137 statfs       138 fstatfs      139 sysfs
140 getpriority 141 setpriority  142 sched_setparam 143 sched_getparam
144 sched_setscheduler 145 sched_getscheduler 146 sched_get_priority_max 147 sched_get_priority_min
148 sched_rr_get_interval 149 mlock 150 munlock 151 mlockall
152 munlockall  153 vhangup      154 modify_ldt   155 pivot_root
156 _sysctl     157 prctl        158 arch_prctl   159 adjtimex
160 setrlimit   161 chroot       162 sync         163 acct
164 settimeofday 165 mount       166 umount2      167 swapon
168 swapoff     169 reboot       170 sethostname  171 setdomainname
172 iopl        173 ioperm       174 create_module 175 init_module
176 delete_module 177 get_kernel_syms 178 query_module 179 quotactl
180 nfsservctl  181 getpmsg      182 putpmsg      183 afs_syscall
184 tuxcall     185 security     186 gettid       187 readahead
188 setxattr    189 lsetxattr    190 fsetxattr    191 getxattr
192 lgetxattr   193 fgetxattr    194 listxattr    195 llistxattr
196 flistxattr  197 removexattr  198 lremovexattr 199 fremovexattr
200 tkill       201 time         202 futex        203 sched_setaffinity
204 sched_getaffinity 205 set_thread_area 206 io_setup 207 io_destroy
208 io_getevents 209 io_submit   210 io_cancel    211 exit_group
212 epoll_create 213 epoll_ctl   214 epoll_wait   215 remap_file_pages
216 set_tid_address 217 restart_syscall 218 semtimedop 219 fadvise64
220 timer_create 221 timer_settime 222 timer_gettime 223 timer_getoverrun
224 timer_delete 225 clock_settime 226 clock_gettime 227 clock_getres
228 clock_nanosleep 229 exit_group 230 epoll_wait 231 epoll_ctl
232 tgkill      233 utimes       234 vserver      235 mbind
236 set_mempolicy 237 get_mempolicy 238 mq_open     239 mq_unlink
240 mq_timedsend 241 mq_timedreceive 242 mq_notify   243 mq_getsetattr
244 kexec_load  245 waitid       246 add_key      247 request_key
248 keyctl      249 ioprio_set   250 ioprio_get   251 inotify_init
252 inotify_add_watch 253 inotify_rm_watch 254 migrate_pages 255 openat
256 mkdirat     257 mknodat      258 fchownat     259 futimesat
260 newfstatat  261 unlinkat     262 renameat     263 linkat
264 symlinkat   265 readlinkat   266 fchmodat     267 fchownat
268 getcpu      269 epoll_pwait  270 utimensat    271 signalfd
272 timerfd_create 273 eventfd     274 fallocate    275 timerfd_settime
276 timerfd_gettime 277 accept4    278 signalfd4   279 eventfd2
280 epoll_create1 281 dup3       282 pipe2        283 inotify_init1
284 preadv      285 pwritev      286 rt_tgsigqueueinfo 287 perf_event_open
288 recvmmsg    289 fanotify_init 290 fanotify_mark 291 prlimit64
292 name_to_handle_at 293 open_by_handle_at 294 clock_adjtime 295 syncfs
296 sendmmsg    297 setns        298 getdents64   299 kcmp
300 finit_module 301 sched_setattr 302 sched_getattr 303 renameat2
304 seccomp     305 getrandom    306 memfd_create 307 kexec_file_load
308 bpf         309 execveat     310 userfaultfd  311 membarrier
312 mlock2      313 copy_file_range 314 preadv2   315 pwritev2
316 pkey_mprotect 317 pkey_alloc  318 pkey_free   319 statx
```

## Common Audit Scenarios

### CIS Benchmarks Compliance

```bash
# /etc/audit/rules.d/cis.rules

# 4.1.1.1 Ensure auditd is installed
# 4.1.1.2 Ensure auditd service is enabled
# 4.1.1.3 Ensure auditing for processes that start prior to auditd
# 4.1.1.4 Ensure audit_backlog_limit is sufficient
# 4.1.1.5 Ensure audit logs are not automatically deleted

# 4.1.2 Ensure audit log storage size is configured
# 4.1.3 Ensure audit logs are rotated
# 4.1.4 Ensure system is disabled when audit logs are full

# 4.1.5 Ensure changes to system administration scope (sudoers) are collected
-w /etc/sudoers -p wa -k scope
-w /etc/sudoers.d/ -p wa -k scope

# 4.1.6 Ensure actions as another user are always logged
-a always,exit -F arch=b64 -S execve -F uid=0 -F auid>=1000 -F auid!=4294967295 -k privileged
-a always,exit -F arch=b32 -S execve -F uid=0 -F auid>=1000 -F auid!=4294967295 -k privileged

# 4.1.7 Ensure events that modify the sudo log file are collected
-w /var/log/sudo.log -p wa -k sudo_log

# 4.1.8 Ensure events that modify date/time are collected
-a always,exit -F arch=b64 -S adjtimex -S settimeofday -S clock_settime -k time_change
-a always,exit -F arch=b32 -S adjtimex -S settimeofday -S clock_settime -k time_change

# 4.1.9 Ensure events that modify network configuration are collected
-w /etc/hosts -p wa -k network
-w /etc/hostname -p wa -k network
-w /etc/network/ -p wa -k network
-w /etc/sysconfig/network -p wa -k network

# 4.1.10 Ensure use of privileged commands is collected
-a always,exit -F arch=b64 -S execve -C uid!=euid -F euid=0 -k setuid
-a always,exit -F arch=b32 -S execve -C uid!=euid -F euid=0 -k setuid

# 4.1.11 Ensure unsuccessful file access attempts are collected
-a always,exit -F arch=b64 -S open -S openat -S creat -S truncate -S ftruncate -F exit=-EACCES -k access
-a always,exit -F arch=b64 -S open -S openat -S creat -S truncate -S ftruncate -F exit=-EPERM -k access
-a always,exit -F arch=b32 -S open -S openat -S creat -S truncate -S ftruncate -F exit=-EACCES -k access
-a always,exit -F arch=b32 -S open -S openat -S creat -S truncate -S ftruncate -F exit=-EPERM -k access

# 4.1.12 Ensure successful file access attempts are collected
# (often too noisy, skip or sample)

# 4.1.13 Ensure events that modify user/group information are collected
-w /etc/group -p wa -k identity
-w /etc/passwd -p wa -k identity
-w /etc/gshadow -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/security/opasswd -p wa -k identity

# 4.1.14 Ensure discretionary access control permission modification events are collected
-a always,exit -F arch=b64 -S chmod -S fchmod -S fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_mod
-a always,exit -F arch=b32 -S chmod -S fchmod -S fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_mod
-a always,exit -F arch=b64 -S chown -S fchown -S fchownat -S lchown -F auid>=1000 -F auid!=4294967295 -k perm_mod
-a always,exit -F arch=b32 -S chown -S fchown -S fchownat -S lchown -F auid>=1000 -F auid!=4294967295 -k perm_mod
-a always,exit -F arch=b64 -S setxattr -S lsetxattr -S fsetxattr -S removexattr -S lremovexattr -S fremovexattr -F auid>=1000 -F auid!=4294967295 -k perm_mod
-a always,exit -F arch=b32 -S setxattr -S lsetxattr -S fsetxattr -S removexattr -S lremovexattr -S fremovexattr -F auid>=1000 -F auid!=4294967295 -k perm_mod

# 4.1.15 Ensure unsuccessful unauthorized file access attempts are collected
# Covered by 4.1.11

# 4.1.16 Ensure events that modify the system's Mandatory Access Controls are collected
-w /etc/selinux/ -p wa -k MAC-policy
-w /usr/share/selinux/ -p wa -k MAC-policy

# 4.1.17 Ensure login/logout events are collected
-w /var/log/lastlog -p wa -k logins
-w /var/run/faillock/ -p wa -k logins

# 4.1.18 Ensure session initiation events are collected
-w /var/run/utmp -p wa -k session
-w /var/log/wtmp -p wa -k session
-w /var/log/btmp -p wa -k session

# 4.1.19 Ensure events that modify the system's network environment are collected
-a always,exit -F arch=b64 -S sethostname -S setdomainname -k system_locale
-a always,exit -F arch=b32 -S sethostname -S setdomainname -k system_locale
-w /etc/issue -p wa -k system_locale
-w /etc/issue.net -p wa -k system_locale

# 4.1.20 Ensure kernel module loading/unloading is collected
-w /sbin/insmod -p x -k modules
-w /sbin/rmmod -p x -k modules
-w /sbin/modprobe -p x -k modules
-a always,exit -F arch=b64 -S init_module -S delete_module -k modules
-a always,exit -F arch=b32 -S init_module -S delete_module -k modules

# 4.1.21 Ensure the audit configuration is immutable
-e 2
```

## Performance Tuning

```bash
# Increase buffer for high-volume systems
# /etc/audit/auditd.conf
num_logs = 10
max_log_file = 500
flush = INCREMENTAL_ASYNO
freq = 100

# Kernel buffer
# /etc/audit/rules.d/10-base-config.rules
-b 16384

# Rate limit
-r 200

# Dispatcher
# /etc/audisp/audispd.conf
q_depth = 16384
overflow_action = SYSLOG
```

## Remote Logging

```ini
# /etc/audisp/plugins.d/au-remote.conf
active = yes
direction = out
path = /sbin/audisp-remote
type = always
args =
format = string
```

```ini
# /etc/audisp/audisp-remote.conf
remote_server = logserver.example.com
port = 60
transport = TCP
mode = immediate
queue_depth = 200
format = managed
```

```bash
systemctl restart audispd
```

## Troubleshooting

```bash
# Check auditd status
systemctl status auditd
auditctl -s

# Check if rules loaded
auditctl -l

# Check logs
tail -f /var/log/audit/audit.log
ausearch -ts today -i | head -20

# Test rule
auditctl -w /etc/test-file -p wa -k test
touch /etc/test-file
ausearch -k test -i

# Check disk space
df -h /var/log/audit/

# Check for lost events
ausearch -m LOST -i

# Check kernel buffer
cat /proc/sys/kernel/audit_backlog_limit
cat /proc/sys/kernel/audit_rate_limit
```

## Integration with SIEM

### Forward to Elasticsearch (Filebeat)

```yaml
# filebeat.yml
filebeat.inputs:
  - type: log
    paths:
      - /var/log/audit/audit.log
    fields:
      type: audit
    fields_under_root: true
    processors:
      - add_host_metadata: ~
      - add_docker_metadata: ~
```

### Forward to Splunk

```conf
# inputs.conf
[monitor:///var/log/audit/audit.log]
index = linux_audit
sourcetype = linux_audit
```

## Best Practices

1. **Start minimal** - Add rules incrementally
2. **Use keys** - Group related rules with `-k` for easy querying
3. **Monitor disk** - Audit logs can grow fast
4. **Test rules** - Use `auditctl` at runtime before making persistent
5. **Review regularly** - Check `aureport` daily/weekly
6. **Immutable mode** - Use `-e 2` in production (reboot to change)
7. **Separate partitions** - Put `/var/log/audit` on separate partition
8. **Centralize** - Forward to SIEM for correlation
9. **Exclude noise** - Don't audit everything (e.g., `/tmp`, `/var/cache`)
10. **Document rules** - Comment each rule with purpose

## Reference

```bash
# Man pages
man auditctl
man ausearch
man aureport
man auditd.conf
man audit.rules
man audispd.conf

# Documentation
/usr/share/doc/auditd/
/usr/share/doc/audit/
```