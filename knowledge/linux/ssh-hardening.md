# SSH Hardening and Security

## SSH Configuration

### sshd_config Basics
- `/etc/ssh/sshd_config` — server configuration
- `/etc/ssh/ssh_config` — client configuration
- `~/.ssh/config` — user client config
- `sshd -t` — test configuration syntax

### Restart SSH
```bash
# Test config, then restart
sshd -t && systemctl reload sshd

# Or for specific distro
sshd -t && systemctl reload ssh
```

## Authentication Security

### Password Authentication
- `PasswordAuthentication no` — disable passwords
- `PubkeyAuthentication yes` — enable keys
- `ChallengeResponseAuthentication no` — disable PAM auth
- `UsePAM yes` — enable PAM (keep for key auth)

### Key Authentication
```
# /etc/ssh/sshd_config
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
AuthorizedPrincipalsFile /etc/ssh/principals/%u
AuthorizedKeysCommand /usr/bin/ssh-authorized-keys %u
```

### Two-Factor Authentication
```
# /etc/ssh/sshd_config
AuthenticationMethods publickey,keyboard-interactive
AuthenticationMethods publickey,password
```

### YubiKey/U2F
```
# /etc/ssh/sshd_config
ChallengeResponseAuthentication yes
UsePAM yes
```

```
# /etc/pam.d/sshd
auth required pam_yubico.so mode=challenge-response
```

## Access Control

### User Restrictions
```
# Allow specific users
AllowUsers alice bob

# Deny specific users
DenyUsers root john

# Allow groups
AllowGroups ssh-users admin

# Deny groups
DenyGroups blocked
```

### Root Login
- `PermitRootLogin no` — recommended
- `PermitRootLogin prohibit-password` — key-only for root
- `PermitRootLogin forced-commands-only` — only specific commands
- `PermitRootLogin yes` — discouraged

### Rate Limiting
```
# /etc/ssh/sshd_config
MaxAuthTries 3
MaxSessions 2
MaxStartups 10:30:100
LoginGraceTime 60
```

### Banner Warning
```
# /etc/ssh/sshd_config
Banner /etc/issue.net

# /etc/issue.net
************************************************************************
* Authorized access only! All activity will be monitored and recorded.   *
************************************************************************
```

## Network Security

### Port Security
```
# /etc/ssh/sshd_config
Port 22
# Or non-standard
Port 2222

# Listen on specific addresses
ListenAddress 192.168.1.10
ListenAddress 10.0.0.1
```

### Protocol Security
```
# Use only SSHv2
Protocol 2

# Disable old ciphers
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr

# MACs
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,umac-128-etm@openssh.com

# KEX (key exchange)
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group-exchange-sha256
```

### Host Key Algorithms
```
# Strong host keys
HostKeyAlgorithms rsa-sha2-512,rsa-sha2-256,ssh-ed25519,ecdsa-sha2-nistp256
```

## SSH Key Management

### Key Types
- `ssh-ed25519` — modern, fast, secure (recommended)
- `ecdsa-sk` — security key with ECDSA
- `sk-ssh-ed25519@openssh.com` — security key with Ed25519
- `rsa-sha2-512` — RSA with SHA-2 (legacy)

### Generate Strong Keys
```bash
# Ed25519 key
ssh-keygen -t ed25519 -C "alice@work"

# ECDSA P-384
ssh-keygen -t ecdsa-sk -C "alice@laptop"

# Security key
ssh-keygen -t ecdsa-sk -O device=any -O user=alice -O application=ssh://example.com
```

### Key Strength
- RSA: 4096 bits minimum
- ECDSA: P-384 (better) or P-256
- Ed25519: always 255 bits (strong)

### Deploy Keys
```bash
# Install public key
echo "ssh-ed25519 AAAA... alice@work" >> /home/alice/.ssh/authorized_keys

# Set permissions
chmod 700 /home/alice/.ssh
chmod 600 /home/alice/.ssh/authorized_keys
chown -R alice:alice /home/alice/.ssh
```

## SSH Client Security

### ssh_config
```
# /etc/ssh/ssh_config or ~/.ssh/config
Host *
    HostKeyAlgorithms -ssh-rsa
    PubkeyAcceptedAlgorithms -ssh-rsa
    Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
    MACs hmac-sha2-512-etm@openssh.com
    KexAlgorithms curve25519-sha256@libssh.org
```

