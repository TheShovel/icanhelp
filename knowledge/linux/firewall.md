# Linux Firewalls & Packet Filtering

Use `sys firewall` for the common operations — it picks UFW (Debian/Ubuntu), firewalld (RHEL/Fedora), or nftables (Arch) automatically. Run via `sys firewall ...` (sudo added automatically).

## Common operations (all distros)
```bash
sys firewall status            # show active rules (ufw/firewalld/nftables)
sys firewall allow 22/tcp      # open a port (proto defaults to tcp)
sys firewall allow 80          # tcp assumed
sys firewall deny 23/tcp       # block a port
sys firewall reset             # reset to defaults (use with care)
```

## What `sys firewall` maps to
- **Debian/Ubuntu (UFW)**: `sudo ufw allow 22/tcp`, `sudo ufw status verbose`, `sudo ufw --force reset`.
- **RHEL/Fedora (firewalld)**: `sudo firewall-cmd --add-port=8080/tcp --permanent && sudo firewall-cmd --reload`, `sudo firewall-cmd --list-all`.
- **Arch (nftables)**: `sudo nft add rule inet filter input tcp dport 22 accept`, `sudo nft list ruleset`.

Pick one frontend and stay consistent. Defaults differ by distro: UFW on Debian/Ubuntu, firewalld on RHEL/Fedora, nftables (or install `ufw`) on Arch.

## Raw nftables (Arch, advanced)
```bash
sudo nft list ruleset
sudo nft add table inet filter
sudo nft add chain inet filter input '{ type filter hook input priority 0 ; policy drop ; }'
sudo nft add rule inet filter input ct state established,related accept
sudo nft add rule inet filter input tcp dport 22 accept
sudo nft list ruleset > /etc/nftables.conf   # persist
sudo systemctl enable --now nftables         # sys svc has no --now
```

## Raw iptables (legacy)
```bash
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -j DROP        # default deny — apply LAST
sudo iptables -F                      # flush (careful over SSH)
```
Chains: `INPUT`, `OUTPUT`, `FORWARD`. Tables: `filter` (default), `nat`, `mangle`.

## Port scanning (nmap, not wrapped)
```bash
nmap -sV 192.168.1.1              # service/version detection
nmap -p- 10.0.0.5                 # all 65535 ports
sudo nmap -A host                 # OS detect + scripts (needs root)
```
SYN scan (`-sS`) needs root. Use `-Pn` when ICMP is blocked.

## Fail2ban (brute-force protection)
```bash
sudo fail2ban-client status
sudo fail2ban-client status sshd
sudo fail2ban-client set sshd unbanip 1.2.3.4
```
Config: `/etc/fail2ban/jail.local`.
