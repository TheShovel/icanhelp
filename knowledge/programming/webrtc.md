# WebRTC (Web Real-Time Communication)

## Overview
WebRTC is an open-source project enabling real-time communication (audio, video, data) directly between browsers and devices without plugins. It's supported in all modern browsers.

## Architecture

### Core Components
```
┌─────────────────────────────────────────────────────────────┐
│                        WebRTC Stack                          │
├─────────────────────────────────────────────────────────────┤
│  Application Layer (JavaScript API)                         │
│  ├── RTCPeerConnection    ← Media + Data                    │
│  ├── MediaStream (getUserMedia)                             │
│  ├── RTCDataChannel       ← Arbitrary data                  │
│  └── MediaRecorder / Insertable Streams                     │
├─────────────────────────────────────────────────────────────┤
│  Session Management                                         │
│  ├── SDP (Session Description Protocol)                     │
│  ├── ICE (Interactive Connectivity Establishment)           │
│  ├── STUN/TURN Servers                                      │
│  └── Signaling (WebSocket, HTTP, etc.)                      │
├─────────────────────────────────────────────────────────────┤
│  Transport Layer                                            │
│  ├── DTLS (Encryption)                                      │
│  ├── SRTP (Secure Real-time Transport Protocol)             │
│  ├── SCTP (Stream Control Transmission Protocol)            │
│  └── UDP (Preferred) / TCP                                  │
├─────────────────────────────────────────────────────────────┤
│  Media Engine                                               │
│  ├── Audio: Opus, G.711, G.722, iSAC, iLBC                 │
│  ├── Video: VP8, VP9, H.264, H.265 (HEVC), AV1             │
│  ├── Bandwidth Estimation (GCC, TWCC)                       │
│  ├── Jitter Buffer, Packet Loss Concealment                 │
│   └── Echo Cancellation (AEC), Noise Suppression (ANS)      │
└─────────────────────────────────────────────────────────────┘
```

## JavaScript API

### getUserMedia (Media Capture)
```javascript
// Get audio/video stream
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 2
  },
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: 'user' // or 'environment'
  }
});

// Attach to video element
videoElement.srcObject = stream;

// Handle device changes
navigator.mediaDevices.addEventListener('devicechange', () => {
  // Re-enumerate devices
});
```

### RTCPeerConnection (Core)
```javascript
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
      urls: 'turn:turn.example.com:3478',
      username: 'user',
      credential: 'pass'
    }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  iceTransportPolicy: 'all' // or 'relay' for TURN only
};

const pc = new RTCPeerConnection(configuration);

// Add local stream tracks
stream.getTracks().forEach(track => {
  pc.addTrack(track, stream);
});

// Handle remote stream
pc.ontrack = (event) => {
  remoteVideo.srcObject = event.streams[0];
};

// ICE candidates
pc.onicecandidate = (event) => {
  if (event.candidate) {
    signaling.send({ type: 'candidate', candidate: event.candidate });
  }
};

// Connection state
pc.onconnectionstatechange = () => {
  console.log(pc.connectionState); // new, connecting, connected, disconnected, failed, closed
};

// Data channel
const dc = pc.createDataChannel('chat', {
  ordered: true,
  maxRetransmits: 3
});
dc.onmessage = (e) => console.log(e.data);
dc.send('Hello');
```

### Signaling (Offer/Answer)
```javascript
// Caller creates offer
async function createOffer() {
  const offer = await pc.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  });
  await pc.setLocalDescription(offer);
  signaling.send({ type: 'offer', sdp: offer.sdp });
}

// Callee creates answer
async function handleOffer(offer) {
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  signaling.send({ type: 'answer', sdp: answer.sdp });
}

// Handle answer
async function handleAnswer(answer) {
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

// Handle ICE candidate
async function handleCandidate(candidate) {
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
}
```

### RTCDataChannel (Peer-to-Peer Data)
```javascript
// Reliable, ordered (like TCP)
const reliable = pc.createDataChannel('reliable', {
  ordered: true,
  maxRetransmits: 0 // infinite
});

// Unreliable, unordered (like UDP) - for gaming, real-time
const unreliable = pc.createDataChannel('unreliable', {
  ordered: false,
  maxRetransmits: 0
});

// Partially reliable
const partial = pc.createDataChannel('partial', {
  ordered: true,
  maxRetransmits: 3,
  maxRetransmitTime: 100 // ms
});

// Binary data
dc.binaryType = 'arraybuffer';
dc.send(new Uint8Array([1, 2, 3, 4]));

// File transfer (chunked)
async function sendFile(file) {
  const chunkSize = 16384;
  const fileReader = new FileReader();
  let offset = 0;
  
  fileReader.onload = (e) => {
    dc.send(e.target.result);
    offset += chunkSize;
    if (offset < file.size) readNext();
  };
  
  function readNext() {
    const slice = file.slice(offset, offset + chunkSize);
    fileReader.readAsArrayBuffer(slice);
  }
  readNext();
}
```

