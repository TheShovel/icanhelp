# Linux Networking Practical Guide

## Network Interface Management

### ip Command (Modern Replacement for ifconfig)
```bash
# Show interfaces
ip link show
ip -br link show          # Brief
ip -br -c link show       # With colors

# Show addresses
ip addr show
ip -br addr show
ip -4 addr show           # IPv4 only
ip -6 addr show           # IPv6 only

# Add/remove IP
ip addr add 192.168.1.100/24 dev eth0
ip addr del 192.168.1.100/24 dev eth0

# Up/down
ip link set eth0 up
ip link set eth0 down

# MTU
ip link set eth0 mtu 9000

# MAC address
ip link set eth0 address aa:bb:cc:dd:ee:ff

# Promiscuous mode
ip link set eth0 promisc on
```

### NetworkManager (nmcli)
```bash
# Device status
nmcli device status

# Show connections
nmcli connection show
nmcli connection show --active

# Create connection
nmcli con add type ethernet con-name "Wired" ifname eth0 ip4 192.168.1.100/24 gw4 192.168.1.1
nmcli con add type wifi con-name "WiFi" ifname wlan0 ssid "MySSID" password "pass"

# Modify connection
nmcli con mod "Wired" ipv4.dns "8.8.8.8 1.1.1.1"
nmcli con mod "Wired" ipv4.method manual
nmcli con mod "Wired" ipv4.addresses "192.168.1.100/24"
nmcli con mod "Wired" ipv4.gateway "192.168.1.1"

# Up/down
nmcli con up "Wired"
nmcli con down "Wired"

# Reload
nmcli con reload
```

### systemd-networkd
```ini
# /etc/systemd/network/20-wired.network
[Match]
Name=eth0

[Network]
DHCP=yes
# Or static:
# Address=192.168.1.100/24
# Gateway=192.168.1.1
# DNS=8.8.8.8
# DNS=1.1.1.1

[DHCP]
UseDNS=yes
```

```bash
systemctl enable --now systemd-networkd
systemctl enable --now systemd-resolved
```

## Routing

### Show Routes
```bash
ip route show
ip route show table all
ip -4 route show
ip -6 route show
```

### Add/Remove Routes
```bash
# Default gateway
ip route add default via 192.168.1.1 dev eth0
ip route del default

# Specific network
ip route add 10.0.0.0/8 via 192.168.1.254 dev eth0

# Source-based routing
ip route add default via 10.0.0.1 dev eth1 table 100
ip rule add from 192.168.2.0/24 table 100
```

### Persistent Routes
```bash
# /etc/sysconfig/network-scripts/route-eth0 (RHEL)
# 10.0.0.0/8 via 192.168.1.254 dev eth0

# /etc/network/interfaces (Debian)
# up ip route add 10.0.0.0/8 via 192.168.1.254 dev eth0

# systemd-networkd
# [Route]
# Destination=10.0.0.0/8
# Gateway=192.168.1.254
```

## DNS

### Resolvers
```bash
# Check current
cat /etc/resolv.conf
resolvectl status

# systemd-resolved
systemctl status systemd-resolved
resolvectl query example.com
resolvectl flush-caches

# Traditional
cat /etc/resolv.conf
# nameserver 8.8.8.8
# nameserver 1.1.1.1
# search example.com
```

### DNS Tools
```bash
# dig (verbose)
dig example.com
dig +short example.com
dig @8.8.8.8 example.com
dig example.com A
dig example.com AAAA
dig example.com MX
dig example.com TXT
dig example.com NS
dig -x 8.8.8.8          # Reverse lookup
dig +trace example.com  # Trace delegation

# drill (minimal)
drill example.com

# host
host example.com
host -t mx example.com

# nslookup (interactive)
nslookup example.com
```

### /etc/hosts
```bash
127.0.0.1       localhost
127.0.1.1       hostname
192.168.1.100   myserver.local myserver
```

## Network Diagnostics

### Connectivity
```bash
# Ping
ping -c 4 8.8.8.8
ping -c 4 example.com
ping -I eth0 8.8.8.8        # From specific interface
ping -s 1472 -M do 8.8.8.8  # Test MTU (1472+28=1500)

# Traceroute
traceroute 8.8.8.8
traceroute -T -p 80 8.8.8.8  # TCP traceroute
tracepath 8.8.8.8            # MTU discovery
mtr 8.8.8.8                  # Combined ping+traceroute
mtr -r -c 10 8.8.8.8         # Report mode
```

