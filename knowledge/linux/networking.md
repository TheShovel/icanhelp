# Linux Networking (Practical)

Command-focused reference. Firewall specifics live in `firewall.md`; VPN/WireGuard in `wireguard.md`; SSH tunnels in `ssh-practical.md`.

## Quick inspection with `sys net` (all distros)
```bash
sys net interfaces    # brief interface + address list (ip -br addr show)
sys net routes        # routing table (ip route show)
sys net dns           # DNS config (resolvectl status / /etc/resolv.conf)
sys net listen        # listening sockets + process (ss -tulnp)
sys net scan 80       # check for a listener on a port (ss + grep)
sys net apply         # apply netplan (Debian) or restart systemd-networkd (Arch)
```

## Interface & address (`ip` — universal, use directly)
```bash
ip -br link show
ip -br addr show
ip link set eth0 up
ip addr add 192.168.1.100/24 dev eth0
ip addr del 192.168.1.100/24 dev eth0
ip link set eth0 mtu 9000
ip neigh show                    # ARP/NDP table
```

## Routing (`ip` — universal)
```bash
ip route show
ip route add default via 192.168.1.1 dev eth0
ip route del default
ip route get 8.8.8.8            # resolve path for a destination
```

## DNS
```bash
cat /etc/resolv.conf             # current resolvers
resolvectl status               # systemd-resolved
dig example.com                 # full lookup (dig +short for just the answer)
dig -x 8.8.8.8                  # reverse lookup
host example.com / nslookup example.com
```
`/etc/hosts` is consulted before DNS:
```
127.0.0.1   localhost
192.168.1.100   myserver.local myserver
```

## Diagnostics & connectivity (universal)
```bash
ping -c4 8.8.8.8
ping -I eth0 8.8.8.8
ping -M do -s 1472 8.8.8.8      # MTU probe (1472+28=1500)
tracepath 8.8.8.8              # path MTU discovery (no root)
traceroute -T -p 80 8.8.8.8    # TCP traceroute
```

## Port & socket inspection (`ss` — universal, prefer over netstat)
```bash
ss -tulnp                       # listening TCP/UDP + process
ss -tnp state established       # active connections
ss -s                           # summary
nc -zv example.com 80           # TCP port probe
nmap -p 80,443 example.com      # service probe (needs nmap)
```

## Bandwidth & capture (tools may need install)
```bash
iperf3 -s / iperf3 -c server -R
tcpdump -i eth0 -n port 80      # live capture (needs tcpdump)
```

## systemd-networkd (config files)
```ini
# /etc/systemd/network/20-wired.network
[Match]
Name=eth0
[Network]
DHCP=yes
# Address=192.168.1.100/24 / Gateway=192.168.1.1 / DNS=8.8.8.8
```
Apply with `sys net apply`, or natively `networkctl status` / `networkctl list`.

## Netplan (Ubuntu Server)
Ubuntu Server renders networking via netplan to NetworkManager or systemd-networkd. Arch does **not** use netplan.
```yaml
# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: true
```
Apply with `sys net apply` (runs `sudo netplan apply`), or `sudo netplan try` for 120s auto-rollback.

## NetworkManager (`nmcli`)
```bash
nmcli device status
nmcli connection show --active
nmcli con add type ethernet con-name Wired ifname eth0 ip4 192.168.1.100/24 gw4 192.168.1.1
nmcli con mod Wired ipv4.dns "8.8.8.8 1.1.1.1"
nmcli con up Wired
```

## Troubleshooting checklist
```bash
ip link show eth0               # 1. interface up?
ip addr show eth0               # 2. address assigned?
ping -c3 <gateway>              # 3. gateway reachable?
dig @8.8.8.8 example.com       # 4. DNS working?
ip route get 8.8.8.8           # 5. route correct?
sys net listen | grep :80       # 6. port listening?
ping -M do -s 1472 <host>       # 8. MTU issue?
```

## Advanced (config-only)
```bash
# VLAN
ip link add link eth0 name eth0.100 type vlan id 100
# Bridge
ip link add name br0 type bridge
ip link set eth0 master br0
# Network namespace
ip netns add ns1
```
