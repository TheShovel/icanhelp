# WireGuard VPN

## Overview
WireGuard is a modern, fast, and secure VPN protocol that aims to be simpler than IPsec and OpenVPN. It uses state-of-the-art cryptography and is designed for ease of use.

## Key Features
- **Simple**: ~4,000 lines of code (vs 100k+ for IPsec)
- **Fast**: Kernel-space implementation, ChaCha20-Poly1305, Curve25519
- **Secure**: Formally verified, no known vulnerabilities
- **Roaming**: Seamless IP changes (mobile friendly)
- **Cross-platform**: Linux, Windows, macOS, BSD, Android, iOS

## Installation

### Linux
```bash
# Ubuntu/Debian
sudo apt install wireguard wireguard-tools

# Fedora
sudo dnf install wireguard-tools

# Arch
sudo pacman -S wireguard-tools

# Kernel module (usually built-in 5.6+)
sudo modprobe wireguard
lsmod | grep wireguard
```

### Other Platforms
- **Windows**: Download from wireguard.com/install
- **macOS**: `brew install wireguard-tools` or App Store
- **Android/iOS**: App Store/Play Store
- **OpenWrt**: `opkg install wireguard-tools`

## Key Generation

### Generate Keys
```bash
# Private key
wg genkey > privatekey

# Public key from private
wg pubkey < privatekey > publickey

# Preshared key (optional, for post-quantum resistance)
wg genpsk > psk

# Generate all at once
wg genkey | tee privatekey | wg pubkey > publickey
wg genpsk > psk
```

### Key Format
- **Private key**: Base64-encoded 32-byte Curve25519 private key
- **Public key**: Base64-encoded 32-byte Curve25519 public key
- **Preshared key**: Base64-encoded 32-byte symmetric key

## Basic Configuration

### Server Config (`/etc/wireguard/wg0.conf`)
```ini
[Interface]
# Server private key
PrivateKey = SERVER_PRIVATE_KEY

# VPN subnet
Address = 10.0.0.1/24

# Listen port
ListenPort = 51820

# Enable NAT traversal (optional)
# PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
# PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# DNS for clients (optional)
# DNS = 1.1.1.1, 8.8.8.8

# MTU (optional, default 1420)
# MTU = 1420

[Peer]
# Client public key
PublicKey = CLIENT_PUBLIC_KEY

# Optional preshared key
PresharedKey = PSK_KEY

# Client VPN IP
AllowedIPs = 10.0.0.2/32

# Keepalive for NAT traversal (seconds)
PersistentKeepalive = 25
```

### Client Config (`/etc/wireguard/wg0.conf`)
```ini
[Interface]
# Client private key
PrivateKey = CLIENT_PRIVATE_KEY

# Client VPN IP
Address = 10.0.0.2/24

# DNS (optional)
DNS = 1.1.1.1, 8.8.8.8

[Peer]
# Server public key
PublicKey = SERVER_PUBLIC_KEY

# Optional preshared key
PresharedKey = PSK_KEY

# Server endpoint (public IP:port)
Endpoint = SERVER_PUBLIC_IP:51820

# Route all traffic through VPN (0.0.0.0/0) or specific subnets
AllowedIPs = 0.0.0.0/0, ::/0

# Keepalive for NAT traversal
PersistentKeepalive = 25
```

## Managing WireGuard

### wg-quick (Standard Management)
```bash
# Start interface
sudo wg-quick up wg0

# Stop interface
sudo wg-quick down wg0

# Show status
sudo wg show
sudo wg show wg0

# Enable at boot
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```

### wg (Low-Level Control)
```bash
# Show all interfaces
wg show all

# Show specific interface
wg show wg0

# Add peer dynamically
wg set wg0 peer CLIENT_PUBLIC_KEY allowed-ips 10.0.0.2/32 endpoint 1.2.3.4:51820

# Remove peer
wg set wg0 peer CLIENT_PUBLIC_KEY remove

# Change listen port
wg set wg0 listen-port 51821

# Set private key
wg set wg0 private-key /path/to/privatekey
```

## Advanced Configurations

### Multiple Peers (Site-to-Site)
```ini
# Server with multiple clients
[Interface]
PrivateKey = SERVER_PRIVATE_KEY
Address = 10.0.0.1/24
ListenPort = 51820

[Peer]
# Client 1
PublicKey = CLIENT1_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32

[Peer]
# Client 2
PublicKey = CLIENT2_PUBLIC_KEY
AllowedIPs = 10.0.0.3/32

[Peer]
# Another site (site-to-site)
PublicKey = SITE2_PUBLIC_KEY
AllowedIPs = 10.0.0.10/32, 192.168.2.0/24
Endpoint = SITE2_PUBLIC_IP:51820
PersistentKeepalive = 25
```

### Road Warrior (Mobile Clients)
```ini
# Server config for mobile clients
[Interface]
PrivateKey = SERVER_PRIVATE_KEY
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Each mobile client gets its own [Peer] section
[Peer]
PublicKey = MOBILE1_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32
PersistentKeepalive = 25

[Peer]
PublicKey = MOBILE2_PUBLIC_KEY
AllowedIPs = 10.0.0.3/32
PersistentKeepalive = 25
```

### Split Tunneling
```ini
# Client: Only route specific traffic through VPN
[Interface]
PrivateKey = CLIENT_PRIVATE_KEY
Address = 10.0.0.2/24

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = SERVER_IP:51820
# Only corporate networks
AllowedIPs = 10.0.0.0/24, 192.168.1.0/24, 172.16.0.0/12
PersistentKeepalive = 25
```