## Signaling Server (Node.js + WebSocket)
```javascript
// signaling-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const rooms = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    
    switch (msg.type) {
      case 'join':
        joinRoom(ws, msg.roomId, msg.userId);
        break;
      case 'offer':
      case 'answer':
      case 'candidate':
        relayToRoom(ws, msg);
        break;
      case 'leave':
        leaveRoom(ws);
        break;
    }
  });
  
  ws.on('close', () => leaveRoom(ws));
});

function joinRoom(ws, roomId, userId) {
  ws.roomId = roomId;
  ws.userId = userId;
  
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId).add(ws);
  
  // Notify others
  broadcast(roomId, { type: 'peer-joined', userId }, ws);
}

function relayToRoom(sender, msg) {
  const room = rooms.get(sender.roomId);
  if (room) {
    room.forEach(client => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ ...msg, from: sender.userId }));
      }
    });
  }
}
```

## Advanced Features

### Simulcast (Multiple Encodings)
```javascript
// Sender sends multiple resolutions simultaneously
const transceiver = pc.addTransceiver(track, {
  direction: 'sendonly',
  sendEncodings: [
    { rid: 'high', scaleResolutionDownBy: 1, maxBitrate: 2500000 },
    { rid: 'medium', scaleResolutionDownBy: 2, maxBitrate: 800000 },
    { rid: 'low', scaleResolutionDownBy: 4, maxBitrate: 300000 }
  ]
});

// Receiver requests specific layer
// Via RTCP REMB or TWCC feedback
```

### SVC (Scalable Video Coding)
```javascript
// VP9/AV1 SVC - single stream, multiple layers
const transceiver = pc.addTransceiver(track, {
  sendEncodings: [{
    scalabilityMode: 'L3T3' // 3 spatial layers, 3 temporal layers
  }]
});

// L3T3 = 
// Spatial: 180p, 360p, 720p
// Temporal: 7.5fps, 15fps, 30fps
// Receiver subscribes to needed layers
```

### Insertable Streams (WebRTC NV)
```javascript
// Access encoded frames for processing/recording
const pc = new RTCPeerConnection({
  encodedInsertableStreams: true
});

const sender = pc.getSenders()[0];
const streams = sender.createEncodedStreams();

// Read encoded frames
const reader = streams.readable.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // value: { type: 'key'|'delta', timestamp, data: ArrayBuffer }
  // Process, record, forward...
}

// Write modified frames
const writer = streams.writable.getWriter();
await writer.write(modifiedFrame);
```

### Perfect Negotiation
```javascript
// Handles glare (simultaneous offers) gracefully
let makingOffer = false;
let ignoreOffer = false;

pc.onnegotiationneeded = async () => {
  try {
    makingOffer = true;
    await pc.setLocalDescription(await pc.createOffer());
    signaling.send({ type: 'offer', sdp: pc.localDescription });
  } catch (err) {
    console.error(err);
  } finally {
    makingOffer = false;
  }
};

async function handleSignalingMessage(msg) {
  if (msg.type === 'offer') {
    if (makingOffer) {
      // Glare collision - polite peer ignores
      ignoreOffer = true;
      return;
    }
    await pc.setRemoteDescription(msg.sdp);
    await pc.setLocalDescription(await pc.createAnswer());
    signaling.send({ type: 'answer', sdp: pc.localDescription });
  } else if (msg.type === 'answer') {
    await pc.setRemoteDescription(msg.sdp);
  } else if (msg.type === 'candidate') {
    try {
      await pc.addIceCandidate(msg.candidate);
    } catch (e) {
      if (!ignoreOffer) throw e;
    }
  }
}
```

## NAT Traversal (ICE)

### STUN (Session Traversal Utilities for NAT)
- Discovers public IP:port
- Lightweight, stateless
- Works for cone NATs

### TURN (Traversal Using Relays around NAT)
- Relays media through server
- Works for all NAT types
- Costs bandwidth/server resources

