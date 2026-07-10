# WebSockets & Real-Time Communication

## WebSocket Protocol
- **Full-duplex** communication over single TCP connection. Upgraded from HTTP via `Upgrade: websocket` header. After handshake, persistent connection, minimal overhead (2 bytes per message vs HTTP headers). Works on port 80/443 (through firewalls). Browser API: native WebSocket support in all modern browsers
  - Handshake: client sends HTTP GET with Upgrade: websocket. Server responds with 101 Switching Protocols. Both maintain open TCP connection + continuous message exchange
- **Frames**: text (UTF-8) or binary. Masking: client→server frames are masked (XOR key) to prevent confusion with HTTP (security). Server→client not masked
- **Libraries**: ws (Node.js library — reliable, no fallback). Socket.IO (WS + HTTP long-polling fallback + rooms + auto-reconnect + events). uWebSockets (C++ based, fast — 10x throughput compared to ws). reconnecting-websocket, Faye

## Server-Sent Events (SSE)
- **One-way** (server → client). Simpler than WebSocket (HTTP only, no upgrade). Auto-reconnect (browser tries to reconnect automatically). EventSource browser API. Text-only (no binary). Good for: live feeds, notifications, stock tickers, streaming LLM responses. Less overhead than WebSocket
- Limitations: max 6 connections per domain (browser limit). No client→server (use HTTP POST). Not supported across all browsers (but most modern do). Good for: sending updates from server—not for bidirectional chat or gaming

## WebRTC
- **Peer-to-peer** audio/video/data between browsers. Uses: video calls (Zoom, Google Meet without plugins), file sharing. Requires signaling server (to exchange connection info via WebSocket/HTTP). Uses STUN (discover public IP) + TURN (relay if NAT can't be traversed). ICE (Interactive Connectivity Exchange) protocol negotiates best path
  - STUN: get public IP + port. Works for 80%+ of NAT configurations. TURN: relay server used when direct P2P fails (firewall, symmetric NAT). TURN costs bandwidth ($$$) for server

## Use Cases
- **Chat/messaging**: WebSocket (bidirectional, persistent). Can multiplex multiple channels or rooms on single connection (socket.io rooms)
- **Live cursors/collaborative editing**: WebSocket or WebRTC data channel. Operational transforms (OT) vs CRDTs (Conflict-free Replicated Data Types). CRDTs: Google Docs, Figma use + local-first SVGs. OT: ShareJS, ShareDB. Both allow multiple users to edit same doc simultaneously
- **Live notifications**: WebSocket or SSE. Social: one-to-one + broadcasts. Alerts when system events happen
- **Live streaming**: WebRTC (low latency 0.5-2 sec for video) vs HLS/DASH (5-30 sec latency via HTTP chunked segments). WebRTC WebRTC for video conferencing; HLS for one-to-many broadcast. LL-HLS (Low Latency HLS): 2-5 sec possible
- **Real-time dashboards**: WebSocket or SSE (push updates: new data from server). Chart.js, D3.js, ECharts update from server push. Good for live stock tickers, server monitoring, sports scores, weather updates
- **Multiplayer games**: WebSocket (command + state sync) or WebRTC data channel. Game state + user actions sent as binary frames (protobuf to compress JSON). For real-time: 10-60 updates/sec per player. Netcode: client prediction + server reconciliation + entity interpolation

## Scaling WebSocket
- **Sticky sessions**: WebSocket connections are stateful — must stay on same server (vs HTTP can route anywhere). Sticky: load balancer sends same client IP to same server (nginx ip_hash, AWS ALB stickiness). Risk: server failure drops all connections on that node
- **Pub/sub**: Redis Pub/Sub (publish event → all subscribers receive). Use Redis as message broker between WebSocket servers. When one server receives event: publish to Redis, all servers receive + push to their connected clients
  - Example (Node.js): Server A receives message for room "general" → publishes to Redis channel "room:general". All servers subscribe to Redis → receive message → push to connected WebSocket clients in that room. Server A is publishing, all servers are broadcasting. Scale by adding more WebSocket servers behind load balancer. Redis single bottleneck at scale: use Redis Cluster or sharded
- **Horizontal scaling**: multiple WS servers, each with many connections. Shared session state in Redis. Sticky LB or use global messaging bus (Redis, RabbitMQ, Kafka, NATS). For high throughput: uWebSockets or go-websocket (Go) for C10K+ (10,000+ concurrent connections per box)
- **Connection limits**: Linux: ulimit -n (file descriptors). Default 1024 per process. Increase to 65535+ for WebSocket- heavy servers. Each connection ~50-200 KB RAM depending on buffer. 10,000 connections = 0.5-2 GB RAM

## Polling Alternatives
- **Long polling**: client sends request, server holds connection until data available, then responds. Client immediately sends new request. Simulates real-time without WebSocket. Verbose (headers on every poll request). Higher latency. Legacy support. Works everywhere (no WS support needed)
- **HTTP/2 Server Push**: server pushes resources preemptively. Not for real-time data — optimized for static assets. Deprecated in Chrome? (Chrome removed HTTP/2 push 2022)
- **HTTP/3 (QUIC)**: UDP-based, includes 0-RTT + multiplexed streams. WebSocket over HTTP/3 supported (works over QUIC). Lower latency connection establishment + head-of-line blocking fixes. Still evolving in browser support
