# systemd-networkd Detailed Configuration

## Overview
- `systemd-networkd` — systemd native network management
- Alternative to NetworkManager
- Uses `.network` and `.netdev` files
- Integrated with systemd-resolved

## Configuration Files

### Network Files
- `/etc/systemd/network/` — main config directory
- `20-wired.network` — interface config
- `25-wireless.network` — wireless config
- Files processed in lexicographic order

### Netdev Files
- `20-vlan.netdev` — VLAN device
- `20-bond.netdev` — bonded interface
- `20-bridge.netdev` — bridge device

### Priority Order
1. `/etc/systemd/network/` — admin config
2. `/run/systemd/network/` — runtime config
3. `/usr/lib/systemd/network/` — vendor defaults

## Basic Network Configuration

### DHCP Configuration
```
# /etc/systemd/network/20-wired.network
[Match]
Name=eth0

[Network]
DHCP=yes
IPv6AcceptRA=yes
```

### Static IP Configuration
```
# /etc/systemd/network/20-static.network
[Match]
Name=eth0

[Network]
Address=192.168.1.100/24
Gateway=192.168.1.1
DNS=1.1.1.1
DNS=8.8.8.8
```

### Multiple Addresses
```
# /etc/systemd/network/20-multi.network
[Match]
Name=eth0

[Network]
Address=192.168.1.100/24
Address=10.0.0.100/16
Gateway=192.168.1.1
DNS=1.1.1.1
```

## Bridge Configuration

### Bridge Device
```
# /etc/systemd/network/20-br0.netdev
[NetDev]
Name=br0
Kind=bridge

[Bridge]
STP=true
ForwardDelaySec=15
```

### Bridge Ports
```
# /etc/systemd/network/25-eth0.network
[Match]
Name=eth0

[Network]
Bridge=br0
```

### Bridge Network
```
# /etc/systemd/network/30-br0.network
[Match]
Name=br0

[Network]
DHCP=yes
# Or static
# Address=192.168.1.1/24
```

## VLAN Configuration

### VLAN Device
```
# /etc/systemd/network/20-vlan100.netdev
[NetDev]
Name=eth0.100
Kind=vlan

[VLAN]
Id=100
```

### VLAN Network
```
# /etc/systemd/network/25-vlan100.network
[Match]
Name=eth0.100

[Network]
DHCP=yes
# Or static
# Address=192.168.100.100/24
```

### Multiple VLANs
```
# /etc/systemd/network/20-vlans.netdev
[NetDev]
Name=vlan100
Kind=vlan

[VLAN]
Id=100
```

## Bonding (Link Aggregation)

### Bond Device
```
# /etc/systemd/network/20-bond0.netdev
[NetDev]
Name=bond0
Kind=bond

[Bond]
Mode=802.3ad
TransmitHashPolicy=layer2+3
MIIMonitorSec=100
LACPTransmitRate=fast
```

### Bond Slaves
```
# /etc/systemd/network/25-eth0.network
[Match]
Name=eth0

[Network]
Bond=bond0
```

```
# /etc/systemd/network/26-eth1.network
[Match]
Name=eth1

[Network]
Bond=bond0
```

### Bond Network
```
# /etc/systemd/network/30-bond0.network
[Match]
Name=bond0

[Network]
DHCP=yes
# Or
# Address=192.168.1.100/24
# Gateway=192.168.1.1
```

## Team Configuration (Alternative Bonding)
```
# /etc/systemd/network/20-team0.netdev
[NetDev]
Name=team0
Kind=team
```

## VLAN Trunking

### Trunk with Native VLAN
```
# /etc/systemd/network/20-trunk.network
[Match]
Name=eth0

[Network]
VLAN=eth0.100
VLAN=eth0.200
```

### Native VLAN
```
# /etc/systemd/network/20-native.network
[Match]
Name=eth0

[Network]
VLAN=native
```

## MACVLAN Configuration

### MACVLAN Device
```
# /etc/systemd/network/20-macvlan0.netdev
[NetDev]
Name=macvlan0
Kind=macvlan

[MACVLAN]
Mode=bridge
Parent=eth0
```