### ICE Candidate Types
```
host:       Local IP (LAN) - highest priority
srflx:      Server reflexive (STUN) - public IP
prflx:      Peer reflexive - discovered during connectivity checks
relay:      TURN relay - lowest priority, most reliable
```

### Typical Flow
```
1. Gather host candidates (local interfaces)
2. Query STUN → srflx candidates
3. Allocate TURN → relay candidates
4. Send all candidates via signaling
5. Connectivity checks (STUN binding requests)
6. Nominate best pair
7. Media flows on nominated pair
```

## Codecs

### Audio
| Codec | Bitrate | Sample Rate | Channels | Use Case |
|-------|---------|-------------|----------|----------|
| Opus | 6-510 kbps | 8-48 kHz | Mono/Stereo | **Default, best quality** |
| G.711 (PCMU/PCMA) | 64 kbps | 8 kHz | Mono | PSTN interop |
| G.722 | 48-64 kbps | 16 kHz | Mono | Wideband voice |
| iSAC | 10-52 kbps | 16/32 kHz | Adaptive | Legacy |
| iLBC | 13.33/15.2 kbps | 8 kHz | Mono | Lossy networks |

### Video
| Codec | Profile | Browser Support | Hardware Accel |
|-------|---------|-----------------|----------------|
| VP8 | - | All | Good |
| VP9 | Profile 0, 2 | Chrome, Firefox, Edge | Good |
| H.264 | Baseline, High | All (licensing) | Excellent |
| H.265 (HEVC) | Main | Safari, Edge | Excellent |
| AV1 | Main | Chrome, Firefox | Emerging |

### Codec Preferences
```javascript
// Force codec preference (before creating offer)
const transceiver = pc.getTransceivers()[0];
transceiver.setCodecPreferences([
  { mimeType: 'video/VP9', clockRate: 90000 },
  { mimeType: 'video/VP8', clockRate: 90000 },
  { mimeType: 'video/H264', clockRate: 90000, 
    sdpFmtpLine: 'profile-level-id=42e01f;packetization-mode=1' }
]);
```

## Security

### DTLS-SRTP
- DTLS handshake during ICE
- Derives SRTP keys
- Perfect forward secrecy
- Certificate fingerprint verification

### Identity
```
Identity Provider (IdP) → Assertion → Peer verifies
- Persona, Firebase, custom
- Prevents impersonation
```

### Media Encryption
```javascript
// DTLS fingerprint (for manual verification)
pc.onconnectionstatechange = () => {
  if (pc.connectionState === 'connected') {
    const cert = pc.getConfiguration().certificates?.[0];
    if (cert) {
      cert.getFingerprints().then(fps => {
        console.log('Fingerprint:', fps[0].value);
        // Compare with remote via secure channel
      });
    }
  }
};
```

## Performance Optimization

### Bandwidth Management
```javascript
// Set bitrate limits
const sender = pc.getSenders()[0];
const parameters = sender.getParameters();
parameters.encodings[0].maxBitrate = 1500000; // 1.5 Mbps
sender.setParameters(parameters);

// Simulcast receiver selection
receiver.setParameters({
  encodings: [
    { rid: 'high', active: true },
    { rid: 'medium', active: false },
    { rid: 'low', active: true } // fallback
  ]
});
```

### Stats Monitoring
```javascript
async function getStats() {
  const stats = await pc.getStats();
  stats.forEach(report => {
    if (report.type === 'inbound-rtp' && report.kind === 'video') {
      console.log({
        framesReceived: report.framesReceived,
        framesDecoded: report.framesDecoded,
        framesDropped: report.framesDropped,
        jitter: report.jitter,
        packetsLost: report.packetsLost,
        bitrate: calculateBitrate(report)
      });
    }
    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
      console.log('Active pair:', report.localCandidateId, report.remoteCandidateId);
    }
  });
}

setInterval(getStats, 1000);
```

## Testing Tools
- **webrtc-internals** (chrome://webrtc-internals)
- **testrtc.com** - Network testing
- **appr.tc** - Reference implementation
- **simplewebrtc.com** - Demo apps
- **wireshark** - Protocol analysis (DTLS, SRTP, SCTP)

## Resources
- [WebRTC Samples](https://webrtc.github.io/samples/)
- [WebRTC Spec](https://w3c.github.io/webrtc-pc/)
- [WebRTC for the Curious](https://webrtcforthecurious.com/)
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)