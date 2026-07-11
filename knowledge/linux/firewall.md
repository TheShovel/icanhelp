# Linux Firewalls & Packet Filtering

## UFW (Uncomplicated Firewall) — Debian/Ubuntu
```
ufw enable                      — turn firewall on (blocks all incoming by default)
ufw disable                     — turn off
ufw status verbose              — show rules + logging
ufw status numbered             — show rules with index (for deletes)
ufw default deny incoming       — block inbound (recommended)
ufw default allow outgoing      — allow outbound
ufw allow 22/tcp                — open SSH
ufw allow 80,443/tcp            — open web
ufw allow from 10.0.0.0/8       — allow subnet
ufw allow from 192.168.1.10 to any port 3306 — restrict by source
ufw deny 23/tcp                 — explicitly deny
ufw delete 3                    — delete rule by number
ufw reset                       — remove all rules
```
Application profiles live in `/etc/ufw/applications.d/`. Enable with `ufw allow OpenSSH`.

## firewalld — RHEL/Fedora/CentOS
```
firewall-cmd --state                       — check running
firewall-cmd --list-all                    — active zone config
firewall-cmd --get-active-zones             — zones bound to interfaces
firewall-cmd --permanent --add-service=http — persist service
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --reload                       — apply permanent rules
firewall-cmd --add-source=10.1.0.0/16 --zone=trusted — trust subnet
firewall-cmd --runtime-to-permanent         — save running to permanent
```
Zones: `drop` (lowest trust), `block`, `public` (default), `internal`, `trusted` (all allowed).

## nftables (modern replacement for iptables)
```
nft list ruleset                 — show all rules
nft add table inet filter        — create table
nft add chain inet filter input { type filter hook input priority 0 \; }
nft add rule inet filter input tcp dport 22 accept
nft add rule inet filter input ct state established,related accept
nft add rule inet filter input drop
```
Config file: `/etc/nftables.conf`. Start with `systemctl enable --now nftables`.

## iptables (legacy)
```
iptables -L -n -v                — list rules with counters
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -j DROP        — default deny (apply last)
iptables -F                      — flush all rules (careful over SSH)
iptables-save > /etc/iptables/rules.v4   — persist
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE — NAT/router
```
Chains: `INPUT`, `OUTPUT`, `FORWARD`. Tables: `filter` (default), `nat`, `mangle`.

## Port scanning with nmap
```
nmap -sV 192.168.1.1             — service/version detection
nmap -p- 10.0.0.5                — scan all 65535 ports
nmap -sC -sV -oA scan host       — default scripts + version, output all formats
nmap -sn 192.168.0.0/24          — ping sweep (host discovery)
sudo nmap -A host                — OS detect + scripts + traceroute
```
SYN scan (`-sS`) needs root. Use `-Pn` to skip host discovery when ICMP is blocked.

## Connection inspection
```
ss -tulnp                       — listening TCP/UDP sockets + processes
ss -tnp state established       — active connections
ss -s                           — summary statistics
conntrack -L                    — view NAT/conntrack table
```
Prefer `ss` over deprecated `netstat`.

## Fail2ban (brute-force protection)
```
fail2ban-client status                      — jails active
fail2ban-client status sshd                 — per-jail info
fail2ban-client set sshd unbanip 1.2.3.4    — unban
```
Config: `/etc/fail2ban/jail.local`. Ban repeated auth failures automatically.