### MACVLAN Network
```
# /etc/systemd/network/25-macvlan0.network
[Match]
Name=macvlan0

[Network]
DHCP=yes
```

## VXLAN Configuration

### VXLAN Device
```
# /etc/systemd/network/20-vxlan.netdev
[NetDev]
Name=vxlan0
Kind=vxlan

[VXLAN]
Id=100
Remote=192.168.1.1
VNI=100
```

## WireGuard Configuration

### WireGuard via systemd-networkd
```
# /etc/systemd/network/20-wg0.network
[Match]
Name=wg0

[Network]
DHCP=yes

[WireGuard]
PrivateKey=basename64PrivateKey==
ListenPort=51820

[WireGuardPeer]
PublicKey=peerPublicKeyBase64==
AllowedIPs=10.0.0.0/24
Endpoint=192.168.1.2:51820
PersistentKeepalive=25
```

## IPv6 Configuration

### IPv6 Settings
```
# /etc/systemd/network/20-ipv6.network
[Match]
Name=eth0

[Network]
DHCP=yes
IPv6AcceptRA=yes
IPv6SendRA=yes
```

### IPv6 Static
```
# /etc/systemd/network/20-ipv6.network
[Match]
Name=eth0

[Network]
Address=fd00::1/64
Gateway=fd00::ffff
DNS=2001:4860:4860::8888
```

## DNS Configuration

### DNS Integration with resolved
```
# /etc/systemd/network/20-dns.network
[Match]
Name=eth0

[Network]
DHCP=yes
DNS=1.1.1.1
FallbackDNS=8.8.8.8
Domains=~example.com
```

### Domains Explanation
- `example.com` — route all queries to this DNS
- `~example.com` — only route .example.com queries
- Multiple domains separated by space

## DHCP Options

### DHCP with Custom Options
```
# /etc/systemd/network/20-dhcp.network
[Match]
Name=eth0

[Network]
DHCP=yes

[DHCPv4]
UseDNS=true
UseNTP=true
UseRoutes=true
UseHostname=false
```

### Send Vendor Class
```
[DHCPv4]
VendorClassIdentifier=MyDevice
```

### Custom DHCP Options
```
[DHCPv4]
SendOption=119=example.com  # Domain search
SendOption=60=MyClient
```

## Bridge Settings

### STP (Spanning Tree)
```
[Network]
Bridge=br0

[Bridge]
STP=true
ForwardDelaySec=15
HelloTimeSec=2
MaxAgeSec=20
RootCost=100
Priority=32768
```

### Bridge Port Settings
```
[Network]
Bridge=br0

[BridgePort]
STP=true
Priority=32
Cost=100
```

## Routing

### Static Routes
```
# /etc/systemd/network/30-routes.network
[Match]
Name=eth0

[Route]
Gateway=192.168.1.1
Destination=10.0.0.0/8

[Route]
Gateway=10.0.0.1
Destination=192.168.100.0/24
Metric=100
```

### Policy Routing
```
# /etc/systemd/network/30-policy.network
[Match]
Name=eth0

[RoutingPolicyRule]
Priority=100
Table=100
From=192.168.2.0/24
```

## Link Settings

### Duplex and Speed
```
[Link]
Duplex=full
SpeedMBytes=1000
```

### Wake-on-LAN
```
[Link]
WakeOnLan=magic
```

## VLAN Filtering

### Bridge VLAN Filtering
```
# /etc/systemd/network/20-br0.netdev
[NetDev]
Name=br0
Kind=bridge

[Bridge]
VLANFiltering=true
```

### VLAN on Bridge Port
```
# /etc/systemd/network/25-eth0.network
[Match]
Name=eth0

[Network]
Bridge=br0

[BridgeVLAN]
VLAN=100
```

## Network Management Commands

### Basic Operations
- `networkctl` — main command
- `networkctl status eth0` — interface status
- `networkctl list` — all interfaces
- `networkctl reload eth0` — reload config
- `networkctl renew eth0` — renew DHCP
- `networkctl up eth0` — bring up
- `networkctl down eth0` — take down

### Network Status
- `networkctl status` — detailed status
- `networkctl lldp` — LLDP neighbors
- `networkctl --json status` — JSON output
- `networkctl --now` — show now column

