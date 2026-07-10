# Linux Networking

## Interface Management
```
ip addr               — show all interfaces and IPs
ip addr show <iface>  — show specific interface
ip link set <iface> up/down — bring interface up/down
ip route              — show routing table
ip route add default via 192.168.1.1 — add default gateway
ip neigh              — show ARP cache
ip -s link            — interface statistics
ip link set <iface> mtu 1500 — set MTU
ip link add <iface> type bridge — create bridge
ethtool <iface>        — show NIC capabilities + link status
ethtool -s <iface> speed 1000 duplex full — set speed
iw dev                — show wireless interfaces
iw list               — show wireless capabilities
rfkill list           — list blocked radios
rfkill unblock wifi   — unblock WiFi
```

## NetworkManager
```
nmcli dev status               — device status
nmcli radio wifi               — wifi on/off
nmcli dev wifi list            — scan networks
nmcli dev wifi connect <SSID> password <pw> — connect
nmcli con show                 — list connections
nmcli con show <name>          — show connection details
nmcli con add type ethernet ifname eth0 — add connection
nmcli con mod <name> ipv4.addresses "192.168.1.100/24"
nmcli con mod <name> ipv4.gateway "192.168.1.1"
nmcli con mod <name> ipv4.dns "8.8.8.8"
nmcli con mod <name> ipv4.method manual — static IP
nmcli con reload               — reload configs
nmcli con down/up <name>       — restart connection
nmtui                         — text-based UI (easier)
```

## DNS
```
resolvectl status               — show DNS config (systemd-resolved)
resolvectl query <domain>       — query DNS
resolvectl dns <iface> <server> — set DNS server
dig example.com                 — DNS lookup (detailed)
dig -x 8.8.8.8                 — reverse lookup
nslookup example.com            — DNS lookup (simple)
host example.com                — DNS lookup (minimal)
hostname -I                     — show local IPs
getent hosts example.com        — system resolver lookup
/etc/hosts                     — local static DNS mapping
/etc/resolv.conf               — DNS servers
/etc/nsswitch.conf             — name resolution order
```
DNS order: `dns` (systemd-resolved) → `myhostname` → `resolve` → `mdns`

## Firewall (nftables/iptables)
```
iptables -L              — list rules
iptables -A INPUT -p tcp --dport 22 -j ACCEPT — allow SSH
iptables -A INPUT -j DROP — default deny input
iptables -t nat -L       — NAT rules
iptables-save > rules    — save rules
iptables-restore < rules — restore rules

# nftables
nft list ruleset         — show all rules
nft add rule inet filter input tcp dport 22 accept
systemctl enable --now nftables

# firewalld (Fedora/RHEL)
firewall-cmd --list-all                     — show zone
firewall-cmd --add-service=http --permanent
firewall-cmd --add-port=8080/tcp --permanent
firewall-cmd --reload
```

## UFW (Ubuntu)
```
ufw enable             — enable firewall
ufw disable            — disable firewall
ufw status             — show rules
ufw allow ssh          — allow SSH
ufw allow 80/tcp       — allow port 80
ufw deny 23            — deny port 23
ufw default deny incoming
ufw default allow outgoing
ufw app list           — list application profiles
ufw allow 'Nginx Full' — allow by app profile
```

## Network Diagnostics
```
ping -c 5 8.8.8.8             — test reachability
traceroute 8.8.8.8            — trace route (UDP)
mtr 8.8.8.8                   — continuous traceroute + ping
curl -v https://example.com   — HTTP test with headers
wget -O /dev/null http://...  — HTTP download test
ss -tulpn                     — listening sockets (modern)
netstat -tulpn                — listening sockets (legacy)
ss -tup                       — active connections
ss -s                         — socket summary
nc -zv host port              — TCP port scan
nc -l -p 8080                 — listen on port (test)
telnet host port              — raw TCP connection (basic)
tcpdump -i eth0 -n port 80    — capture packets
tcpdump -i any host 1.2.3.4  — capture by host
tcpdump -w capture.pcap       — save capture
tshark -r capture.pcap        — analyze capture (CLI wireshark)
tcpdump -X                    — hex + ASCII output
bmon                         — bandwidth monitor
nethogs eth0                  — per-process bandwidth
iftop -i eth0                 — bandwidth per connection
iperf3 -s                     — server mode (speed test)
iperf3 -c server_ip           — client mode
```

## SSH
```
ssh user@host                 — connect
ssh -p 2222 user@host         — non-default port
ssh -i key.pem user@host      — use specific key
ssh -J jump@bastion dest@host — jump host
ssh -L 8080:localhost:80 host — local port forward
ssh -R 8080:localhost:80 host — remote port forward
ssh -D 1080 host              — SOCKS proxy
scp file user@host:/path/     — copy to remote
scp user@host:/path/file .   — copy from remote
rsync -avz dir/ user@host:dir/ — sync to remote
ssh-copy-id user@host         — install public key
ssh-keygen -t ed25519         — generate ed25519 key
ssh-keygen -t rsa -b 4096     — generate RSA key
ssh-add ~/.ssh/id_ed25519     — add key to agent
```
SSH config (`~/.ssh/config`):
```
Host myserver
  HostName 192.168.1.100
  User myuser
  Port 2222
  IdentityFile ~/.ssh/server_key
  LocalForward 8080 localhost:8080
```

## Wireless
```
iwctl                         — iwd interactive CLI
iwctl station wlan0 scan
iwctl station wlan0 get-networks
iwctl station wlan0 connect <SSID>
wpa_passphrase SSID password >> /etc/wpa_supplicant.conf
wpa_supplicant -B -i wlan0 -c /etc/wpa_supplicant.conf
dhclient wlan0                — get IP via DHCP
```

## DHCP
```
dhclient eth0                 — request IP (traditional)
dhcpcd eth0                   — alternative DHCP client
nmcli con mod eth0 ipv4.method auto — use DHCP (NM)
```
DHCP lease files: `/var/lib/dhcp/dhclient.leases`

## VPN
```
# WireGuard
wg-quick up wg0
wg show
wg genkey | tee privatekey | wg pubkey > publickey

# OpenVPN
openvpn --config config.ovpn
systemctl start openvpn@config

# NetworkManager
nmcli con import type wireguard file wg0.conf
nmcli con up wg0
```

## HTTP Tools
```
curl -I https://example.com   — fetch headers only
curl -X POST -d 'key=val' URL — POST request
curl -H "Authorization: Bearer token" URL — custom header
curl -o file URL              — download to file
curl -L URL                   — follow redirects
curl --max-time 10 URL        — timeout 10s
wget -r --no-parent URL       — recursive download
wget -c URL                   — resume partial download
httpie URL                    — friendlier HTTP client
```
