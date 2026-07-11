# Digital Privacy & Security

## Overview
Digital privacy protects your personal information from unauthorized collection, use, and disclosure. Security protects your devices and accounts from compromise.

## Threat Model - Know Your Risk
```
High Risk: Journalists, activists, lawyers, crypto holders, abuse survivors
Medium Risk: Professionals with sensitive data, frequent travelers, public figures
Low Risk: General users, minimal sensitive data
```

**Determine yours**: What data do you have? Who might want it? What's the impact if compromised?

## Browser Privacy

### Hardened Firefox (Recommended)
```ini
# user.js key settings (use arkenfox/user.js or betterfox)
privacy.resistFingerprinting = true
privacy.trackingprotection.enabled = true
privacy.firstparty.isolate = true
network.cookie.cookieBehavior = 4  # Block third-party
network.dns.disablePrefetch = true
browser.safebrowsing.phishing.enabled = false
browser.safebrowsing.malware.enabled = false
dom.event.clipboardevents.enabled = false
media.peerconnection.enabled = false  # WebRTC leak prevention
```

### Extensions (Minimal Set)
- **uBlock Origin**: Ad/tracker/malware blocking
- **Privacy Badger**: Learning-based tracker blocking
- **HTTPS Everywhere**: Force HTTPS (built into modern browsers)
- **Cookie AutoDelete**: Clean cookies on tab close
- **Decentraleyes**: Local CDN emulation
- **CanvasBlocker**: Fingerprinting protection

### Alternative Browsers
| Browser | Privacy | Usability | Notes |
|---------|---------|-----------|-------|
| Firefox (hardened) | ★★★★★ | ★★★★☆ | Best balance |
| LibreWolf | ★★★★★ | ★★★☆☆ | Pre-hardened Firefox |
| Brave | ★★★★☆ | ★★★★★ | Built-in shields, crypto |
| Tor Browser | ★★★★★ | ★★☆☆☆ | Maximum anonymity |
| Mullvad Browser | ★★★★★ | ★★★☆☆ | Tor without Tor network |

### Search Engines
- **DuckDuckGo**: No tracking, !bangs
- **Startpage**: Google results, no tracking
- **Brave Search**: Independent index
- **SearXNG**: Self-hosted metasearch
- **Kagi**: Paid, no ads, customizable

## Account Security

### Password Manager (Essential)
| Option | Cost | Platforms | Notes |
|--------|------|-----------|-------|
| **Bitwarden** | Free/$10yr | All | Open source, self-hostable |
| **1Password** | $36/yr | All | Best UX, Secret Key |
| **KeePassXC** | Free | Desktop | Local only, manual sync |
| **Proton Pass** | Free/$48yr | All | Swiss, integrated with Proton |

**Master Password**: 4+ random words (diceware) = 50+ bits entropy

### Two-Factor Authentication (Priority Order)
1. **Hardware keys** (YubiKey, Nitrokey) - Phishing-proof
2. **Passkeys** (WebAuthn) - Phishing-proof, syncable
3. **TOTP apps** (Aegis, Bitwarden, Authy) - Good
4. **SMS/Email** - Weak (SIM swap, interception)

**Enforce 2FA on**: Email, password manager, banking, social, GitHub, AWS, domain registrar

### Passkeys (Future of Auth)
- Cryptographic key pair per site
- Stored in password manager / device
- Biometric/PIN unlock
- No password to phish
- Sync via iCloud/Google/Bitwarden

## Email Privacy

### Providers
| Provider | Encryption | Jurisdiction | Cost |
|----------|------------|--------------|------|
| **Proton Mail** | E2EE | Switzerland | Free/$48yr |
| **Tuta** | E2EE | Germany | Free/$36yr |
| **Fastmail** | At rest | Australia | $30-60yr |
| **Skiff** | E2EE | US | Free/$50yr |
| **Self-hosted** | Full control | Your choice | Time/$ |

### Aliases (Compartmentalization)
- **SimpleLogin** (Proton): Unlimited aliases, catch-all
- **AnonAddy**: Open source, custom domains
- **Firefox Relay**: 5 free, premium unlimited
- **Apple Hide My Email**: iCloud+ included

**Strategy**: Unique alias per service → breach contained, track spam source