### Port Testing
```bash
# netcat
nc -zv 8.8.8.8 53           # UDP
nc -zv example.com 80       # TCP
nc -l -p 8080               # Listen

# nmap
nmap -p 80,443 example.com
nmap -sS 192.168.1.0/24     # SYN scan
nmap -sU 192.168.1.1        # UDP scan
nmap -p- 192.168.1.1        # All ports

# ss (socket statistics)
ss -tuln                    # Listening TCP/UDP
ss -tupn                    # With PID/process
ss -s                       # Summary
ss -ti                      # TCP info (cwnd, rtt)
ss -o state established     # With timers

# netstat (legacy)
netstat -tulnp
netstat -s                  # Statistics
```

### Bandwidth Testing
```bash
# iperf3
iperf3 -s                   # Server
iperf3 -c server            # Client
iperf3 -c server -R         # Reverse (download)
iperf3 -c server -P 10      # 10 parallel streams
iperf3 -c server -u -b 1G   # UDP, 1Gbps

# speedtest-cli
speedtest-cli

# Simple HTTP download
curl -o /dev/null -w "%{speed_download}\n" http://speedtest.example.com/100MB.bin
```

### Packet Capture
```bash
# tcpdump
tcpdump -i eth0 -n
tcpdump -i eth0 -n port 80
tcpdump -i eth0 -n host 192.168.1.100
tcpdump -i eth0 -n tcp port 443 -w capture.pcap
tcpdump -r capture.pcap -n
tcpdump -i eth0 -n -s 0 -vvv  # Verbose, full packets

# Wireshark (GUI)
wireshark capture.pcap

# tshark (CLI Wireshark)
tshark -i eth0 -f "port 80"
tshark -r capture.pcap -Y "http.request"
```

## Network Namespaces (Containers)

```bash
# Create namespace
ip netns add ns1
ip netns list

# Execute in namespace
ip netns exec ns1 ip addr
ip netns exec ns1 ping 8.8.8.8

# Virtual ethernet pair
ip link add veth0 type veth peer name veth1
ip link set veth1 netns ns1
ip addr add 10.0.0.1/30 dev veth0
ip netns exec ns1 ip addr add 10.0.0.2/30 dev veth1
ip link set veth0 up
ip netns exec ns1 ip link set veth1 up
ip netns exec ns1 ip link set lo up

# NAT for namespace internet
iptables -t nat -A POSTROUTING -s 10.0.0.0/30 -o eth0 -j MASQUERADE
ip netns exec ns1 ip route add default via 10.0.0.1
```

## Firewall (nftables)

```bash
# Tables, chains, rules
nft list tables
nft list ruleset

# Basic firewall
nft add table inet filter
nft add chain inet filter input { type filter hook input priority 0 \; policy drop \; }
nft add chain inet filter forward { type filter hook forward priority 0 \; policy drop \; }
nft add chain inet filter output { type filter hook output priority 0 \; policy accept \; }

# Allow loopback
nft add rule inet filter input iif lo accept

# Allow established/related
nft add rule inet filter input ct state established,related accept

# Allow SSH
nft add rule inet filter input tcp dport 22 accept

# Allow HTTP/HTTPS
nft add rule inet filter input tcp dport {80, 443} accept

# Allow ICMP
nft add rule inet filter input ip protocol icmp accept

# Save
nft list ruleset > /etc/nftables.conf
```

```bash
# systemd service
systemctl enable --now nftables
```

### UFW (Ubuntu/Debian)
```bash
ufw enable
ufw status
ufw status numbered
ufw allow 22/tcp
ufw allow 80,443/tcp
ufw allow from 192.168.1.0/24 to any port 22
ufw deny 23
ufw delete 1
ufw reset
```

### firewalld (RHEL/Fedora)
```bash
firewall-cmd --state
firewall-cmd --get-active-zones
firewall-cmd --list-all
firewall-cmd --add-service=ssh --permanent
firewall-cmd --add-port=8080/tcp --permanent
firewall-cmd --add-rich-rule='rule family="ipv4" source address="192.168.1.0/24" service name="ssh" accept' --permanent
firewall-cmd --reload
```

## SSH Tunneling

