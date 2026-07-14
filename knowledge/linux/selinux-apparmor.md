# SELinux and AppArmor Security Frameworks

## SELinux (Security-Enhanced Linux)

### Status and Modes
- `sestatus` — SELinux status and policy
- `getenforce` — current mode (Enforcing, Permissive, Disabled)
- `setenforce 0` — set permissive mode (temporary)
- `setenforce 1` — set enforcing mode (temporary)
- `sestatus -v` — verbose status with kernel version

### Modes Explained
- `Enforcing` — policies enforced, denials logged
- `Permissive` — policies not enforced, denials logged
- `Disabled` — SELinux completely off

### Configuration Files
- `/etc/selinux/config` — permanent mode configuration
- `/etc/selinux/targeted/contexts/files/file_contexts` — file contexts
- `/var/log/audit/audit.log` — SELinux denials (ausearch)

### Boolean Settings
- `getsebool -a` — list all booleans
- `getsebool httpd_can_network_connect` — check specific boolean
- `setsebool -P httpd_can_network_connect on` — enable permanently
- `setsebool httpd_can_network_connect_db on` — allow DB connections
- `setsebool nis_enabled on` — enable NIS support
- `setsebool allow_ypbind on` — allow NIS binding

### Common Booleans
```
httpd_can_network_connect     # HTTPD to make network connections
httpd_can_network_connect_db  # HTTPD to connect to databases
httpd_read_user_content       # HTTPD read user content
nginx_can_network_connect     # Nginx network access
mysqld_connect_any          # MySQL connect anywhere
ftpd_full_access            # FTPD full access
named_write_master_zones    # BIND write zones
```

### File Contexts
- `ls -Z` — show SELinux context
- `ls -Z /var/www/` — show web directory contexts
- `semanage fcontext -l` — list file context mappings
- `semanage fcontext -a -t httpd_exec_t '/var/www/scripts/.*\.cgi'` — add context
- `restorecon -R /var/www/` — apply default contexts
- `restorecon -v /var/www/html/index.html` — verbose restore
- `chcon -t httpd_exec_t /var/www/scripts/test.cgi` — temporary context change
- `chcon -R -t var_lib_t /custom/data` — recursive context change

### Process Contexts
- `ps -eZ` — show process contexts
- `id -Z` — current process context
- `runcon -t httpd_t command` — run with specific context
- `newrole -r sysadm_r` — switch to admin role (if permitted)

### SELinux Policy Management
- `semanage port -l` — list port contexts
- `semanage port -a -t http_port_t -p tcp 8080` — add port context
- `semanage login -l` — list user mappings
- `semanage user -l` — list SELinux users
- `semodule -l` — list loaded policy modules
- `semodule -i custom.pp` — install custom policy

### Audit2allow
- `grep AVC /var/log/audit/audit.log` — find denials
- `ausearch -m avc -ts recent` — search recent AVC denials
- `audit2allow -a` — show policy to fix all denials
- `audit2allow -i /var/log/audit/audit.log` — from specific log
- `audit2allow -a -M mypol` — create custom policy module
- `semodule -i mypol.pp` — install generated policy

### SELinux Users and Roles
- `semanage login -a -s staff_u alice` — map Linux user to SELinux user
- `semanage login -m -s sysadm_u alice` — modify mapping
- `semanage user -a -R "staff_r system_r" custom_u` — create custom user
- SELinux users: `user_u`, `staff_u`, `sysadm_u`, `system_u`
- Roles: `user_r`, `staff_r`, `sysadm_r`, `system_r`, `secadm_r`, `auditadm_r`

## AppArmor (Application Armor)

### Status
- `apparmor_status` — show loaded profiles and modes
- `aa-status` — same as apparmor_status
- `/sys/kernel/security/apparmor/profiles` — raw profile list

### Modes
- `enforce mode` — blocks unauthorized access
- `complain mode` — logs violations but allows access

### Profile Management
- `/etc/apparmor.d/` — profile directory
- `ls -l /etc/apparmor.d/` — list profiles
- `cp /etc/apparmor.d/usr.sbin.mysqld /etc/apparmor.d/local/usr.sbin.mysqld` — create local override
- `apparmor_parser -r /etc/apparmor.d/usr.sbin.mysqld` — reload profile
- `apparmor_parser -R /etc/apparmor.d/disable/usr.sbin.mysqld` — remove profile