### PGP/GPG (For High-Value Email)
```bash
# Generate key
gpg --full-generate-key
# RSA 4096, no expiry, strong passphrase

# Publish public key
gpg --keyserver keys.openpgp.org --send-keys KEYID

# Encrypt
gpg --encrypt --recipient recipient@email.com file.txt

# Sign
gpg --sign --armor file.txt
```

## Messaging (E2EE Required)

### Tier 1: Best
- **Signal**: Open source, minimal metadata, disappearing messages
- **Session**: No phone number, onion routing
- **SimpleX**: No identifiers, quantum-resistant

### Tier 2: Good
- **Threema**: Swiss, paid, no phone number needed
- **Wire**: Business-focused, EU hosted
- **Element (Matrix)**: Federated, self-hostable

### Tier 3: Avoid for Sensitive
- WhatsApp (Meta, metadata, backups)
- Telegram (not E2EE by default, cloud chats)
- iMessage (Apple keys, iCloud backup)
- SMS (no encryption)

### Metadata Protection
- **Signal**: Sealed sender, minimal metadata
- **Session/SimpleX**: No identifiers at all
- **Burner numbers**: MySudo, JMP.chat (XMPP+SMS)

## VPN & Network Privacy-Finding & DNS

### VPN Selection Criteria
- **No logs**: Audited, court-tested
- **Jurisdiction**: Privacy-friendly (Switzerland, Panama, BVI)
- **Protocol**: WireGuard, OpenVPN
- **Features**: Kill switch, split tunnel, port forwarding
- **Payment**: Anonymous (crypto, cash, gift card)

### Recommended
| VPN | Jurisdiction | Audit | Price |
|-----|--------------|-------|-------|
| **Mullvad** | Sweden | Yes | €5/mo |
| **IVPN** | Gibraltar | Yes | $6/mo |
| **Proton VPN** | Switzerland | Yes | Free/$8mo |
| **IVPN** | Gibraltar | Yes | $6/mo |

### DNS (Encrypted)
```bash
# DoH/DoT providers
# NextDNS: Custom blocking, analytics
# Quad9: 9.9.9.9 - Security focused
# Cloudflare: 1.1.1.1 - Fast, privacy policy
# AdGuard: Family/adult blocking options

# Configure in OS/router/browser
# Firefox: network.trr.mode = 3, network.trr.uri = https://dns.nextdns.io/xxxxx
```

### Pi-hole / AdGuard Home (Network-wide)
- Block ads/trackers at DNS level
- Works for all devices (IoT, smart TV)
- Custom blocklists
- Dashboard for monitoring

## Device Hardening

### Mobile (iOS/Android)
**iOS**
- Lockdown Mode (high risk)
- App Tracking Transparency: Off
- Location: Precise off, per-app
- Private Wi-Fi Address: On
- Limit IP Address Tracking: On
- Automatic Updates: On

**Android (GrapheneOS > CalyxOS > Stock + hardening)**
- GrapheneOS: Pixel only, maximum hardening
- CalyxOS: Pixel + microG, easier
- Remove Google: /e/OS, LineageOS, iodéOS
- F-Droid / Aurora Store for apps

**Both**
- Encrypt device (default modern)
- Strong lock: 6+ digit PIN / alphanumeric / biometric
- Auto-lock: 30 sec - 1 min
- USB restricted mode (iOS) / USB debugging off
- App permissions: Minimal, review quarterly

### Desktop (Linux/macOS/Windows)
**Linux (Fedora, Arch, NixOS, Qubes)**
- Full disk encryption (LUKS2)
- Secure boot + signed kernels
- Firewall: nftables/ufw
- Mandatory access control: SELinux/AppArmor
- Flatpak/snap permissions review

**macOS**
- FileVault: On
- Firewall: On + stealth mode
- SIP: Enabled (default)
- Gatekeeper: App Store + identified developers
- Lockdown Mode (high risk)

**Windows**
- BitLocker: On (TPM 2.0)
- Defender: Max protection
- Firewall: Block inbound, restrict outbound
- Debloat: ChrisTitusTech WinUtil
- Hardening: Harden Windows Security, ConfigureDefender

