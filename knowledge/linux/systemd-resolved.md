# systemd-resolved - DNS Resolution

## Overview
- `systemd-resolved` — local DNS stub resolver
- Manages DNS, LLMNR, MulticastDNS, DNSSEC
- `/run/systemd/resolve/stub-resolv.conf` — stub resolver config
- `/run/systemd/resolve/resolv.conf` — full resolver config

## Installation

### Enable/Disable
```bash
systemctl enable --now systemd-resolved

# Check status
systemctl status systemd-resolved

# Disable if using other resolver
systemctl disable --now systemd-resolved
```

### Configuration
```
# /etc/systemd/resolved.conf
[Resolve]
DNS=1.1.1.1 8.8.8.8
FallbackDNS=1.0.0.1 8.8.4.4
Domains=~example.com ~internal
LLMNR=yes
MulticastDNS=yes
DNSSEC=yes
DNSSEC negative
Cache=yes
```

## DNS Configuration

### Static DNS Servers
```bash
# Via resolvectl
resolvectl dns eth0 1.1.1.1 8.8.8.8
resolvectl domain eth0 ~example.com

# View current
resolvectl status
resolvectl dns
```

### DNS Modes
- `systemd-resolved --status` — shows mode
- `/etc/resolv.conf` symlink to `/run/systemd/resolve/stub-resolv.conf` — stub mode
- `/etc/resolv.conf` symlink to `/run/systemd/resolve/resolv.conf` — full mode
- `mode: uplink` — uses uplink DNS servers

### Fallback DNS
- Default: Cloudflare (1.1.1.1) and Google (8.8.8.8)
- Configured in `/etc/systemd/resolved.conf`
- Used when no DNS configured on interface

## resolvectl Commands

### Status Information
- `resolvectl status` — show all DNS info
- `resolvectl --json=status` — JSON output
- `resolvectl --wide status` — wide format
- `resolvectl --all status` — including DNSSEC

### DNS Operations
- `resolvectl query example.com` — DNS lookup
- `resolvectl query --search example.com` — with search domains
- `resolvectl --statistics` — query counts
- `resolvectl --reset-statistics` — reset counters

### Service Management
- `resolvectl restart` — reload configuration
- `resolvectl flush-caches` — clear DNS cache
- `resolvectl reset-interface eth0` — reset interface

## DNS Query Modes

### Search Domains
```
# /etc/systemd/resolved.conf
Domains=example.com ~internal.local # ~ = route-only
```

- Routes: `example.com` used for all queries
- Route-only: `~internal.local` only for `.internal.local` domains

### LLMNR (Link-Local)
- `LLMNR=yes` — enable (default)
- Resolves `.local` names via multicast
- Uses 224.0.0.251:5355

### MulticastDNS
- `MulticastDNS=yes` — enable (default)
- Resolves `.local` via mDNS (Bonjour)
- Used by Avahi, systemd-resolved

### DNSSEC
- `DNSSEC=yes` — validate DNSSEC
- `DNSSEC=no` — disable validation
- `DNSSEC allow-downgrade` — opportunistic (default)

## systemd-resolved Configuration

### Full Config Example
```
# /etc/systemd/resolved.conf
[Resolve]
DNS=1.1.1.1 8.8.8.8
FallbackDNS=1.0.0.1 8.8.4.4
Domains=~example.com ~internal
LLMNR=yes
MulticastDNS=yes
DNSSEC=yes
Cache=yes
CacheFromLocalhost=no
DNSOverTLS=opportunistic
DNSOverTLS=yes
# listen on port 53
# for systemd-resolved
ListenStream=127.0.0.53:53
```

### DNS Stub Listener
- Listens on 127.0.0.53:53 by default
- Alternative: configure to listen on different port
- Can disable: `DNSStubListener=no`

## Interface Configuration

### DHCP DNS
- Received via DHCP, automatically configured
- `resolvectl status` shows per-interface DNS
- Takes precedence over global DNS

### Static DNS
```bash
# Via systemd-networkd
# /etc/systemd/network/eth0.network
[Network]
DNS=1.1.1.1
Domains=internal.example.com

# Or manually
resolvectl dns wlan0 192.169.1.1
resolvectl domain wlan0 ~office.local
```

### VPN DNS
- VPN clients push DNS servers
- Automatically routes domains to VPN DNS
- Separated from system DNS

## DNS Cache

### Cache Stats
```bash
# View cache statistics
resolvectl --statistics

# Output example:
# Current Transactions: 0
# Total Transactions: 1234
# Cache Size: 256
# Cache Hits: 567
# Cache Misses: 456
```

### Cache Management
```bash
# Clear cache
resolvectl flush-caches

# Check cache size
resolvectl --status | grep "Cache size"

# Set cache in config
# /etc/systemd/resolved.conf
CacheSize=512
```

## Troubleshooting

### Check Resolution
```bash
# Test resolution
resolvectl query google.com
resolvectl --statistics

# Check /etc/resolv.conf
cat /etc/resolv.conf
# Should show nameserver 127.0.0.53

# Check stub listener
ss -tuln | grep 53
# Should show 127.0.0.53:53
```

### Debug DNS
```bash
# Enable debug
SYSTEMD_LOG_LEVEL=debug resolvectl query example.com

# Check journal
journalctl -u systemd-resolved --since "1 hour ago"

# Show DNS transactions
resolvectl --status
```