### Enable/Disable Profiles
- `ln -s /etc/apparmor.d/usr.sbin.mysqld /etc/apparmor.d/disable/` — disable
- `rm /etc/apparmor.d/disable/usr.sbin.mysqld` — re-enable (then reload)
- `systemctl reload apparmor` — reload all profiles

### aa-genprof
- `aa-genprof /path/to/executable` — generate profile in learning mode
- Runs in complain mode, watches program execution
- Interactively asks to allow/deny accesses
- Creates `/etc/apparmor.d/path.to.executable`

### aa-logprof
- `aa-logprof` — process audit logs to update profiles
- Reads AppArmor denials from `/var/log/audit/audit.log` or journal
- Suggests profile changes

## Comparison: SELinux vs AppArmor

| Feature | SELinux | AppArmor |
|---------|---------|----------|
| Policy Language | Complex, MLS labels | Path-based, simpler |
| Default | RHEL, Fedora, CentOS | Ubuntu, openSUSE |
| Policy Generation | audit2allow | aa-genprof |
| Type Enforcement | Mandatory | Path-based |
| Integration | Deep kernel integration | LSM framework |

## Troubleshooting

### SELinux Troubleshooting
```bash
# Check current context
ls -Z /var/www/html/
ps -eZ | grep httpd

# Check denials
ausearch -m avc -ts today
ausearch -m avc -ts recent | audit2allow

# Set context temporarily
chcon -t httpd_sys_content_t /var/www/html/custom

# Make context permanent
semanage fcontext -a -t httpd_sys_content_t "/var/www/html(/.*)?"
restorecon -R /var/www/html/
```

### AppArmor Troubleshooting
```bash
# Check status
aa-status
dmesg | grep apparmor

# Check denial logs
journalctl | grep apparmor
grep DENIED /var/log/kern.log

# Put profile in complain mode
aa-complain /usr/sbin/nginx

# Enforce profile
aa-enforce /usr/sbin/nginx
```

### Common Denials and Fixes

#### SELinux HTTPD
```bash
# Allow network
setsebool -P httpd_can_network_connect on

# Allow MySQL connection
setsebool -P httpd_can_network_connect_db on

# Allow custom port
semanage port -a -t http_port_t -p tcp 8080

# Allow custom document root
semanage fcontext -a -t httpd_sys_content_t "/custom/www(/.*)?"
restorecon -R /custom/www/
```

#### SELinux Samba
```bash
# Allow custom share
semanage fcontext -a -t samba_share_t "/srv/samba(/.*)?"
restorecon -R /srv/samba/

# Enable Samba booleans
setsebool -P samba_enable_home_dirs on
setsebool -P samba_export_all_rw on
```

#### SELinux NFS
```bash
# Enable NFS exports
setsebool -P nfs_export_all_rw on
setsebool -P nfs_export_all_ro on

# Allow mount any file type
setsebool -P mount_any_file on
```

## Policy Files

### SELinux TE (Type Enforcement)
```
# /etc/selinux/targeted/contexts/files/file_contexts
/var/www/html(/.*)?    system_u:object_r:httpd_sys_content_t:s0
/var/www/scripts(/.*)? system_u:object_r:httpd_sys_script_exec_t:s0
/tmp(/.*)?             user_tmp_t
```

### AppArmor Profile
```
# /etc/apparmor.d/usr.sbin.apache2
#include <tuneables/global>

/usr/sbin/apache2 {
  #include <abstractions/base>
  #include <abstractions/nameservice>

  capability setgid,
  capability setuid,
  capability net_bind_service,

  /etc/apache2/** r,
  /var/www/** r,
  /var/log/apache2/* w,
  /proc/*/status r,

  # Deny dangerous paths
  deny /root/** rwklx,
  deny /home/** rwklx,
}
```

## Tools and Utilities

### SELinux Tools
- `getenforce` / `setenforce` — mode control
- `sestatus` — status
- `sealert` — analyze audit logs with suggestions (setroubleshoot)
- `semanage` — policy management
- `setsebool` — boolean control
- `chcon` — change context (temporary)
- `restorecon` — restore default context
- `fixfiles` — relabel files globally

### AppArmor Tools
- `aa-status` — status
- `aa-genprof` — profile generation
- `aa-logprof` — log processing
- `aa-complain` — set complain mode
- `aa-enforce` — set enforce mode
- `apparmor_parser` — profile parsing/reloading