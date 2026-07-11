# Linux SSH Practical Guide

## SSH Client Config (`~/.ssh/config`)
```ssh
# Basic host alias
Host myserver
    HostName 192.168.1.100
    User admin
    Port 2222
    IdentityFile ~/.ssh/id_ed25519_myserver

# Wildcard matching
Host *.internal
    User admin
    IdentityFile ~/.ssh/id_ed25519
    ProxyJump bastion

# Jump host / bastion
Host bastion
    HostName bastion.example.com
    User admin
    Port 22

Host internal-*
    HostName %h.internal.example.com
    ProxyJump bastion
    User admin

# Multiplexing (reuse connections)
Host *
    ControlMaster auto
    ControlPath ~/.ssh/control/%r@%h:%p
    ControlPersist 10m
    ServerAliveInterval 30
    ServerAliveCountMax 3

# GitHub/GitLab
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github
    IdentitiesOnly yes

# AWS EC2
Host *.compute.amazonaws.com
    User ec2-user
    IdentityFile ~/.ssh/aws-key.pem
    IdentitiesOnly yes
    StrictHostKeyChecking accept-new
```

## SSH Key Management

### Key Generation
```bash
# Ed25519 (recommended, modern)
ssh-keygen -t ed25519 -a 100 -C "user@host"

# RSA (legacy compatibility, 4096 bits)
ssh-keygen -t rsa -b 4096 -o -a 100 -C "user@host"

# ECDSA (hardware keys)
ssh-keygen -t ecdsa -b 521 -C "user@host"

# FIDO2/U2F hardware key (YubiKey)
ssh-keygen -t ecdsa-sk -C "user@host"
ssh-keygen -t ed25519-sk -C "user@host"  # Requires OpenSSH 8.2+
```

### Key Management
```bash
# Add to ssh-agent
ssh-add ~/.ssh/id_ed25519
ssh-add -l                    # List keys
ssh-add -L                    # List public keys
ssh-add -D                    # Remove all

# Agent forwarding (use with caution)
ssh -A user@host              # Forward agent
# In config: ForwardAgent yes

# Key permissions (critical!)
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_*
chmod 644 ~/.ssh/*.pub
chmod 644 ~/.ssh/authorized_keys
chmod 644 ~/.ssh/known_hosts
chmod 600 ~/.ssh/config
```

### SSH Agent (systemd user service)
```bash
systemctl --user enable --now ssh-agent
# Socket: $SSH_AUTH_SOCK
# Add to ~/.bashrc: export SSH_AUTH_SOCK="$XDG_RUNTIME_DIR/ssh-agent.socket"
```

## SSH Server Hardening (`/etc/ssh/sshd_config`)

```ssh
# Port & Protocol
Port 22
Protocol 2

# Authentication
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Key types
PubkeyAcceptedAlgorithms ssh-ed25519,ssh-rsa,ecdsa-sha2-nistp256
HostKeyAlgorithms ssh-ed25519,ssh-rsa,ecdsa-sha2-nistp256

# Crypto hardening
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com

# Security
MaxAuthTries 3
MaxSessions 2
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding no
PermitTunnel no
DebianBanner no

# Logging
SyslogFacility AUTH
LogLevel VERBOSE

# Access control
AllowUsers user1 user2@192.168.1.*
AllowGroups sshusers
# DenyUsers baduser
# DenyGroups badgroup

# SFTP only (chroot)
Match Group sftponly
    ForceCommand internal-sftp
    ChrootDirectory /home/%u
    X11Forwarding no
    AllowTcpForwarding no
```

### Apply & Test
```bash
sshd -t                    # Test config syntax
systemctl reload sshd      # Reload without disconnecting
systemctl restart sshd     # Full restart
```

## SSH Connection Multiplexing
```bash
# ~/.ssh/config
Host *
    ControlMaster auto
    ControlPath ~/.ssh/control/%r@%h:%p
    ControlPersist 10m

# Create control directory
mkdir -p ~/.ssh/control

# Manual control
ssh -M -S ~/.ssh/control/%r@%h:%p -o ControlPersist=yes user@host
ssh -S ~/.ssh/control/user@host:22 -O check user@host   # Check master
ssh -S ~/.ssh/control/user@host:22 -O exit user@host    # Close master
```

## Port Forwarding / Tunneling

