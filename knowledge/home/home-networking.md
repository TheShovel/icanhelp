# Home Networking & Wi-Fi

## Hardware

### Router vs Mesh vs Access Points
- **Single router**: cheapest, covers ~1,500 sq ft in open plan. Dead zones common in larger homes, multiple floors, thick walls (brick, concrete, foil-backed insulation). All-in-one (router + switch + Wi-Fi). Used for small apartments or central location in simple homes
- **Mesh Wi-Fi** (Eero, Orbi, Nest Wi-Fi, TP-Link Deco, Asus ZenWiFi): multiple nodes (router + satellites), one SSID, seamless handoff. Good for 2,000-5,000+ sq ft, multiple floors, irregular layouts. Each node communicates wirelessly (tri-band = dedicated backhaul channel). Best consumer solution for whole-home coverage. Some have ethernet backhaul option (better performance)
  - Placement: central locations, on shelves not floor, away from metal objects/microwaves/aquariums/brick fireplaces. Place nodes halfway between router and dead zone, within good range of each other (not at extremes)
  - Performance: mesh sacrifices some max speed (wireless backhaul halves throughput per hop) but gains coverage. Ethernet backhaul (plug nodes into wired network) = better performance, no speed loss
- **Access points** (Ubiquiti UniFi, TP-Link Omada, Ruckus, Aruba Instant On): wired APs connected to router/switch via Ethernet. Best performance, most reliable, most configurable. Need Ethernet runs (or use MoCA/powerline for backhaul). Pro-sumer/enterprise quality. More complex setup (controller software, VLANs, network segmentation). Better for: large houses, wired homes, tech enthusiasts, 50+ devices
  - Controller: UniFi runs on PC/Raspberry Pi/CloudKey, or free software. TP-Link Omada similar. For home: UniFi is most popular, good mix of price/performance

### Wi-Fi Standards
- **Wi-Fi 5 (802.11ac)**: sufficient for most home use (up to 3.5 Gbps theoretical, 500-800 Mbps real-world). 5 GHz only. MU-MIMO downlink only. Good enough for Gigabit internet
- **Wi-Fi 6 (802.11ax)**: better performance in dense device environments (stadium, apartment, smart home). OFDMA (splits channel into sub-channels for more efficient data delivery). Target Wake Time (saves IoT battery). Up to 9.6 Gbps theoretical. Better at handling 30+ devices
- **Wi-Fi 6E**: Wi-Fi 6 + 6 GHz band (new spectrum, less congestion). Great for interference-heavy environments. Limited range but very high speed. Supports 160 MHz channels (wider = faster)
- **Wi-Fi 7 (802.11be, 2024)**: up to 46 Gbps, 320 MHz channels, multi-link operation (use multiple bands simultaneously). Cutting edge, future-proof, but few clients support yet