### Reload Configuration
```bash
# Reload all
networkctl reload

# Or via systemd
systemctl restart systemd-networkd
```

## DHCPv6 Configuration

### DHCPv6 Options
```
[DHCPServer]
PoolOffset=100
PoolSize=100
DefaultLeaseTimeSec=1hour
MaxLeaseTimeSec=1week
```

### RA (Router Advertisement)
```
[IPv6AcceptRA]
UseAutonomousPrefix=true
UseOnLinkPrefix=true
```

## DNSMasq Integration

### DNS Server
```
# /etc/systemd/network/20-dns.network
[Network]
DNS=127.0.0.1
```

## Bridge FDB (Forwarding Database)

### Static FDB Entries
```
[Network]
# ...

[FDBEntry]
MACAddress=00:11:22:33:44:55
VLAN=100
```

## Network Troubleshooting

### Debug Network
```bash
# Check config
networkctl status eth0

# Check LLDP
networkctl lldp

# Check DNS
resolvectl status

# Check routing
networkctl routing eth0

# Reload
networkctl reload
```

### Common Issues

#### No DHCP
```bash
# Check carrier
networkctl status eth0

# Check DHCP logs
journalctl -u systemd-networkd --since "1 hour ago"

# Renew manually
networkctl renew eth0
```

#### No DNS
```bash
# Check resolved
systemctl status systemd-resolved

# Check DNS in network config
networkctl --no-pager status eth0 | grep DNS
```

#### Bridge Not Working
```bash
# Check bridge status
networkctl status br0

# Check ports
bridge link show

# Check VLANs
bridge vlan show
```

## systemd-networkd Examples

### Simple DHCP
```
# /etc/systemd/network/10-eth.network
[Match]
Name=eth*

[Network]
DHCP=yes
```

### Static + VLAN
```
# /etc/systemd/network/10-eth.network
[Match]
Name=eth0

[Network]
VLAN=eth0.10
VLAN=eth0.20

# /etc/systemd/network/20-vlan10.network
[Match]
Name=eth0.10

[Network]
Address=192.168.10.1/24

# /etc/systemd/network/20-vlan20.network
[Match]
Name=eth0.20

[Network]
DHCP=yes
```

### Bond + Bridge
```
# /etc/systemd/network/10-bond.network
[NetDev]
Name=bond0
Kind=bond

[Bond]
Mode=active-backup

# /etc/systemd/network/20-br0.network
[NetDev]
Name=br0
Kind=bridge

[Bridge]
VLANFiltering=true

# /etc/systemd/network/30-slave.network
[Match]
Name=eth*

[Network]
Bond=bond0
```

## Integration with systemd-resolved

### Check Integration
```bash
# See if resolved handles DNS
networkctl --no-pager status eth0 | grep DNS

# Check resolved status
resolvectl status

# Check symlink
ls -la /etc/resolv.conf
# Should point to ../run/systemd/resolve/stub-resolv.conf
```

## Network Dependencies

### systemd Dependencies
```
# /etc/systemd/network/20-network.network
[Match]
Name=eth0

[Network]
RequiredForOnline=yes
ConfigureWithoutCarrier=no
```

### Online Criteria
- `RequiredForOnline=yes` — essential for system online
- `ConfigureWithoutCarrier=no` — wait for cable
- `SkipNoCarrier=yes` — skip if no carrier (WiFi)

## Network Events

### Hooks
```
# /etc/systemd/network/20-network.network
[Match]
Name=eth0

[Network]
# Run script on link up
# (Use systemd service instead)
```

### Network Scripts
- Use `network-online.target` for dependencies
- Use systemd services for actions on network change

## Network Debugging

### Debug Mode
```bash
# Enable debug
SYSTEMD_LOG_LEVEL=debug networkctl status eth0

# Or edit service
systemctl edit systemd-networkd
# [Service]
# Environment=SYSTEMD_LOG_LEVEL=debug
```

### Check Logs
```bash
# Networkd logs
journalctl -u systemd-networkd -f

# Resolved logs
journalctl -u systemd-resolved -f

# Combined
journalctl -u systemd-networkd -u systemd-resolved -f
```