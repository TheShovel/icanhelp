# Networking & Protocols

## OSI Model (7 Layers)
1. **Physical** — bits on wire (voltage, radio, fiber)
2. **Data Link** — frames between adjacent nodes (MAC, Ethernet, Wi-Fi)
3. **Network** — packets end-to-end (IP, routing)
4. **Transport** — segments/reliability (TCP, UDP)
5. **Session** — session management (NetBIOS, RPC)
6. **Presentation** — data encoding (TLS, SSL, JPEG, ASCII)
7. **Application** — user-facing (HTTP, FTP, SMTP, DNS)

## TCP/IP Model (4 Layers)
- **Network Interface** (L1+L2) → **Internet** (L3) → **Transport** (L4) → **Application** (L5+L6+L7)

## TCP Details
- Header: source port (16), dest port (16), seq num (32), ack num (32), flags (9), window (16), checksum (16), urgent (16)
- Flags: SYN, ACK, FIN, RST, PSH, URG, SYN-ACK
- 3-way handshake: SYN → SYN-ACK → ACK
- Connection termination: FIN → ACK → FIN → ACK
- Flow control: sliding window (Receiver Window / RWIN)
- Congestion control: slow start, congestion avoidance, fast retransmit, fast recovery
- Window scaling: option to increase max window beyond 64KB
- Selective ACK (SACK): acknowledge non-consecutive segments

## UDP Details
- Header: source port, dest port, length, checksum
- No handshake, no ordering, no retransmission
- Used when speed > reliability: DNS, DHCP, VoIP, video streaming, QUIC, gaming

## IP Addressing
- **IPv4**: 32-bit, dotted decimal (192.168.1.1), 2³² ≈ 4.3 billion addresses
- **IPv6**: 128-bit, hexadecimal (2001:db8::1), 2¹²⁸ addresses
- **Private IPv4 ranges**: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
- **Loopback**: 127.0.0.1 (IPv4), ::1 (IPv6)
- **APIPA**: 169.254.0.0/16 (automatic private when DHCP fails)
- **CIDR notation**: 192.168.1.0/24 = subnet mask 255.255.255.0
- **Subnet mask**: determines network vs host portion
  - /24 = 255.255.255.0 = 254 hosts
  - /16 = 255.255.0.0 = 65,534 hosts
  - /8 = 255.0.0.0 = 16,777,214 hosts

## DNS Record Types
- `A` — IPv4 address mapping
- `AAAA` — IPv6 address mapping
- `CNAME` — canonical name (alias)
- `MX` — mail exchange (with priority)
- `TXT` — arbitrary text (SPF, DKIM, DMARC, verification)
- `NS` — authoritative nameserver
- `SOA` — start of authority (zone metadata)
- `SRV` — service location (host + port)
- `PTR` — reverse lookup (IP → hostname)
- `CAA` — which CAs can issue certificates for domain

## HTTP Protocol Flow
1. Browser resolves domain via DNS
2. TCP connection established (3-way handshake)
3. TLS handshake (if HTTPS)
4. HTTP request sent (method, path, headers, body)
5. Server processes and sends response
6. Connection may be kept alive (HTTP/1.1) or closed

## Common Ports
- 20/21 TCP — FTP
- 22 TCP — SSH
- 23 TCP — Telnet
- 25 TCP — SMTP (email sending)
- 53 TCP/UDP — DNS
- 67/68 UDP — DHCP
- 80 TCP — HTTP
- 110 TCP — POP3
- 123 UDP — NTP
- 143 TCP — IMAP
- 161/162 UDP — SNMP
- 389 TCP — LDAP
- 443 TCP — HTTPS
- 465 TCP — SMTPS
- 514 UDP — syslog
- 587 TCP — SMTP (submission)
- 631 TCP/IPP — IPP (printing)
- 993 TCP — IMAPS
- 995 TCP — POP3S
- 3306 TCP — MySQL
- 3389 TCP — RDP
- 5432 TCP — PostgreSQL
- 6379 TCP — Redis
- 8080 TCP — HTTP alternate
- 8443 TCP — HTTPS alternate
- 27017 TCP — MongoDB

## Network Address Translation (NAT)
- Maps private IPs to public IP (port forwarding for inbound)
- Types: Full Cone, Restricted Cone, Port Restricted Cone, Symmetric
- Carrier-Grade NAT (CGNAT): ISPs use 100.64.0.0/10 when IPv4 exhausted

## VPN Technologies
- **WireGuard**: modern, simple, in-kernel, fast (UDP)
- **OpenVPN**: mature, flexible, TLS-based (TCP or UDP)
- **IPsec**: IKEv2, L2TP/IPsec (built into OS, complex config)
- **Tailscale/Zerotier**: WireGuard-based mesh VPN with coordination server

## Load Balancing
- **L4**: based on IP + port (TCP/UDP), faster, can't inspect content
- **L7**: based on HTTP headers/cookies/paths, slower but smarter
- Algorithms: round-robin, least connections, IP hash, weighted, random