```bash
# Local forward (local port → remote host:port)
ssh -L 8080:localhost:80 user@server
ssh -L 3306:db.internal:3306 user@bastion -N -f

# Remote forward (remote port → local host:port)
ssh -R 8080:localhost:3000 user@server
# Server needs: GatewayPorts yes (for 0.0.0.0 bind)

# Dynamic forward (SOCKS proxy)
ssh -D 1080 user@server -N -f
# Browser: SOCKS5 localhost:1080

# Jump host
ssh -J user@bastion user@internal
ssh -J user@bastion,user@internal2 user@target

# SSH config for tunnels
Host tunnel
    HostName server
    User user
    LocalForward 8080 localhost:80
    RemoteForward 9090 localhost:3000
    DynamicForward 1080
```

## VPN

### WireGuard
```ini
# /etc/wireguard/wg0.conf
[Interface]
PrivateKey = <server-private-key>
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = <client-public-key>
AllowedIPs = 10.0.0.2/32
```

```bash
# Client
[Interface]
PrivateKey = <client-private-key>
Address = 10.0.0.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = <server-public-key>
Endpoint = server.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

```bash
wg-quick up wg0
wg-quick down wg0
wg show
systemctl enable --now wg-quick@wg0
```

### OpenVPN
```bash
# Server setup (use openvpn-install script)
# Client config: client.ovpn
openvpn --config client.ovpn
systemctl enable --now openvpn@client
```

## Network Monitoring

### Continuous
```bash
# bmon - bandwidth monitor
bmon

# iftop - per-connection
iftop -i eth0

# nethogs - per-process
nethogs eth0

# vnstat - historical
vnstat -i eth0
vnstat -i eth0 -d     # Daily
vnstat -i eth0 -m     # Monthly

# nload - simple graph
nload eth0
```

### Systemd-networkd Metrics
```bash
networkctl status
networkctl list
networkctl lldp
```

## Troubleshooting Checklist

```bash
# 1. Interface up?
ip link show eth0

# 2. IP assigned?
ip addr show eth0

# 3. Gateway reachable?
ping -c 3 <gateway>

# 4. DNS working?
dig @8.8.8.8 example.com
dig example.com

# 5. Route correct?
ip route get 8.8.8.8

# 6. Firewall blocking?
nft list ruleset
iptables -L -n -v

# 7. Port listening?
ss -tuln | grep :80

# 8. Process owning port?
ss -tulpn | grep :80

# 9. MTU issues?
ping -M do -s 1472 <host>

# 10. ARP table
ip neigh show
arp -n
```

## Advanced Topics

### VLAN
```bash
# Create VLAN interface
ip link add link eth0 name eth0.100 type vlan id 100
ip addr add 192.168.100.1/24 dev eth0.100
ip link set eth0.100 up

# systemd-networkd
# /etc/systemd/network/20-vlan.netdev
[NetDev]
Name=eth0.100
Kind=vlan

[VLAN]
Id=100
```

### Bonding (Link Aggregation)
```bash
# /etc/modprobe.d/bonding.conf
options bonding mode=4 miimon=100 lacp_rate=fast

# systemd-networkd
# /etc/systemd/network/20-bond.netdev
[NetDev]
Name=bond0
Kind=bond

[Bond]
Mode=802.3ad
LACPTransmitRate=fast
MIIMonitorSec=100

# /etc/systemd/network/20-bond.network
[Match]
Name=bond0

[Network]
DHCP=yes

# /etc/systemd/network/20-eth0.network
[Match]
Name=eth0

[Network]
Bond=bond0
```

### Bridge
```bash
# Create bridge
ip link add name br0 type bridge
ip link set eth0 master br0
ip link set br0 up
ip addr add 192.168.1.10/24 dev br0
```

### Traffic Control (tc)
```bash
# Limit bandwidth
tc qdisc add dev eth0 root tbf rate 1mbit burst 32kbit latency 400ms

# Priority queuing
tc qdisc add dev eth0 root handle 1: prio bands 3
tc qdisc add dev eth0 parent 1:1 handle 10: pfifo_fast
tc qdisc add dev eth0 parent 1:2 handle 20: pfifo_fast
tc qdisc add dev eth0 parent 1:3 handle 30: sfq perturb 10
tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip dport 22 0xffff flowid 1:1
tc filter add dev eth0 protocol ip parent 1:0 prio 2 u32 match ip dport 80 0xffff flowid 1:2
tc filter add dev eth0 protocol ip parent 1:0 prio 3 u32 match ip dport 443 0xffff flowid 1:2

# Show
tc qdisc show dev eth0
tc filter show dev eth0
```