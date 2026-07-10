# SSH Practical Guide

## Basic Use
```bash
ssh user@host
ssh -p 2222 user@host
ssh -i ~/.ssh/id_ed25519 user@host
scp file.txt user@host:/tmp/
sftp user@host
```
Use SSH for remote shell access, file transfer, tunneling, and admin tasks. Prefer key-based login over passwords.

## Key Setup
```bash
ssh-keygen -t ed25519 -C "name-device"
ssh-copy-id user@host
ssh-add ~/.ssh/id_ed25519
```
Ed25519 keys are modern and short. Use a passphrase for keys on laptops or shared machines. Keep private keys in `~/.ssh/` with permissions `600`; keep the directory `700`.

## Client Config
```sshconfig
Host server
  HostName 192.0.2.10
  User alice
  Port 22
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
```
Save repeated options in `~/.ssh/config`. Then connect with `ssh server`. Use separate host entries for work, lab, VPS, and jump hosts.

## Server Hardening
Edit `/etc/ssh/sshd_config` carefully:
```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers alice
```
Restart with `sudo systemctl restart sshd` or `sudo systemctl restart ssh`. Keep an existing session open while testing new config so you do not lock yourself out.

## Tunnels
```bash
ssh -L 8080:localhost:80 user@host
ssh -R 9000:localhost:3000 user@host
ssh -D 1080 user@host
```
`-L` forwards local traffic to a remote destination. `-R` exposes a local service through the remote host. `-D` creates a SOCKS proxy for applications that support it.

## Jump Hosts
```bash
ssh -J bastion user@internal-host
```
Use `ProxyJump` when a server is reachable only through a bastion host. This is cleaner than manually SSHing into one host and then another.

## Troubleshooting
```bash
ssh -v user@host
ssh -vvv user@host
journalctl -u ssh --no-pager
journalctl -u sshd --no-pager
```
Common failures: wrong username, blocked port, missing public key, bad file permissions, server using `sshd` vs `ssh` service name, or password login disabled before keys were installed.

## Known Hosts
`known_hosts` protects against man-in-the-middle attacks. Do not blindly delete host key warnings. If a server was rebuilt, verify the new fingerprint through a trusted channel, then remove the old entry with `ssh-keygen -R hostname`.
