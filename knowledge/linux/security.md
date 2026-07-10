# Linux Security & Hardening

## Firewall Basics
- **nftables** — modern kernel firewall (default on Debian, Arch)
- **iptables** — legacy (still works, translated to nftables)
- **UFW** — frontend for iptables/nftables (Ubuntu)
- **firewalld** — frontend with zones (Fedora/RHEL)
Check active: `sudo nft list ruleset`, `sudo iptables -L`, `sudo ufw status`

## SSH Hardening (`/etc/ssh/sshd_config`)
```
Port 2222                        # non-default port
PermitRootLogin no               # no root SSH
PasswordAuthentication no        # key-only
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
MaxAuthTries 3                   # limit attempts
MaxSessions 2                    # limit parallel
ClientAliveInterval 300          # disconnect idle after 5 min
ClientAliveCountMax 0
AllowUsers user1 user2           # whitelist users
Protocol 2                       # no SSHv1
UseDNS no                        # skip DNS lookup (faster, less leaky)
```
Restart: `sudo systemctl restart sshd`

## File Integrity
```
# AIDE
sudo aideinit
sudo aide --check

# Tripwire (similar concept)
# Check package manager
sudo rpm -Va           # Fedora: verify all packages
sudo debsums -s        # Debian: verify Debian package files
```

## Logging & Auditing
```
# Auditd
sudo auditctl -l                 # list rules
sudo auditctl -w /etc/passwd -p wa -k passwd_changes
ausearch -k passwd_changes       # search audit log
aureport -au                     # authentication report

# systemd-journald
journalctl -u ssh.service        # SSH logs
journalctl _COMM=sudo            # sudo usage
journalctl -p err                # errors only
```

## AppArmor / SELinux Quick Ref
**AppArmor**: `sudo aa-status`, `sudo aa-enforce /bin/program`
**SELinux**: `getenforce`, `setenforce 0`, `restorecon -Rv /path`

## Password Security
- `/etc/login.defs` — set PASS_MAX_DAYS, PASS_MIN_LEN
- `chage -M 90 user` — password expires in 90 days
- `chage -l user` — view password expiry
- `faillock --user user --reset` — unlock after failed attempts
- Use `passwd -l user` to lock account
- Install `libpam-pwquality` for password quality enforcement

## Encryption
- **LUKS** — full-disk encryption
  - `sudo cryptsetup luksFormat /dev/sda2`
  - `sudo cryptsetup open /dev/sda2 cryptroot`
  - `sudo cryptsetup luksAddKey /dev/sda2`
  - `sudo cryptsetup luksDump /dev/sda2`
- **GPG** — file encryption
  - `gpg -c file` — symmetric encrypt
  - `gpg -o file -d file.gpg` — decrypt
  - `gpg --gen-key` — generate keypair
  - `gpg --encrypt --recipient user@example.com file`
- **OpenSSL** — quick encryption
  - `openssl enc -aes-256-cbc -salt -in file -out file.enc`
  - `openssl enc -d -aes-256-cbc -in file.enc -out file`

## Process Isolation
- **systemd sandboxing** (add to unit file):
  ```
  ProtectSystem=full
  ProtectHome=true
  PrivateTmp=true
  NoNewPrivileges=true
  CapabilityBoundingSet=~CAP_SYS_ADMIN
  SystemCallFilter=~@privileged
  ```
- **Firejail**: `firejail firefox` — sandbox browser
- **Bubblewrap**: `bwrap --dev-bind / / --proc /proc firefox`
- **Docker**: containers with limited capabilities

## Common Security Tools
- `rkhunter --check` — rootkit hunter
- `chkrootkit` — rootkit check
- `clamscan -r /home` — antivirus scan
- `lynis audit system` — security audit
- `nmap -sV localhost` — scan open ports
- `fail2ban-client status sshd` — ban brute-force IPs
- `tripwire --check` — file integrity monitoring

## Kernel Hardening (sysctl)
```
kernel.kptr_restrict=2           # hide kernel pointers
kernel.dmesg_restrict=1          # only root can dmesg
kernel.kexec_load_disabled=1     # disable kexec
kernel.unprivileged_bpf_disabled=1
net.core.bpf_jit_harden=2
kernel.yama.ptrace_scope=2       # restrict ptrace
dev.tty.ldisc_autoload=0
vm.mmap_rnd_bits=32
vm.mmap_rnd_compat_bits=16
fs.protected_hardlinks=1
fs.protected_symlinks=1
fs.suid_dumpable=0               # no setuid core dumps
```
Apply: `sudo sysctl -p /etc/sysctl.d/99-hardening.conf`
