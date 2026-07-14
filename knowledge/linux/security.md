# Linux Security & Hardening

Focused on host hardening. Firewalls → `firewall.md`, SSH → `ssh-hardening.md`, MAC → `selinux-apparmor.md`, auditd → `audit.md`.

## MAC status — use `sys secure`
```bash
sys secure status            # SELinux / AppArmor status (auto-detected)
sys secure audit             # recent AVC denials (SELinux)
```
Raw equivalents: `getenforce`/`sestatus` (SELinux), `aa-status` (AppArmor).

## File integrity
```bash
sudo aide --check                 # AIDE (Debian/Ubuntu: aideinit first)
sudo rpm -Va                      # Fedora: verify all packages
sudo debsums -s                   # Debian: verify package files
```

## Logging & auditing
```bash
sys log show ssh.service         # service logs
sys log show _COMM=sudo          # sudo usage
sys log errors                   # errors only
sudo ausearch -k passwd_changes   # auditd search by key (see audit.md)
sudo aureport -au                 # authentication report
```

## Password & account security
```bash
chage -M 90 user                  # password expires in 90 days
chage -l user                     # view expiry
chage -d 0 user                   # force change on next login
passwd -l user                    # lock account
faillock --user user --reset      # unlock after failed attempts
```
- `/etc/login.defs` — `PASS_MAX_DAYS`, `PASS_MIN_LEN`
- `libpam-pwquality` (Debian) / `pam_pwquality` (Arch) — password strength enforcement

## Encryption
```bash
# LUKS (full disk)
sudo cryptsetup luksFormat /dev/sda2
sudo cryptsetup open /dev/sda2 cryptroot
sudo cryptsetup luksAddKey /dev/sda2
sudo cryptsetup luksDump /dev/sda2

# GPG
gpg -c file                       # symmetric encrypt
gpg -o file -d file.gpg           # decrypt
gpg --gen-key                    # keypair
gpg --encrypt --recipient user@example.com file

# OpenSSL quick encrypt (use -pbkdf2)
openssl enc -aes-256-cbc -pbkdf2 -salt -in file -out file.enc
openssl enc -d -aes-256-cbc -pbkdf2 -in file.enc -out file
```

## Process isolation
systemd unit sandboxing:
```ini
ProtectSystem=full
ProtectHome=true
PrivateTmp=true
NoNewPrivileges=true
CapabilityBoundingSet=~CAP_SYS_ADMIN
SystemCallFilter=~@privileged
```
```bash
firejail firefox                  # sandbox a browser
bwrap --dev-bind / / --proc /proc firefox
```

## Kernel hardening (sysctl)
```bash
# /etc/sysctl.d/99-hardening.conf
kernel.kptr_restrict=2           # hide kernel pointers
kernel.dmesg_restrict=1          # only root can dmesg
kernel.yama.ptrace_scope=2       # restrict ptrace
fs.protected_hardlinks=1
fs.protected_symlinks=1
fs.suid_dumpable=0               # no setuid core dumps
net.core.bpf_jit_harden=2
```
Apply: `sudo sysctl --system`

## Common security tools
```bash
rkhunter --check                  # rootkit hunter (needs install)
chkrootkit                       # rootkit check (needs install)
clamscan -r /home                # antivirus (needs install)
lynis audit system               # security audit (needs install)
nmap -sV localhost               # scan local open ports
sudo fail2ban-client status sshd # brute-force bans
```