### Firmware/BIOS
- Admin password
- Secure Boot: On
- Boot order: Internal only
- Disable: Thunderbolt (if not used), unused ports
- TPM 2.0: Enabled
- Intel ME/AMD PSP: Disable if possible

## Data Minimization

### Data Brokers Opt-Out
**Automated**
- **DeleteMe** / **Kanary** / **Optery**: Paid services
- **Privacy.com**: Virtual cards + data removal

**Manual (Top 10)**
1. Whitepages
2. Spokeo
2. BeenVerified
4. Intelius
5. PeopleFinders
6. MyLife
7. Radaris
8. TruePeopleSearch
9. FastPeopleSearch
10. FamilyTreeNow

**Process**: Search → Opt-out link → Verify email → Confirm

### Social Media
- **Delete unused accounts**
- **Lock down**: Private, friends only
- **Remove**: Phone, email, birthday, location from profile
- **Posts**: Limit audience, delete old
- **Ads**: Opt-out personalized (settings → ads)
- **Download data**: Archive before deleting

### Browser Data
- Clear on close: Cookies, cache, history
- Containers: Separate identities (banking, shopping, social)
- Private windows: Temporary sessions
- Sync: Encrypted, minimal data

## Financial Privacy

### Virtual Cards
- **Privacy.com**: Free, per-merchant cards, limits
- **Revolut/Wise**: Disposable virtual cards
- **Bank native**: Capital One Eno, Citi Virtual, Apple Card

### Cryptocurrency (If Used)
- **Hardware wallet**: Ledger, Trezor, Coldcard
- **Non-custodial**: Electrum, Sparrow, BlueWallet
- **Coin control**: Avoid address reuse
- **Mixing**: Wasabi, JoinMarket (legal risks vary)
- **Monero**: Default privacy

### Credit Freeze (US)
- **Free**: Equifax, Experian, TransUnion
- **Lift**: Temporary for applications
- **Monitor**: Credit Karma, annualcreditreport.com

## Physical Security

### Device
- **Camera cover**: Slide or tape
- **Mic blocker**: Hardware switch or plug
- **Privacy screen**: Laptop/phone
- **Faraday bag**: Phone/laptop when not in use
- **Cable lock**: Laptop in public

### Home Network
- Router: OpenWrt, OPNsense, pfSense
- VLANs: IoT, guests, main, admin
- DNS: Pi-hole/AdGuard + DoH upstream
- VPN: WireGuard for remote access
- Firmware: Auto-update

### Documents
- Shred: Cross-cut, everything with PII
- Digital: Encrypted (VeraCrypt, Cryptomator)
- Backup: 3-2-1 rule, encrypted
- Cloud: Cryptomator before upload

## Incident Response

### If Compromised
1. **Isolate**: Disconnect network
2. **Assess**: What's affected?
3. **Contain**: Change passwords (clean device)
4. **Recover**: Restore from clean backup
5. **Report**: Bank, IC3, FTC, police if needed
6. **Learn**: Post-mortem, improve

### Breach Check
- **Have I Been Pwned**: Email/phone
- **DeHashed**: More databases
- **Monitor**: Firefox Monitor, 1Password Watchtower

### Identity Theft
- Credit freeze (immediate)
- Fraud alert (90 days)
- IRS IP PIN
- SSA block electronic access
- Police report
- FTC IdentityTheft.gov

## Legal Rights (US)
- **4th Amendment**: Device searches at border (complex)
- **CCPA/CPRA**: California - delete, opt-out, know
- **GDPR**: EU - access, rectify, erase, portability
- **HIPAA**: Health data
- **FERPA**: Education records
- **FCRA**: Credit reporting

## Resources

### Guides
- **Privacy Guides** (privacyguides.org) - Gold standard
- **Michael Bazzell**: Extreme Privacy
- **The New Oil**: Privacy education
- **Techlore**: Videos, guides

### Tools
- **Privacy.sexy**: Hardening scripts
- **HardeningKitty**: Firefox hardening
- **Hardened_malloc**: Memory allocator
- **Kernel Hardening**: linux-hardened

### Communities
- r/privacy, r/privacytoolsIO
- Privacy Guides Matrix/Discord
- GrapheneOS Matrix
- Self-hosted communities