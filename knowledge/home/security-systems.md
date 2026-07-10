# Home Security Systems

## Types of Security Systems

### Professionally Monitored
- **ADT**: most established, 3-5 year contracts, monthly $30-50, professional install. Cellular backup + 24/7 monitoring. Expensive to cancel. Offers both wired + wireless. Encrypted cellular radio for alarm communications
- **SimpliSafe**: DIY install, no contract, cancel anytime, $28-33/month for monitoring. Easy to install ($200-400 equipment kit). Cellular + Wi-Fi backup. App control, no-lock contract
- **Ring Alarm**: Amazon, $10-20/month monitoring, DIY, integrates with Alexa + Ring cameras. Cheap equipment ($200-300). Solid system, basic monitoring. Privacy concerns (Amazon ownership)
- **Abode**: Z-Wave + Zigbee, home automation hub + security. $10-30/month for monitoring. Great for HA integration (HomeKit, Alexa, Google, IFTTT). More tech-forward

### Self-Monitored
- **Wyze Home Monitoring**: $5/month (or $99/year for professional monitoring). Sensors $25 each. Very cheap, basic
- **Aqara**: Zigbee sensors, Mijia/HomeKit compatible, reliable. No subscription (you DIY with Home Assistant). Solid hardware (door/window sensors, temp, humidity, leak, motion)
- **Konnected**: retrofit old wired alarm system to smart (ESP8266 board connects to existing alarm wiring → Home Assistant). $50-100 board, professional-grade wired sensors (doors, windows, motion) now WiFi-connected

### Sensors & Devices
- **Door/window sensor** (magnetic reed switch): trigger when magnet separates from switch. Installation: 1/4" gap max between magnet + sensor for some, 1" for others. Placement: on door frame + door, or window frame + sash
- **Motion sensor**: PIR (passive infrared — heat, can't detect through glass, can filter pets ≤40 lbs). Dual-tech (PIR + microwave: must detect both = fewer false alarms). Pet immunity: don't point down stairs (cat/large dog walking near triggers it). Corner bracket for best coverage: 7-8 ft high to avoid pet activation zone
- **Glass break sensor**: listens for breaking glass sound (frequency + intensity). Range 20-30 ft. Alternative: window vibration sensor. Glass break: can respond to other loud noises (dog bark, thunder, dropped pot)
- **Environment sensor**: smoke/CO (many alarm panels integrate First Alert, Kidde, Nest Protect). Water leak sensor ($15-30, under sink, near water heater, basement floor, behind fridge, sump pit). Freeze sensor (temperatures drop close to freezing, alert before burst pipe)
  - Water shutoff valve (Moen Flo, Phyn + or closed loop with valve): smart valve (detects leaks, auto-shutoff, monitors water pressure + flow to identify slow drips, running toilet). $500-600 + install. Paid via insurance discount?

## Deterrence
- **Security cameras**: placement (front door, driveway, back door, garage, main interior areas). Type: bullet (visible = deterrent, outdoor, longer range, harder to vandalize; dome (discreet, indoor/outdoor, less likely to guess direction, but IR glare). Resolution: 4K (8MP, zoomed in you can read license plate), 1080p (2MP, good enough for identification of person 10-20 ft away). Field of view: 110-130° (wide = more area, less detail at distance). Night vision: infrared (black + white) or color night vision (with spotlight). Camera brands: Reolink (value, no monthly fee for NVR + PoE). Dahua/Hikvision (prosumer, PoE, NVR, good quality for price, Chinese security concerns). Amcrest (good value, ONVIF compatible). Axis (professional, expensive, motion detection analytics). Hikvision/discontinued Hikvision product: use older firmware, controversial US ban on sales? Actually federal agencies banned, bans not affecting consumer market yet
- **Smart lighting**: outdoor lights on motion sensor / timer. Smart bulbs with vacation mode (random on/off). Flood lights with camera (Ring Floodlight Cam, Eufy Floodlight). Light is the #1 deterrent. Outdoor timer set to sunset to midnight
- **Yard signs + stickers**: ADT, SimpliSafe, Ring, or generic "This property protected by..." — strong deterrent even if you don't have that system. Even a fake ADT sticker may deter some burglars. Video doorbell alone also deters ~30-50% of would-be package thieves
- **Landscape**: motion lights, thorny bushes under windows (barberry, rose, holly, bougainvillea, pyracantha). Gravel pathways announce footsteps. Trim trees near second story windows. Keep trees away from house (prevent roof access + branches break house in storm)

## Smart Home Security Integration
- **Home Assistant**: most flexible — integrate all brands + sensors + create automations. Z-Wave/Zigbee dongle. Use for: auto-arm when leave, disarm when arrive, turn on lights when motion, send phone notification. "Presence detection": phone WiFi/Bluetooth → auto arm/disarm! No subscription
- **Automation rules**: "When front door opens AND alarm armed away → send notification, sound siren, flash lights." "When water sensor wet → shut off valve, send alert." "When motion detected at night → turn on pathway lights." "When leaving → close garage, arm, turn off lights, lock doors, adjust thermostat"
- **Alarm.com**: provider for many alarm companies (ADT, Brinks, Frontpoint). Backend for their services. Smart home features: locks, lights, thermostat, garage door. Monthly subscription. Good integration for non-DIY users
- **Doors**: smart lock with keypad + app control. August (fits over existing deadbolt — use existing key, app + auto-lock/unlock when phone approaches). Schlage Encode (built-in WiFi, no hub needed, keypad + key + app). Yale Assure Lock (keypad + Z-Wave, HomeKit, works with Hub+). Keypad entry: no more lockout if keys left inside

## Privacy & Data Security
- **Cameras in home**: avoid placing in bathrooms, bedrooms (unless for child/ pet monitoring with clear awareness). Even "local" cameras sometimes have cloud backup. Verify: does app require cloud subscription? Does the camera upload data outside of your network? What happens if the company is hacked?
- **Cloud storage**: Ring/Nest store in cloud (subscription). Reolink/Eufy: local NVR storage optional + optional cloud. Local storage = more private (NVR, SD card). Cloud: vendor has access, security depend on them
- **Security vulnerabilities**: cheap IoT cameras are often insecure (default passwords, no firmware updates). Keep devices updated + separate network (IoT VLAN). Disable UPnP on router (can expose cameras to internet without port forwarding). Change default passwords. Use VLAN to isolate IoT devices from PC/phone
