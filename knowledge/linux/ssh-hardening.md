# SSH Hardening & Security

Client usage is in `ssh-practical.md`. This file is server-side (`/etc/ssh/sshd_config`). Service control uses `sys svc`; key generation uses `sys ssh`.

## Apply & test
```bash
sshd -t                         # validate syntax before reload
sys svc restart sshd            # reload without dropping connections: sudo systemctl reload sshd
```
Note: `sys svc` has no `reload` verb — use `sudo systemctl reload sshd` for a graceful reload.

## Minimal secure `sshd_config`
```ssh
Port 22
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

AllowUsers alice bob            # whitelist (optional)
MaxAuthTries 3
MaxSessions 2
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2

UsePAM yes
X11Forwarding no
AllowTcpForwarding no
DebianBanner no
LogLevel VERBOSE
```

## Access control
```ssh
AllowUsers alice bob@192.168.1.*   # user and/or user@host
DenyUsers root john
AllowGroups ssh-users
```

## Rate limiting & banners
```ssh
MaxAuthTries 3
MaxSessions 2
MaxStartups 10:30:100
LoginGraceTime 60
Banner /etc/issue.net
```

## Key types & strength
- `ssh-ed25519` — modern, fast, secure (recommended)
- `rsa-sha2-512` — RSA with SHA-2 (legacy compat, use 4096 bits)
- `ecdsa-sk` / `sk-ssh-ed25519@openssh.com` — FIDO2/U2F hardware keys

Generate host keys (run once, not on live rotation unless intended):
```bash
sudo ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key
sudo ssh-keygen -t rsa -b 4096 -f /etc/ssh/ssh_host_rsa_key
```
User keys: `sys ssh key ed25519`.

## Crypto policy (optional hardening)
```ssh
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512
```

## SSH certificates (CA)
```bash
sudo ssh-keygen -t ed25519 -f /etc/ssh/ssh_ca -C "SSH CA"
sudo ssh-keygen -s /etc/ssh/ssh_ca -I alice -n alice -V +52w id_ed25519.pub
sudo ssh-keygen -s /etc/ssh/ssh_ca -I server -h -V +52w ssh_host_ed25519_key.pub
```
```ssh
# /etc/ssh/sshd_config
TrustedUserCAKeys /etc/ssh/ssh_ca.pub
HostCertificate /etc/ssh/ssh_host_ed25519_key-cert.pub
```

## SFTP-only / chroot
```ssh
Match Group sftponly
    ForceCommand internal-sftp
    ChrootDirectory /home/%u
    X11Forwarding no
    AllowTcpForwarding no
```

## Audit & monitoring
```bash
sshd -T | grep -Ei "passwordauthentication|permitrootlogin"   # effective config
ssh -Q cipher                 # supported algorithms
ssh-keyscan server | ssh-keygen -l -f -     # inspect server key
sys log show sshd --since "1 day" | grep -c Failed           # brute-force volume
sys log show sshd --since "1 day" | grep Accepted            # successful logins
```

## Fail2ban
```ini
# /etc/fail2ban/jail.d/sshd.conf
[sshd]
enabled = true
maxretry = 3
bantime = 3600
```
```bash
sudo fail2ban-client status sshd
```

## Incident response
```bash
sudo find /home -name authorized_keys -exec grep -H "ssh-" {} \;   # audit deployed keys
sudo ssh-keygen -l -f ~/.ssh/authorized_keys                       # check key strength
# Rotate host keys:
sudo rm /etc/ssh/ssh_host_*_key*
sudo ssh-keygen -A
ssh-keyscan -t rsa,ed25519 server >> ~/.ssh/known_hosts
```
