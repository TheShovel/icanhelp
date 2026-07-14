# SSH Practical Guide

Server hardening lives in `ssh-hardening.md`. This file covers client usage, keys, tunnels, and transfers. Key generation uses `sys ssh`; everything else (`ssh`, `scp`, `rsync`, `sshfs`) is universal — use directly.

## Client config (`~/.ssh/config`)
```ssh
Host myserver
    HostName 192.168.1.100
    User admin
    Port 2222
    IdentityFile ~/.ssh/id_ed25519_myserver

Host bastion
    HostName bastion.example.com
    User admin

Host internal-*
    HostName %h.internal.example.com
    ProxyJump bastion
    User admin

# Reuse connections + keepalive
Host *
    ControlMaster auto
    ControlPath ~/.ssh/control/%r@%h:%p
    ControlPersist 10m
    ServerAliveInterval 30
    ServerAliveCountMax 3
    StrictHostKeyChecking accept-new
```

## Key management — use `sys ssh`
```bash
sys ssh key ed25519 "user@host"     # generate an ed25519 key (default type)
sys ssh key rsa "user@host"         # legacy RSA (4096-bit) key
sys ssh pub                         # print your ed25519 public key
sys ssh pub rsa                     # print your rsa public key
```
Raw equivalents: `ssh-keygen -t ed25519 -a 100 -C "user@host"`, `ssh-keygen -t rsa -b 4096 -o -a 100 -C "user@host"`.

### Permissions (critical!)
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_*
chmod 644 ~/.ssh/*.pub ~/.ssh/authorized_keys ~/.ssh/known_hosts
chmod 600 ~/.ssh/config
```

### Agent
```bash
ssh-add ~/.ssh/id_ed25519
ssh-add -l                        # list loaded keys
ssh-add -t 3600 ~/.ssh/id_ed25519 # auto-expire after 1h
```

## Tunneling / port forwarding (universal `ssh`)
```bash
ssh -L 8080:localhost:80 user@server              # local forward
ssh -L 3306:db.internal:3306 user@bastion -N -f   # to internal host
ssh -R 8080:localhost:3000 user@server            # remote forward
ssh -D 1080 user@server -N -f                      # dynamic SOCKS proxy
ssh -J user@bastion user@internal                 # jump host
```
Prefer `ProxyJump` over agent forwarding (`ssh -A`) — forwarding lets the remote use your keys.

## Transfers (universal)
```bash
scp -P 2222 file.txt user@host:/path/
scp -r user@host:/remote/dir /local/
rsync -avz --progress --partial -e "ssh -p 2222" /local/ user@host:/remote/
sshfs user@host:/remote/path /local/mount -o reconnect
fusermount -u /local/mount
```

## Certificates (SSH CA)
```bash
ssh-keygen -t ed25519 -f ca_key -C "CA"          # keep CA key offline
ssh-keygen -s ca_key -I "user@host" -n user -V +52w id_ed25519.pub   # sign user key
ssh-keygen -s ca_key -I host -h -n host.example.com -V +365d ssh_host_ed25519_key.pub
# Server: TrustedUserCAKeys /etc/ssh/ca_keys.pub
# Client: @cert-authority *.example.com <CA public key>
```

## Troubleshooting
```bash
ssh -vvv user@host               # verbose debug
ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes user@host
ssh-keygen -R hostname           # drop stale known_hosts entry
ssh-keyscan hostname >> ~/.ssh/known_hosts
# "Permission denied (publickey)": check ~/.ssh (700) and key (600), ssh-add -l
# Connection reset: sys log show sshd ; sudo fail2ban-client status sshd
```
