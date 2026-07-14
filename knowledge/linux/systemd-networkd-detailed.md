# systemd-networkd (Network Configuration)

systemd-native network management, an alternative to NetworkManager. Uses `.network` and `.netdev` files and integrates with `systemd-resolved` (see `systemd-resolved.md`). Apply changes with `sys net apply` (restarts systemd-networkd on Arch; runs netplan on Debian).

## File locations (priority high→low)
- `/etc/systemd/network/` — admin config (highest)
- `/run/systemd/network/` — runtime config
- `/usr/lib/systemd/network/` — vendor defaults
Name files `10-`, `20-`, … to control lexicographic order.

## Basic configuration
```ini
# /etc/systemd/network/20-wired.network
[Match]
Name=eth0

[Network]
DHCP=yes
IPv6AcceptRA=yes
# static:
# Address=192.168.1.100/24
# Gateway=192.168.1.1
# DNS=1.1.1.1
```
Multiple addresses: repeat `Address=`.

## Bridge
```ini
# 20-br0.netdev
[NetDev]
Name=br0
Kind=bridge
```
```ini
# 25-eth0.network — attach port
[Network]
Bridge=br0
```

## VLAN
```ini
# 20-vlan100.netdev
[NetDev]
Name=eth0.100
Kind=vlan
[VLAN]
Id=100
```

## Bond (link aggregation)
```ini
# 20-bond0.netdev
[NetDev]
Name=bond0
Kind=bond
[Bond]
Mode=802.3ad
```

## WireGuard
```ini
# 20-wg0.network
[Network]
DHCP=yes
[WireGuard]
PrivateKey=<base64 private key>
ListenPort=51820
[WireGuardPeer]
PublicKey=<base64 peer key>
AllowedIPs=10.0.0.0/24
Endpoint=192.168.1.2:51820
PersistentKeepalive=25
```

## DNS / domains (passed to systemd-resolved)
```ini
[Network]
DNS=1.1.1.1
FallbackDNS=8.8.8.8
Domains=~example.com        # ~ = route-only
[DHCPv4]
UseDNS=true
UseNTP=true
```

## Routing & policy
```ini
# 30-routes.network
[Route]
Gateway=192.168.1.1
Destination=10.0.0.0/8
Metric=100
```

## networkctl commands
```
networkctl list                       # all interfaces
networkctl status eth0              # detailed status
networkctl up eth0 / down eth0     # bring link up/down
networkctl renew eth0               # renew DHCP lease
networkctl reload                   # reload .network/.netdev files
```

## Troubleshooting
```
networkctl status eth0
sys log show systemd-networkd        # journal (since "1 hour ago")
networkctl renew eth0                 # no DHCP?
sys net dns                           # DNS not working? (see systemd-resolved.md)
ls -la /etc/resolv.conf              # should -> ../run/systemd/resolve/stub-resolv.conf
```
Debug: `SYSTEMD_LOG_LEVEL=debug networkctl status eth0`.
