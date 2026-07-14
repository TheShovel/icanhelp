# Linux Audit System (auditd)

Tracks security-relevant events: file access, syscalls, logins, network changes. **`auditctl`/`ausearch` require root** — commands below are syntax-verified. Install with `sys pkg install audit` (Arch) / `sys pkg install auditd` (Debian) / `sys pkg install audit` (Fedora); enable with `sys svc enable auditd`.

## Rule files
Rules live in `/etc/audit/rules.d/*.rules`, loaded with `sudo augenrules --load`. Processed in lexical order; end with `-e 2` (immutable) in `90-finalize.rules`.

## Rule syntax

### Base config
```bash
# /etc/audit/rules.d/10-base-config.rules
-D                       # delete existing rules
-b 8192                  # kernel buffer
-f 1                     # failure mode (1=printk)
-r 100                   # rate limit (msgs/sec)
```

### Watch files/directories
```bash
# /etc/audit/rules.d/20-file-access.rules
-w /etc/passwd -p wa -k passwd_changes
-w /etc/shadow -p wa -k shadow_changes
-w /etc/sudoers -p wa -k sudoers_changes
-w /etc/ssh/sshd_config -p wa -k sshd_config
# p = r(ead) w(rite) x(exec) a(ttr change)
```

### System-call rules
```bash
# /etc/audit/rules.d/30-syscalls.rules
-a always,exit -F arch=b64 -S chmod -S fchmod -S fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_mod
-a always,exit -F arch=b64 -S chown -S fchown -S lchown -F auid>=1000 -F auid!=4294967295 -k perm_mod
-a always,exit -F arch=b64 -S execve -F uid=0 -F auid>=1000 -F auid!=4294967295 -k privileged
-a always,exit -F arch=b64 -S mount -S umount2 -F auid>=1000 -F auid!=4294967295 -k mounts
-a always,exit -F arch=b64 -S init_module -S delete_module -k modules
```

### Immutable mode
```bash
# /etc/audit/rules.d/90-finalize.rules
-e 2                      # lock config (reboot to change)
```

## Manage rules
```bash
sudo augenrules --load     # load from rules.d
sudo auditctl -l           # list loaded rules
sudo auditctl -s           # status
sudo auditctl -w /etc/passwd -p wa -k passwd     # add at runtime
sudo auditctl -W /etc/passwd -p wa -k passwd     # remove at runtime
sudo auditctl -D           # delete all
```

## Query logs
```bash
sudo ausearch -k passwd_changes -i        # by key
sudo ausearch -ts today -i                # since today
sudo ausearch -ui 1000 -i                 # by user ID
sudo ausearch -sc chmod -i                # by syscall
sudo ausearch --success no -i             # failures

sudo aureport -i                         # summary
sudo aureport -f -i                      # file access
sudo aureport -u -i                      # users
sudo aureport -l -i                      # logins
sudo aureport --failed -i

# Pipeline
sudo ausearch -ui 1000 --raw | aureport -f -i
```

## Troubleshoot
```bash
sys svc status auditd
sudo auditctl -s
sudo tail -f /var/log/audit/audit.log
sudo ausearch -m LOST -i                  # lost events
cat /proc/sys/kernel/audit_backlog_limit
df -h /var/log/audit/                     # disk space
```
