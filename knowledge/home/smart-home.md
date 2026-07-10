# Smart Home Automation

## Platforms & Hubs

### Local / Open-Source (Recommended)
| Platform | Language | Protocol Support | Pros |
|----------|----------|-----------------|------|
| Home Assistant | Python + YAML | Zigbee, Z-Wave, WiFi, BT, Matter | Best integrations, local control, huge community |
| OpenHAB | Java | Zigbee, Z-Wave, KNX, MQTT | Mature, complex automation rules |
| Hubitat | Proprietary | Zigbee, Z-Wave | Local-only, no cloud dependency |
| Homebridge | Node.js | WiFi, via plugins | Bridges non-HomeKit devices to Apple Home |

### Cloud-Dependent
- Google Home, Amazon Alexa, Apple HomeKit — easy setup, limited local control
- Cloud dependency means outages break automations, privacy concerns
- Samsung SmartThings — transitioning to cloud, avoid for new setups

## Wireless Protocols

### Zigbee
- Mesh network (each powered device acts as repeater)
- 2.4 GHz (shares band with WiFi — channel overlap is common)
- Devices: bulbs, sensors, plugs, locks, thermostats
- Coordinator needed: Sonoff ZBDongle-P (CC2652P), Conbee II/III
- Max ~80 devices per coordinator, extend with routers
- Common quirks: device pairing involves factory reset (on-off 5x for bulbs)
- Channels: use 11 (lowest freq, least WiFi overlap) or 25 (farthest from WiFi channel 6)

### Z-Wave
- Mesh network, 800–900 MHz (less crowded than 2.4 GHz)
- Max 232 nodes per network, 4 hops max
- Devices: locks, switches, sensors, thermostats
- Regional frequency differences (908 MHz US, 868 MHz EU) — check compatibility
- Stick: Zooz 700/800, Aeotec Gen5/7, HomeSeer
- S2 security: recommended for locks, requires inclusion with PIN

### Matter
- New unified standard over WiFi + Thread
- Backed by Apple, Google, Amazon, Samsung
- Thread: low-power mesh for battery devices (border router required)
- Currently limited device availability, maturing slowly
- Home Assistant supports Matter via Thread dongle (SkyConnect, Nabu Casa)

### WiFi (ESP32/ESP8266)
- No hub needed, direct to WiFi router
- Tasmota/ESPHome firmware for local control (flash ESP8266/ESP32)
- Tasmota: MQTT-based, web UI, very stable
- ESPHome: YAML config, integrates natively with Home Assistant
- Risk: too many WiFi devices congest the network (AP limitation ~30 devices)

## Home Assistant Setup

### Installation
- Recommended: **Home Assistant OS** on Raspberry Pi 4/5 (or used NUC/Optiplex)
  - Raspberry Pi: 4+ GB RAM, SSD boot (not SD card), Zigbee stick via USB
  - NUC/Optiplex: VM (Proxmox, VMware) or bare metal
  - Minimum: 2 GB RAM, 32 GB storage, 1 GB/s network
- Alternative: Docker container (`ghcr.io/home-assistant/home-assistant:stable`)
- Alternative: Python venv (not recommended for beginners)

### Configuration
```yaml
# Example configuration.yaml
homeassistant:
  name: Home
  unit_system: metric
  time_zone: America/New_York
  currency: USD

# Enable API for integrations
api:

# MQTT broker (Mosquitto add-on or standalone)
mqtt:
  broker: 192.168.1.100
  port: 1883
  discovery: true

# Zigbee integration (ZHA)
zha:
  zigpy_config:
    ota:
      # Provider for device firmware updates
      otau_directory: /config/zigbee_ota

# ESPHome discovery
esphome:

# Automations
automation: !include automations.yaml
```

### Key Add-ons
- **File Editor** — SSH/web-based file editing
- **Mosquitto broker** — MQTT for ESP/Tasmota devices
- **ESPHome** — manage ESP32/ESP8266 devices
- **Samba** — network share to backup config
- **Node-RED** — visual flow-based automation
- **Let's Encrypt** — SSL for remote access
- **Google Drive Backup** — daily config backup to cloud

## Useful Automations

### Lighting
```yaml
- alias: "Arrive Home - Lights On"
  trigger:
    platform: state
    entity_id: binary_sensor.front_door
    to: "on"
  condition:
    condition: sun
    after: sunset
  action:
    service: light.turn_on
    target:
      entity_id:
        - light.living_room_overhead
        - light.hallway
    data:
      brightness: 255
      color_temp: 350

- alias: "Bedtime - All Lights Off"
  trigger:
    platform: time
    at: "23:00"
  action:
    service: light.turn_off
    entity_id: all
```

### Climate
- Control thermostat based on home/away presence
- Open blinds during winter days for passive solar heating
- Close blinds during summer afternoons to reduce cooling load
- Humidity sensor + bathroom fan automation when shower humidity >65%

### Security
- Armed away: turn lights on/off randomly between 30 min intervals
- Doors/windows open notification when armed away
- Flood sensor: trigger smart valve shutoff + notification
- Smoke alarm: send push notification, flash lights red
- Motion cameras: record to local NVR (Frigate, Scrypted), not cloud

## Device Recommendations

| Device Type | Recommended | Protocol | Notes |
|-------------|------------|----------|-------|
| Bulb | IKEA Tradfri, Philips Hue | Zigbee | Tradfri cheap, Hue reliable |
| Plug | Sonoff S31 (flashed Tasmota) | WiFi | Energy monitoring model |
| Sensor (door) | Aqara, Sonoff SNZB-04 | Zigbee | Tiny, cheap, reliable |
| Sensor (motion) | Aqara P1, Philips Hue | Zigbee | P1 has 1s refresh |
| Thermostat | Nest (with HomeKit Bridge), Ecobee | WiFi | Need cloud integration |
| Lock | Schlage Encode, August | Z-Wave/WiFi | Check smartthings compatibility |
| Camera | Reolink, Amcrest | WiFi/POE | RTSP stream, local recording |

## Common Gotchas
- Zigbee and 2.4 GHz WiFi channel overlap — set WiFi to channels 1, 6, or 11, Zigbee to 25
- USB 3.0 ports emit 2.4 GHz EMI — use USB extension cable for Zigbee/Z-Wave dongles
- Some routers drop mDNS (Home Assistant discovery) — enable `reflector` in pihole/AdGuard
- Power cycle devices after router changes (DHCP reservation fails without reboot)
- Automatic firmware updates can break integrations — stick to manual updates
- Don't buy WiFi smart locks — battery life is poor compared to Z-Wave/Thread
- Label every device with Hubitat/Coordinator ID during setup
