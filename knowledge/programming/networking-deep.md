# Information Technology & Networking

## Computer Networking Deep Dive

### OSI Model & TCP/IP
- **OSI 7 layers** (conceptual): Physical (cables, radio, bits). Data Link (Ethernet frames, MAC addresses). Network (IP, routing). Transport (TCP/UDP, ports). Session (session management, NetBIOS, RPC). Presentation (encryption/compression-TLS). Application (HTTP, FTP, SMTP, DNS)
  - Practical: TCP/IP model = 4 layers (Link/Network Interface = OSI 1+2; Internet = OSI 3; Transport = OSI 4; Application = OSI 5-7)
- **Data encapsulation**: application data → TCP segment (adds port) → IP packet (adds IP) → Ethernet frame (adds MAC) → bits on wire. Each layer adds its own header

### TCP Deep Dive
- **Header**: 20-60 bytes. Source Port (16 bits), Dest Port (16 bits), Seq Number (32 bits), Ack Number (32 bits), Data Offset (4 bits), Reserved, Flags (9 bits — URG, ACK, PSH, RST, SYN, FIN, with additional flags for explicit congestion control), Window Size (16 bits), Checksum (16 bits), Urgent Pointer (16 bits), Options
- **3-way handshake**: SYN (Client → Server, seq=x). SYN-ACK (Server → Client, seq=y, ack=x+1). ACK (Client → Server, seq=x+1, ack=y+1). Why 3? To establish initial sequence numbers.
- **Sequence/acknowledgment numbers**: reliable byte stream (not datagrams). Each byte numbered. Ack = next EXPECTED byte. Cumulative: ack 10 = all bytes 0-9 received. Duplicate ACK means out-of-order — triggers fast retransmit (3 dup acks = packet lost, retransmit before retransmission timer)
- **Flow control (window)**: receiver advertises window = buffer available. Sender can't send more than window. Zero window: receiver can't keep up, asks sender to stop until window opens again (persist timer)
- **Congestion control**: slow start (cwnd = 1 MSS, doubles per RTT until ssthresh or loss). Congestion avoidance (additive increase: cwnd += MSS × MSS/cwnd). Fast retransmit (3 dup acks). Fast recovery (after fast retransmit, reduce cwnd but don't go to 1). NewReno, CUBIC, BBR (modern — model-based not loss-based, better for high-bandwidth). Tahoe (old, goes to 1 on any loss)

### UDP
- **Header**: 8 bytes — Source Port (16), Dest Port (16), Length (16), Checksum (16)
- No handshake, no ordering, no retransmission. Datagrams may be lost, duplicated, reordered. No flow/congestion control
- Used for: DNS (but can use TCP too), DHCP, VoIP, streaming (RTP over UDP), gaming, QUIC (HTTP/3, runs over UDP — reimplements reliable in application layer, solves TCP head-of-line blocking + reduces connection establishment time. QUIC fully encrypted, zero-RTT for returning clients)

## HTTP/1.1 vs HTTP/2 vs HTTP/3
- **HTTP/1.1 (1997)**: text-based (headers plain ASCII), one request per connection (can pipeline but often doesn't). Head-of-line blocking (response for earlier request blocks later ones in same connection — browser workaround: open 6 parallel connections per host)
- **HTTP/2 (2015)**: binary (not text), multiplexed (multiple streams/requests over single TCP connection — solves head-of-line blocking). Header compression (HPACK, greatly reduces overhead). Server push (server sends resources before client requests). Stream prioritization. Encrypted by convention (not required by spec but browsers require TLS)
  - Problem: TCP-level head-of-line blocking (one packet loss on one stream stalls ALL streams on that TCP connection)
- **HTTP/3 (2022)**: QUIC over UDP (instead of TCP). 0-RTT connection setup. No TCP HoL (one stream loss doesn't block others). Built-in encryption (TLS 1.3 mandatory). Connection migration (survive IP change — switch from WiFi to cellular without breaking connection). Better for mobile

## DNS (Domain Name System)
- **Hierarchy**: Root (13 root server networks — 13 root nameservers lettered A-M, Anycast). TLD ( .com .org .net country .uk .de .jp ). SLD (google.com). Subdomain (www.google.com). FQDN (fully qualified domain name = ends with dot)
- **Recursive resolution**: your ISP's DNS resolver queries root → TLD → authoritative → return IP. Cache all the way down (TTL determines how long cached). Stub resolver (your OS) makes query to recursive resolver
  - Root zone = managed by ICANN. TLD operators (Verisign = .com .net, Public Interest Registry = .org )
- **Record types**: A (IPv4), AAAA (IPv6), CNAME (canonical name — domain → domain). MX (mail exchange → hostname + priority). TXT (text — SPF, DKIM, DMARC, verification). NS (nameserver). SOA (start of authority — zone primary nameserver + admin email + serial #). SRV (service location → hostname + port). CAA (which CAs can issue certificates). PTR (reverse lookup)
- **Hosts file**: /etc/hosts on Linux, C:\Windows\System32\drivers\etc\hosts. Before DNS lookup, OS checks hosts file
- **DNSSEC**: DNS security extensions — digital signatures verify authenticity (prevents DNS spoofing/cache poisoning). DS (DNSKEY/Delegation Signer) record chain of trust from root to domain. .gov root signed. Less widely adopted than should be (~30% of TLDs have DNSSEC for .com?)

## DHCP (Dynamic Host Configuration Protocol)
- **Discover** (broadcast, who can give me IP?). Offer (DHCP server offers IP + options). Request (client requests IP). ACK (server confirms)
  - DORA: Discover → Offer → Request → Acknowledgement. Broadcasts: since client doesn't have IP yet, uses MAC address (Layer 2) for packets
- **Lease**: IP given for limited time (default 24h). Client renews at 50% lease time (DHCPREQUEST). Renewal: unicast to server that gave lease if same network, or broadcast to renew if different network
  - DHCP reservations (static mapping): MAC → fixed IP. Server always offers same IP. Replaces static IP but with flexible leases
- **Options**: subnet mask, default gateway (router), DNS servers, domain name (search suffix), NTP server, WINS server — supplied by DHCP server

## NAT (Network Address Translation)
- **Why**: IPv4 exhaustion — private IPs (RFC 1918: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, plus 169.254.x.x (link-local), 100.64.0.0/10 (CGNAT — carrier-grade NAT). Allows multiple devices to share single public IP
- **Types**: SNAT (source NAT: private → public, outbound). DNAT (destination NAT: public → private, inbound = port forwarding). Masquerade (linux iptables: dynamic, uses highest available port)
  - PAT (Port Address Translation): modify source port to track connections. Given each device needing unique port per session, using 65,535 ports. Around 16,384 concurrent session limit with cheap home routers before exhaustion/overload
- **Problems**: breaks end-to-end principle, interferes with some protocols (P2P, VoIP, gaming). IPv6 solves this (enough addresses for every device to have public IP). NAT traversal: STUN, TURN, ICE (protocols to work around NAT for VoIP, video, P2P)

## VPNs & Tunneling
- **Types**: Remote access (client → network). Site-to-site (network → network, IPSec usually). Split tunnel (only specific traffic through VPN, rest direct — opposite: full tunnel = all traffic through VPN)
- **WireGuard**: modern, simple, fast, in-kernel (Linux 5.6+). Crypto: Curve25519 + ChaCha20 + Poly1305. Each peer has private/public key. No certificate authority, no handshake daemon. UDP. 4000 lines of code vs OpenVPN ~600,000. Very fast — simpler, more auditable
- **OpenVPN**: mature, flexible, TLS-based, TCP or UDP, certificate auth, PKI, wide platform support. Slower than WireGuard (userspace). Open source: extensive config
- **IPsec**: IKE (key exchange), ESP/AH (encryption/authentication). Complex (many configuration options). Tunnel mode (encrypt whole packet) vs Transport mode (encrypt payload only). Used in site-to-site

## SDN (Software-Defined Networking)
- **Control plane** (decides where traffic goes) separated from **data plane** (forwarding). Controller (software) tells switches/routers how to forward. Enables dynamic, programmable networking
  - OpenFlow: protocol between controller + switch. SDN allows network reconfiguration in minutes vs days
- **Network Functions Virtualization (NFV)** — virtual firewalls, routers, load balancers on commodity hardware. E.g., virtual firewall on ESXi — all in software
- **Overlay networks**: VXLAN (encapsulate L2 in L3, enables VLAN across Layer 3 network segments), EVPN (Ethernet VPN), VPNs (WireGuard/OpenVPN — overlay over internet)

## Data Centers & Cabling
- **Categories**: Cat5e (1000BASE-T / 1Gbps, 100m). Cat6 (10Gbps up to 55m, higher frequency). Cat6a (10Gbps, 100m). Cat7 (shielded, 10Gbps 100m but not TIA/EIA standard). Cat8 (25-40Gbps, 30m)
  - Fiber: Single mode (laser, long distance, expensive). Multi-mode (LED, short distance — up to 300-550m, cheaper). OM3/OM4 (aqua jacket, laser optimized)
- **Power over Ethernet (PoE)**: power + data over same cable. PoE (802.3af, 15.4W). PoE+ (802.3at, 30W). PoE++ (802.3bt, 60-90W). Used for: IP cameras, Wi-Fi APs, VoIP phones, access control. PoE injector vs PoE switch
- **Rack units (U)**: 1U = 1.75 inches. Standard rack = 42U (73.5 inches). Server depth: from ~20" to 35"
- **Cooling**: hot aisle/cold aisle containment: alternating rows facing same way. Cold aisle intake → servers → hot aisle exhaust → AC return. Prevents mixing of hot + cold air