### Wiring
- **Cat6**: minimum for new installs (10 Gbps up to 55m). Cat6a: 10 Gbps to 100m. Cat5e: 1 Gbps to 100m (sufficient for most, but Cat6 is backward compatible and good for future)
  - Terminate: T568A or T568B (be consistent). Use punch-down tool for jacks, RJ45 crimper for plugs. Pre-terminated patch cables are easier for short runs
  - Never run Ethernet parallel to electrical wires (induction interference — at least 6" gap, cross at 90°). Avoid near fluorescent lights, motors, large appliances
- **MoCA** (Multimedia over Coax): use existing TV coaxial cable for networking. Up to 2.5 Gbps (MoCA 2.5). Great alternative if no Ethernet runs but have coax near TV/office. Bonded MoCA 2.0: 1 Gbps. MoCA 2.5: 2.5 Gbps. Point-of-entry filter prevents MoCA signal leaving house through cable line
- **Powerline**: use electrical wiring for networking. Unreliable (performance varies drastically with house wiring, circuit breakers block signal, noisy from motors). Only use if no other option (and be prepared for disappointment). Best: AV2000 standard (~1 Gbps theoretical, real-world 200-500 Mbps in same room/good wiring, 20-100 Mbps across circuits). Worse on shared apartment circuits

### Switches
- **Unmanaged**: plug and play, no configuration. Good for simple home networks
- **Managed**: VLANs, QoS, link aggregation, port mirroring. For advanced segmentation (IoT devices on separate VLAN). Ubiquiti, TP-Link Omada, Netgear (ProSafe or Orbi). VLAN isolation: create separate subnet for IoT (less secure devices isolated from main PC). If a cheap camera is hacked, it can't reach your PC
- **PoE** (Power over Ethernet): powers devices (cameras, APs, phones) through Ethernet. PoE+ for high-power devices (pan-tilt cameras, newer APs). For 3-4 cameras + 2 APs: 8-port PoE switch ($80-150). Prorate power budget: 15W per standard PoE, 30W PoE+

## Wi-Fi Optimization

### Placement
- **Center of home**, elevated (bookshelf, wall mount), away from: microwaves (2.4 GHz interference), cordless phones, baby monitors, metal furniture (metal filing cabinets block signal), thick walls, large appliances, fish tanks, mirrors
  - Antenna: ideally all antennas vertical for horizontal coverage (most devices are horizontal across floor). Angled antennas slightly off vertical for mixed floor+ wall coverage
  - For best 5 GHz performance: router in same room (5 GHz doesn't go through walls well). For 2.4 GHz: can be 1-2 rooms away (longer range, slower speed)

### Channel Selection
- **2.4 GHz**: channels 1, 6, 11 only (don't overlap). Use whichever is least congested (check with Wi-Fi analyzer app: WiFi Analyzer on Android, NetSpot on PC/Mac). Many neighbors default to 6 or 11; pick 1. 2.4 GHz: better walls penetration, 300-800 Mbps theoretical (20/40 MHz channel width 40 MHz = better but more congestion). In apartment, keep channel width 20 MHz (more reliability). Best use: IoT devices, older tech, distance over speed
- **5 GHz**: many channels, less congestion enable 80 MHz or 160 MHz channel width for maximum speed (but 160 MHz only works if few neighbors also using it). DFS channels: may include radar avoidance (channels 52-144). DFS: Dynamic Frequency Selection — router checks for radar before using, may temporarily switch channel if radar detected. Lower DFS channels (52-64) good. Upper (100-144) often unused by neighbors but may have occasional quiet periods
- **6 GHz (Wi-Fi 6E/7)**: low congestion, best for interference-free high-speed. 320 MHz channels on Wi-Fi 7

### Security
- **WPA3**: use if all devices support it. WPA2-AES (CCMP) if not (disable TKIP — old, insecure, slows performance). WPA2+ WPA3 mixed mode works: older devices at WPA2, newer at WPA3. WPA3 = SAE authentication (instead of PSK), protects against offline dictionary attacks even if handshake captured
  - Disable WPS (Wi-Fi Protected Setup) — brute-force attack can crack PIN in a day. OWE (Opportunistic Wireless Encryption) = Enhanced Open — new optional security for open guest networks
- **SSID**: not necessary to hide (broadcast SSID). Hiding doesn't add real security: anyone with Wi-Fi scanner can find it, increases probe traffic from your devices, some devices may not connect reliably. Better: good password, MAC filtering not effective (easily spoofed)
- **Guest network**: separate SSID + password. Limit access: no local network access (only internet). Useful for visitors and IoT devices. Guest isolation: each guest device can't talk to other guest devices. AP isolation: even for IoT, this is important

## Internet Service
- **Fiber**: best (symmetric 1-10 Gbps, low latency, reliable). Install: ONT (optical network terminal) on wall, Ethernet from ONT to your router
- **Cable** (DOCSIS 3.1): next best (up to 1 Gbps down, 35 Mbps up typical). Asymmetric: download many times faster than upload. Coaxial to cable modem, Ethernet from modem to router
  - DOCSIS 4.0: up to 10 Gbps down, 6 Gbps up (2024+). For now: cable upload speeds still slow (15-50Mbps typical)
- **DSL**: slow, legacy (up to 100 Mbps, usually less). Copper phone line. Replace with fiber/cable if available
- **5G Home**: wireless broadband (T-Mobile, Verizon, Starry). 50-300 Mbps typical. Good for areas without wired broadband. Latency higher than fiber but fine. mmWave (Verizon) = very fast but very line-of-sight (must be near window). C-band (T-Mobile) = good balance of speed + coverage
- **Starlink**: satellite (low Earth orbit). 50-200 Mbps, 20-40ms latency (much better than old geostationary satellite which had 600ms). Great for rural areas. Equipment $599, monthly $120. Obstructions (trees) cause brief drops. 5-10 minute outages daily for mesh satellite hand-off. Speed varies by subscription

## Network Troubleshooting
- **Speed slow**: test wired (Ethernet) first. If fast on wired, Wi-Fi issue. If slow on wired: ISP problem (contact ISP, test modem direct). Restart router + modem. Check for bandwidth hogs (streaming, large downloads, video calls, game updates)
  - QoS: prioritize certain traffic (video calls, gaming) if congestion. Bufferbloat: test waveform.com/tools/bufferbloat. If bad: enable SQM/Cake/fq_codel on router (Ubiquiti, OpenWrt, IQrouter)
- **Wi-Fi drops**: interference (check channels, change). Too far from router. Overloaded router (too many devices). Outdated firmware. Bad power supply (replace router power brick)
- **Specific device can't connect**: restart device. Forget Wi-Fi + reconnect. Check MAC filtering. Check if device supports your Wi-Fi band (older devices may be 2.4 GHz only, new router may have both same SSID). Reset network settings
- **Use wired backhaul**: multiple wired access points = best performance. If Ethernet not possible: MoCA (coax) excellent; powerline (electrical) unpredictable. Mesh is last resort/ best for Wi-Fi-only. But for streaming/gaming: wired always beats any Wi-Fi
