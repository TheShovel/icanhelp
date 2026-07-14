# SELinux & AppArmor

Two mandatory access control (MAC) frameworks. SELinux is default on RHEL/Fedora; AppArmor on Debian/Ubuntu/SUSE. **Neither is installed on this Arch box** — commands below are valid where the framework is present. Check status with `sys secure status`.

## SELinux
```bash
getenforce                      # Enforcing | Permissive | Disabled
sestatus                        # status + policy
setenforce 0                    # permissive (temporary)
setenforce 1                    # enforcing (temporary)
ls -Z /var/www/                 # show contexts
ps -eZ                          # process contexts
```
Booleans:
```bash
getsebool -a                    # list all
getsebool httpd_can_network_connect
sudo setsebool -P httpd_can_network_connect on   # permanent
```
File contexts:
```bash
semanage fcontext -l            # mappings
sudo semanage fcontext -a -t httpd_sys_content_t "/var/www/html(/.*)?"
sudo restorecon -R /var/www/html/
sudo chcon -t httpd_sys_content_t /var/www/html/custom   # temporary
```
Ports & policy:
```bash
sudo semanage port -a -t http_port_t -p tcp 8080
sudo semodule -l                # loaded modules
```
Audit → policy:
```bash
sudo ausearch -m avc -ts recent
sudo audit2allow -a             # show policy to fix denials
sudo audit2allow -a -M mypol && sudo semodule -i mypol.pp
```

## AppArmor
```bash
sudo aa-status                  # loaded profiles + modes
sudo aa-enforce /usr/sbin/nginx     # block violations
sudo aa-complain /usr/sbin/nginx    # log only
sudo aa-genprof /path/to/bin        # generate profile (complain mode)
sudo aa-logprof                   # update from logs
sudo apparmor_parser -r /etc/apparmor.d/usr.sbin.nginx   # reload
```
Profiles live in `/etc/apparmor.d/`. Disable by symlinking into `/etc/apparmor.d/disable/` then reloading.

## Quick comparison
| | SELinux | AppArmor |
|---|---|---|
| Default on | RHEL/Fedora/CentOS | Ubuntu/openSUSE |
| Model | type enforcement, labels | path-based profiles |
| Status | `getenforce` | `aa-status` |
| Generate | `audit2allow` | `aa-genprof` |