### Common Issues
```bash
# DNSSEC validation failure
# Solution: DNSSEC=no or DNSSEC=allow-downgrade

# LLMNR/MulticastDNS conflict
# Solution: disable one of them
# LLMNR=no or MulticastDNS=no

# Cache poisoning
resolvectl flush-caches
```

## Integration with NetworkManager

### NM Integration
- NetworkManager configures systemd-resolved
- `/etc/NetworkManager/conf.d/dns.conf`
- `dns=systemd-resolved` in NetworkManager config

### Check Integration
```bash
# Network manager DNS config
nmcli dev show | grep DNS

# systemd-resolved view
resolvectl status
```

## DNSSEC Configuration

### Validation Modes
- `DNSSEC=yes` — always validate
- `DNSSEC=no` — never validate
- `DNSSEC allow-downgrade` — validate if server supports (default)

### Check Validation
```bash
# Check DNSSEC status
resolvectl --status | grep -A 10 DNSSEC

# Test with known DNSSEC domain
resolvectl query dnssec-failed.org
# Should fail if DNSSEC=yes
```

## DNS over TLS

### Enable DoT
```
# /etc/systemd/resolved.conf
[Resolve]
DNS=1.1.1.1#cloudflare-dns.com
DNSOverTLS=yes
```

### DoT Providers
- Cloudflare: `1.1.1.1#cloudflare-dns.com`
- Google: `8.8.8.8#dns.google`
- Quad9: `9.9.9.9#dns.quad9.net`

## systemd-resolved Files

### Config Files
- `/etc/systemd/resolved.conf` — main config
- `/run/systemd/resolve/resolved.conf` — runtime overrides
- `/usr/lib/systemd/resolved.conf.d/` — vendor defaults

### Runtime Files
- `/run/systemd/resolve/stub-resolv.conf` — stub config
- `/run/systemd/resolve/resolv.conf` — full config
- `/run/systemd/resolve/stub-cache.conf` — cache stats
- `/var/run/systemd/resolve/io.systemd.Resolve.Monitor` — D-Bus monitor

### State Directory
- `/var/lib/systemd/resolved/` — state (if configured)
- DNSSEC negative trust anchors
- Flushed cache records

## Integration with Applications

### resolv.conf Symlink
```bash
# Ensure symlink exists
ls -la /etc/resolv.conf
# Should be: /etc/resolv.conf -> ../run/systemd/resolve/stub-resolv.conf

# Create if missing
ln -sf ../run/systemd/resolve/stub-resolv.conf /etc/resolv.conf
```

### NSS (Name Service Switch)
```
# /etc/nsswitch.conf
hosts: files resolve [!UNAVAIL=return] dns
```

- `resolve` — systemd-resolved (mDNS, LLMNR)
- `dns` — traditional DNS (fallback)
- Order matters for performance

## DNS Stub Resolver

### Query Flow
1. Application queries 127.0.0.53:53
2. systemd-resolved checks cache
3. Checks search domains
4. Queries upstream DNS
5. Validates DNSSEC if enabled
6. Returns result

### Cache TTL
- Respects upstream TTL
- Minimum: 1 second
- Maximum: 2 hours (configurable)

### Cache Entries
```bash
# View cache (requires debug)
cat /run/systemd/resolve/stub-cache.conf
```

## LLMNR and MulticastDNS

### LLMNR Configuration
```
# /etc/systemd/resolved.conf
LLMNR=yes
LLMNR=no  # Disable if not needed
```

### MulticastDNS Configuration
```
MulticastDNS=yes
MulticastDNS=no  # Disable if using Avahi
```

### Conflict Resolution
- Both resolve .local domains
- LLMNR uses Microsoft standard
- MulticastDNS uses Apple Bonjour
- Last one wins in NSS

## Query Examples

### Basic Query
```bash
# A record
resolvectl query example.com

# AAAA record
resolvectl query -t AAAA example.com

# MX record
resolvectl query -t MX example.com

# TXT record
resolvectl query -t TXT example.com
```

### JSON Output
```bash
resolvectl --json=short query example.com
resolvectl --json=pretty query example.com
resolvectl --json=monitor  # Monitor mode
```

## systemd-resolved Service

### Service File
```
# /lib/systemd/system/systemd-resolved.service
[Unit]
Description=Network Name Resolution
Wants=network-online.target

[Service]
ExecStart=
ExecStart=/lib/systemd/systemd-resolved
```

### Override Options
```bash
# Check defaults
systemctl cat systemd-resolved

# Override config
systemctl edit systemd-resolved
# Add:
# [Service]
# MemoryMax=128M
```

## Debugging and Monitoring

### Monitor Mode
```bash
# Monitor DNS queries
resolvectl --monitor

# JSON monitor
resolvectl --json=monitor query example.com
```

### Verbose Output
```bash
# Debug query
SYSTEMD_LOG_LEVEL=debug resolvectl query example.com

# Show all details
resolvectl --status --all
```

### Statistics
```bash
# Clear and track
resolvectl --reset-statistics
# ... use network ...
resolvectl --statistics
```

## Migration from Other Resolvers

### From resolv.conf
- Replace `/etc/resolv.conf` with symlink
- Migrate DNS server list to resolved.conf
- Disable other DNS services

### From dnsmasq
- Stop dnsmasq service
- Move DNS servers to resolved.conf
- Enable systemd-resolved

### From unbound
- Stop unbound service
- Configure DoT in resolved.conf
- Or keep unbound as upstream