### Local Forward (local -> remote)
```bash
ssh -L 8080:localhost:80 user@server
# Access remote port 80 via localhost:8080
# -N: no shell, -f: background
ssh -L 3306:db.internal:3306 user@bastion -N -f
```

### Remote Forward (remote -> local)
```bash
ssh -R 8080:localhost:3000 user@server
# Remote server port 8080 forwards to local 3000
# Server needs: GatewayPorts yes (for 0.0.0.0 bind)
```

### Dynamic Forward (SOCKS Proxy)
```bash
ssh -D 1080 user@server -N -f
# Configure browser: SOCKS5 localhost:1080
# Or use with proxychains: proxychains firefox
```

### SSH Tunnel as VPN (sshuttle)
```bash
sshuttle -r user@server 0/0 --dns
# Routes all traffic through SSH tunnel
```

## SSH Agent Forwarding Security
```bash
# DANGER: Agent forwarding allows remote to use YOUR keys
# Only enable for trusted hosts
Host trusted-internal
    ForwardAgent yes

# Better: Use ProxyJump instead
Host internal-*
    ProxyJump bastion
```

## SSH Certificates (Advanced)
```bash
# CA key (keep offline!)
ssh-keygen -t ed25519 -f ca_key -C "CA"

# Sign user key
ssh-keygen -s ca_key -I "user@host" -n user -V +52w id_ed25519.pub

# Sign host key
ssh-keygen -s ca_key -I "host.example.com" -h -n host.example.com -V +365d ssh_host_ed25519_key.pub

# Server config (/etc/ssh/sshd_config)
TrustedUserCAKeys /etc/ssh/ca_keys.pub
HostCertificate /etc/ssh/ssh_host_ed25519_key-cert.pub

# Client config
@cert-authority *.example.com ssh-ed25519 AAAA... (CA public key)
```

## Troubleshooting

### Debug Connection
```bash
ssh -vvv user@host              # Verbose debug
ssh -vvv -o PreferredAuthentications=publickey user@host  # Force pubkey

# Test specific key
ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes user@host
```

### Common Issues
```bash
# "Permission denied (publickey)"
# - Check authorized_keys permissions (600)
# - Check ~/.ssh permissions (700)
# - Check key in ssh-agent: ssh-add -l
# - Verify public key matches: ssh-keygen -y -f private_key

# "Host key verification failed"
ssh-keygen -R hostname          # Remove old key
ssh-keyscan hostname >> ~/.ssh/known_hosts

# "Connection reset by peer"
# - Check server logs: journalctl -u sshd
# - Check fail2ban: fail2ban-client status sshd
# - MTU issues: ssh -o "IPQoS=throughput" host

# Slow connection
ssh -o "IPQoS=throughput" host  # Disable QoS
# Or check DNS: UseDNS no in sshd_config

# Agent forwarded but not working
echo $SSH_AUTH_SOCK             # Check socket exists
ssh-add -l                      # Check keys loaded
```

### Connection Keepalive
```bash
# Client-side (~/.ssh/config)
Host *
    ServerAliveInterval 30
    ServerAliveCountMax 3
    TCPKeepAlive yes

# Server-side (/etc/ssh/sshd_config)
ClientAliveInterval 300
ClientAliveCountMax 2
```

## SSH Keys for Automation (CI/CD)
```bash
# Generate deploy key (no passphrase for automation)
ssh-keygen -t ed25519 -f deploy_key -N "" -C "ci-deploy"

# Add public key to server authorized_keys
# Restrict in authorized_keys:
command="/deploy.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA...

# Use in CI
ssh -i deploy_key -o StrictHostKeyChecking=accept-new user@server
```

## SSHFS (Mount Remote FS)
```bash
sshfs user@host:/remote/path /local/mount -o reconnect,ServerAliveInterval=15,ServerAliveCountMax=3
fusermount -u /local/mount      # Unmount
```

## scp / rsync over SSH
```bash
# scp (simple)
scp -P 2222 file.txt user@host:/path/
scp -r user@host:/remote/dir /local/

# rsync (efficient, resume, progress)
rsync -avz -e "ssh -p 2222" /local/ user@host:/remote/
rsync -avz --progress --partial -e ssh /local/ user@host:/remote/
rsync -avz --delete -e ssh user@host:/remote/ /local/   # Mirror
```

## SSH Multiplexing with tmux/screen
```bash
# Persistent sessions on remote
ssh -t user@host "tmux attach || tmux new"
ssh -t user@host "screen -DR"
```