### SSH Agent
- `SSH_AUTH_SOCK` — agent socket
- `ssh-agent` — start agent
- `ssh-add` — add keys to agent
- `ssh-add -l` — list loaded keys

### Agent Security
```bash
# Timeout for keys
ssh-add -t 3600 ~/.ssh/id_ed25519  # 1 hour

# Confirm before use
ssh-add -c ~/.ssh/id_ed25519

# Confirm on first use
ssh-add -t 3600 -c ~/.ssh/id_ed25519
```

## SSH Hardening Commands

### Check SSH Security
```bash
# Test config
sshd -T | grep -E "(passwordauthentication|permitrootlogin)"

# Check cipher support
ssh -Q cipher

# Check MAC support
ssh -Q mac

# Check KEX support
ssh -Q kex
```

### Audit SSH
```bash
# Check weak algorithms
nmap --script ssh2-enum-algos -p 22 server

# Check banner
nc server 22

# Check key strength
ssh-keyscan server | ssh-keygen -l -f -
```

### Harden SSH
```bash
# Generate strong host keys
ssh-keygen -t rsa-sha2-512 -b 4096 -f /etc/ssh/ssh_host_rsa_key
ssh-keygen -t ecdsa -b 384 -f /etc/ssh/ssh_host_ecdsa_key
ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key

# Restart SSH
systemctl restart sshd
```

## SSH Certificates

### Certificate Authority
```bash
# Generate CA key
ssh-keygen -t rsa-sha2-512 -b 4096 -f /etc/ssh/ssh_ca -C "SSH CA"

# Sign user key
ssh-keygen -s /etc/ssh/ssh_ca -I alice -n alice -V +52w weeks.pem.pub

# Sign host key
ssh-keygen -s /etc/ssh/ssh_ca -I server -h -V +52w server.pub
```

### Certificate Revocation
```bash
# Generate KRL (key revocation list)
ssh-keygen -k -f /etc/ssh/krl -s /etc/ssh/ssh_ca serial

# Add revoked key
ssh-keygen -k -f /etc/ssh/krl -s /etc/ssh/ssh_ca revoked.pub
```

### sshd_config for Certificates
```
# /etc/ssh/sshd_config
TrustedUserCAKeys /etc/ssh/ssh_ca.pub
RevokedKeys /etc/ssh/krl

HostCertificate /etc/ssh/ssh_host_rsa-cert.pub
HostCertificate /etc/ssh/ssh_host_ed25519-cert.pub
```

## SSH Tunnels and Proxies

### ProxyJump (modern)
```
# ~/.ssh/config
Host internal
    HostName 10.0.0.1
    ProxyJump bastion.example.com

Host bastion
    HostName bastion.example.com
    User alice
```

### ProxyCommand
```
# ~/.ssh/config
Host internal
    HostName 10.0.0.1
    ProxyCommand ssh -W %h:%p bastion.example.com
```

### SSH as Proxy
```bash
# Dynamic SOCKS proxy
ssh -D 1080 user@server -N

# Local port forward
ssh -L 8080:internal:80 user@bastion

# Remote port forward
ssh -R 8080:localhost:80 user@server
```

## SSH Access Patterns

### Forced Commands
```bash
# ~/.ssh/authorized_keys
command="rsync --server --daemon ." ssh-rsa AAAAB3...
command="ls -la /data" ssh-ed25519 AAAAC2...

# Allow specific command only
command="git-upload-pack '/srv/git/repo.git'" ssh-rsa AAAAB3...
```

### Chroot
```
# /etc/ssh/sshd_config
Match User sftpuser
    ChrootDirectory /home/sftpuser
    ForceCommand internal-sftp
    AllowAgentForwarding no
    AllowTcpForwarding no
    X11Forwarding no
```

### sftp-only
```
# /etc/ssh/sshd_config
Match Group sftpusers
    ForceCommand internal-sftp
    PasswordAuthentication yes
    ChrootDirectory %h
    AllowTcpForwarding no
```

## SSH Security Tools

### ssh-audit
```bash
# Check SSH server
ssh-audit server:22

# Check specific algorithms
ssh-audit --skip-rate-limiting server:22
```