### IPv6 Support
```ini
[Interface]
PrivateKey = PRIVATE_KEY
Address = 10.0.0.1/24, fd00:1::1/64
ListenPort = 51820

[Peer]
PublicKey = PEER_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32, fd00:1::2/128
Endpoint = PEER_IP:51820
```

## Firewall Integration

### iptables/nftables
```bash
# Allow WireGuard traffic
iptables -A INPUT -p udp --dport 51820 -j ACCEPT
iptables -A FORWARD -i wg0 -j ACCEPT
iptables -A FORWARD -o wg0 -j ACCEPT

# NAT for internet access through VPN
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE

# nftables equivalent
nft add rule inet filter input udp dport 51820 accept
nft add rule inet filter forward iifname "wg0" accept
nft add rule inet filter forward oifname "wg0" accept
nft add rule inet nat postrouting oifname "eth0" masquerade
```

### UFW
```bash
sudo ufw allow 51820/udp
sudo ufw route allow in on wg0 out on eth0
```

### firewalld
```bash
sudo firewall-cmd --permanent --add-port=51820/udp
sudo firewall-cmd --permanent --add-masquerade
sudo firewall-cmd --permanent --zone=trusted --add-interface=wg0
sudo firewall-cmd --reload
```

## Systemd Service

### Custom Service (`/etc/systemd/system/wg-quick@wg0.service.d/override.conf`)
```ini
[Unit]
Description=WireGuard via wg-quick(8) for %I
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/wg-quick up %i
ExecStop=/usr/bin/wg-quick down %i
# Restart on failure
Restart=on-failure
RestartSec=5
```

## Troubleshooting

### Common Issues

#### Handshake Fails
```bash
# Check keys match
wg show wg0

# Verify endpoint reachable
nc -zv SERVER_IP 51820

# Check firewall
iptables -L -n -v | grep 51820

# Check time sync (critical for handshake)
timedatectl status
```

#### No Traffic Flow
```bash
# Check allowed IPs
wg show wg0 allowed-ips

# Check routing
ip route show
ip route get 10.0.0.1

# Check forwarding enabled
sysctl net.ipv4.ip_forward
sysctl net.ipv6.conf.all.forwarding

# Enable forwarding
echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.d/99-wireguard.conf
echo 'net.ipv6.conf.all.forwarding=1' >> /etc/sysctl.d/99-wireguard.conf
sysctl --system
```

#### DNS Issues
```bash
# Check resolv.conf
cat /etc/resolv.conf

# Use systemd-resolved
# Install: sudo apt install systemd-resolved
# Config in wg0.conf: DNS = 1.1.1.1
```

#### MTU Problems
```bash
# Test MTU
ping -M do -s 1420 10.0.0.1

# Adjust MTU in config
MTU = 1380  # Lower if needed
```

### Debugging
```bash
# Verbose wg-quick
WG_QUICK_DEBUG=1 wg-quick up wg0

# Kernel messages
dmesg -T | grep wireguard

# Capture handshake
tcpdump -i any -n udp port 51820

# WireGuard debug (kernel)
echo 1 > /sys/module/wireguard/parameters/debug
```

## Performance Tuning

### Kernel Parameters
```bash
# Increase UDP buffer sizes
sysctl -w net.core.rmem_max=2500000
sysctl -w net.core.wmem_max=2500000
sysctl -w net.core.rmem_default=2500000
sysctl -w net.core.wmem_default=2500000

# Persist
cat <<EOF > /etc/sysctl.d/99-wireguard-perf.conf
net.core.rmem_max=2500000
net.core.wmem_max=2500000
net.core.rmem_default=2500000
net.core.wmem_default=2500000
EOF
```

### Multi-Queue (Linux 5.14+)
```bash
# Enable RSS for WireGuard
ethtool -L wg0 combined 4
```

## Security Best Practices

1. **Use preshared keys** for post-quantum resistance
2. **Rotate keys periodically** (automate with cron)
3. **Restrict AllowedIPs** to minimum necessary
4. **Use PersistentKeepalive** only when behind NAT
5. **Monitor connections** with `wg show` or Prometheus
6. **Limit listen port exposure** with firewall rules
7. **Use separate keys per device** (not shared)

## Automation

### Ansible Role
```yaml
- name: Configure WireGuard
  hosts: vpn_servers
  roles:
    - role: wireguard
      wireguard_interface: wg0
      wireguard_port: 51820
      wireguard_address: 10.0.0.1/24
      wireguard_peers:
        - name: client1
          public_key: "{{ client1_public_key }}"
          allowed_ips: 10.0.0.2/32
```

### Key Rotation Script
```bash
#!/bin/bash
# rotate-keys.sh
NEW_PRIV=$(wg genkey)
NEW_PUB=$(echo $NEW_PRIV | wg pubkey)
wg set wg0 private-key <(echo $NEW_PRIV)
# Distribute new public key to peers...
```

## Monitoring

### Prometheus Exporter
```bash
# wg-exporter
docker run -d --name wg-exporter \
  --cap-add=NET_ADMIN --network=host \
  -v /etc/wireguard:/etc/wireguard:ro \
  prometheuscommunity/wireguard-exporter
```

### Metrics to Watch
- `wireguard_handshake_age_seconds` - Time since last handshake
- `wireguard_receive_bytes_total` / `wireguard_transmit_bytes_total`
- `wireguard_peer_count` - Number of connected peers

## Resources
- [WireGuard Official](https://www.wireguard.com)
- [WireGuard Documentation](https://www.wireguard.com/quickstart/)
- [WireGuard on Linux](https://www.wireguard.com/install/)
- [WireGuard Config Examples](https://github.com/pirate/wireguard-docs)
- [WireGuard Go Implementation](https://git.zx2c4.com/wireguard-go/)