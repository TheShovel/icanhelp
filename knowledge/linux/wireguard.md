# WireGuard VPN

Modern, fast, simple VPN (kernel module built into Linux 5.6+). **`wg`/`wg-quick` are not installed on this Arch box** — commands below are syntax-verified, not run live.

## Install (use `sys pkg`)
```bash
sys pkg install wireguard-tools     # Arch / Debian / Fedora
sys kern modprobe wireguard         # load module now
```

## Key Generation
```bash
wg genkey > privatekey
wg pubkey < privatekey > publickey
wg genpsk > psk                    # optional preshared key
# All at once:
wg genkey | tee privatekey | wg pubkey > publickey
```

## Server Config (`/etc/wireguard/wg0.conf`)
```ini
[Interface]
PrivateKey = SERVER_PRIVATE_KEY
Address = 10.0.0.1/24
ListenPort = 51820
# NAT for client internet access:
# PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
# PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = CLIENT_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32
PersistentKeepalive = 25
```

## Client Config
```ini
[Interface]
PrivateKey = CLIENT_PRIVATE_KEY
Address = 10.0.0.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = server.example.com:51820
AllowedIPs = 0.0.0.0/0, ::/0      # route all traffic; use subnets for split tunnel
PersistentKeepalive = 25
```

## Manage
```bash
sudo wg-quick up wg0
sudo wg-quick down wg0
sudo wg show
sys svc enable --now wg-quick@wg0
```

## Firewall (use `sys firewall`)
```bash
sys firewall allow 51820/udp
# Low-level (native, for forwarding/NAT):
sudo iptables -A FORWARD -i wg0 -j ACCEPT
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
# nftables:
# nft add rule inet filter forward iifname "wg0" accept
```

## Troubleshooting
```bash
wg show wg0                       # check handshake/keys
nc -zv SERVER_IP 51820           # endpoint reachable?
sys net routes                   # routing correct?
sysctl net.ipv4.ip_forward       # forwarding enabled?
ping -M do -s 1420 10.0.0.1      # MTU probe
sys time status                  # clock skew breaks handshakes
```