### ssh-scan
```bash
# Generate hardened config
sshscan server:22 > hardened_config
```

### fail2ban
```ini
# /etc/fail2ban/jail.d/sshd.conf
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

## Incident Response

### Check Compromised Keys
```bash
# Check failed logins
journalctl -u ssh | grep "Failed\|Invalid"

# Check successful logins
journalctl -u ssh | grep "Accepted"

# Check sudo usage
journalctl | grep sudo
```

### Rotate Keys
```bash
# Generate new host keys
rm /etc/ssh/ssh_host_*_key*
ssh-keygen -A

# Add to known_hosts
ssh-keyscan -t rsa,ed25519 server >> ~/.ssh/known_hosts
```

### Audit Authorized Keys
```bash
# Find all authorized_keys
find /home -name authorized_keys -exec grep -H "ssh-" {} \;

# Check for weak keys
ssh-keygen -l -f ~/.ssh/authorized_keys
```

## SSH Configuration Examples

### Minimal Secure sshd_config
```
# /etc/ssh/sshd_config
Port 22
Protocol 2

HostKey /etc/ssh/ssh_host_ed25519_key
HostKey /etc/ssh/ssh_host_rsa_key

PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

AllowUsers alice bob
AllowGroups ssh-users

MaxAuthTries 3
MaxSessions 2
ClientAliveInterval 300
ClientAliveCountMax 2

UsePAM yes
X11Forwarding no
AllowTcpForwarding yes
```

### Bastion Host
```
# /etc/ssh/sshd_config
AllowTcpForwarding yes
GatewayPorts no
AllowAgentForwarding yes
PermitTunnel no
```

### Jump Host
```
# /etc/ssh/sshd_config
AllowUsers jump-user
AllowTcpForwarding yes
X11Forwarding no
PasswordAuthentication no
```

## SSH Key Management Scripts

### Key Rotation Script
```bash
#!/bin/bash
# /usr/local/bin/rotate-ssh-keys.sh
KEY="$1"
DAYS=${2:-90}

if ssh-keygen -l -f "$KEY" >/dev/null 2>&1; then
    EXPIRY=$(ssh-keygen -lf "$KEY" | awk '{print $2}')
    # Check if older than DAYS
    # Rotate if expired
fi
```

### Host Key Audit
```bash
#!/bin/bash
# /usr/local/bin/check-host-keys.sh
for key in /etc/ssh/ssh_host_*_key.pub; do
    ssh-keygen -l -f "$key"
done
```

## SSH Client Hardening

### Strict Host Key Checking
```
# ~/.ssh/config
Host *
    StrictHostKeyChecking yes
    UserKnownHostsFile ~/.ssh/known_hosts
    HashKnownHosts yes

Host internal-*
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
```

### Key Exchange Hardening
```
# ~/.ssh/config
Host old-server
    KexAlgorithms +diffie-hellman-group1-sha1
    HostKeyAlgorithms +ssh-rsa
```

### Connection Security
```
# ~/.ssh/config
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    TCPKeepAlive yes
    Compression no
    LogLevel ERROR
```

## SSH Monitoring

### Log Analysis
```bash
# Failed login count
journalctl -u ssh --since "1 day" | grep "Failed" | wc -l

# Distinct IPs with failures
journalctl -u ssh --since "1 day" | grep "Failed" | awk '{print $NF}' | sort -u

# Successful logins
journalctl -u ssh --since "1 day" | grep "Accepted"
```

### SSH Stats
```bash
# Connection attempts
ss -tuln | grep :22 | wc -l

# Active connections
ss -tnp | grep :22
```

## SSH Backup and Recovery

### Backup SSH Config
```bash
# Backup script
tar -czf /backup/ssh-config-$(date +%Y%m%d).tar.gz \
    /etc/ssh/sshd_config \
    /etc/ssh/ssh_host_*_key* \
    /etc/ssh/ssh_ca* \
    /etc/ssh/krl*

# Backup authorized keys
find /home -name authorized_keys -exec tar -rf /backup/authkeys.tar {} \;
```

### Recovery
```bash
# Restore host keys
systemctl stop sshd
tar -xf ssh-config.tar -C /
systemctl start sshd
```