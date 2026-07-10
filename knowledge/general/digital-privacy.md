# Digital Privacy & Security

## Threat Modeling
- **Who's after your data?** Mass surveillance (government — warrants, NSLs). Corporate tracking (advertisers, data brokers). Criminals (identity theft, scams, ransomware). Personal (stalkers, abusive partners, nosy colleagues — see gift guides?). Targeted attacks (journalists, activists, lawyers — high risk). Your threat model determines what protections matter
  - Threat modeling process: what data is valuable? Who might want it? How could they get it? What are consequences? What's your budget (time/money)?
- **Common threats**: phishing (targeted email/ SMS fraud — 90% of breaches). Password reuse (credential stuffing — 1 breach exposes many accounts). Malware (ransomware, keyloggers, stalkerware). Social engineering (pretexting: fake phone call from "IT support" asking for password). Public Wi-Fi (packet sniffing — unencrypted traffic intercepted)

## Passwords & Authentication
- **Password manager**: Bitwarden (free, open-source, cross-platform). 1Password ($4-5/month, polished). KeePassXC (free, local-only). Apple iCloud Keychain (built-in, Apple devices only). Google Password Manager (built-in Chrome/Android). Self-host: Vaultwarden (server that syncs Bitwarden clients)
  - Features: generate strong unique passwords for every site, autofill, share securely with family. TOTP 2FA codes (1Password, Bitwarden premium). Emergency access (designate someone who can request access after waiting period)
- **2FA/MFA**: authenticator app (TOTP — Authy, Google Authenticator, Microsoft Authenticator, 2FAS, Raivo) > SMS (can be SIM swapped) > hardware key (YubiKey, Google Titan, Nitrokey). Use hardware key for important accounts (Google, Apple, Microsoft, GitHub, password manager). U2F/FIDO2 standard: hardware key prevents phishing (browser checks domain)
  - 2FA backup codes: keep them safe, test one after setup. Print + store offline. Don't keep only on your phone
- **Passkeys**: FIDO2/ WebAuthn — passwordless authentication with device biometrics (face/Touch ID). Replaces password with cryptographic key pair. Synced across devices (iCloud Keychain, Google Password Manager, 1Password). More secure than passwords (phishing resistant). Future of authentication

## Browser Privacy
- **Brave**: built-in ad + tracker blocker (blocks ads + trackers out of the box). Shields (per-site anti-fingerprinting, HTTPS upgrades). Chromium-based (works with Chrome extensions). Has Brave Rewards (optional cryptocurrency not needed)
- **Firefox**: enhanced tracking protection, container tabs (isolate Facebook/ Google in separate containers — Mozilla Multi-Account Containers). Open-source, independent (not Chromium-based). Good privacy (resistFingerprinting about:config flag). Slower than Chrome
- **uBlock Origin**: best ad blocker (block ads, trackers, malware domains, cookiewalls. Works on Chrome/Firefox/Edge). Lightweight, open-source. NOT the same as AdBlock Plus (which allows "acceptable ads")
- **Search engines**: DuckDuckGo (anonymous searches, no tracking). Startpage (Google results anonymously — uses Google's results without Google tracking you). Brave Search (independent index, privacy-focused). Kagi (paid $5-10/month, best results, no ads, no tracking). Google (they track everything — best results but worst privacy)
- **Extensions for privacy**: Privacy Badger (blocks trackers, learns as you browse). HTTPS Everywhere (now built into Firefox/Chrome). Decentraleyes (blocks trackers that serve fonts/JS from CDN). NoScript (blocks all scripts, too extreme for many)

## Social Media Hygiene
- **Limit personal info**: don't share full birthdate, home address, phone number, children's names + schools, vacation dates, location history. Facebook/Instagram: set all to "Friends Only" (or completely delete). Review tagged photos + posts. Remove old posts/apps
- **Regular cleanup**: delete unused accounts. Remove old social media apps. Review app permissions (phone, contacts, location, camera, microphone). Revoke unneeded permissions. Check: Facebook "Apps and Websites" setting (revoke all unknown apps). Google account: third-party apps with access
- **Messaging**: Signal > WhatsApp > Telegram > SMS. Signal: end-to-end encrypted, open-source, no metadata collection. WhatsApp: E2E (for chats, not backups unless turned on), owned by Meta (metadata collected — who you talk to, when, for how long). Telegram: not E2E by default (only Secret Chats, not group). iMessage: E2E on Apple devices (not crossing iCloud backup). SMS: SMS/MMS not encrypted — use Signal instead. Standard SMS is plain text

## Device Security
- **Phone**: PIN/passcode (6+ digits, not 4). Biometric (Face ID/Touch ID) convenient, but police can force biometric unlock (in US). Best: strong alphanumeric passcode. iOS more secure than Android (tighter app sandboxing, faster updates). Android: use Google Pixel (fast updates, GrapheneOS available)
  - iPhone lockdown mode: extreme protection for high-risk users (disables some web features, incoming FaceTime blocked if not previously contacted, wired accessories disabled when locked). Android: similar "extreme battery saver"? No — use GrapheneOS for hardened Android
  - Stolen device: Find My iPhone (Activation Lock, mark as lost, remote wipe). Android: Find My Device (remotely lock, erase). Enable: automatic backup to cloud. Disable: lock screen notifications (hide message previews until phone unlocked)
- **Computer**: Full disk encryption (FileVault on Mac, BitLocker on Windows, LUKS on Linux). Auto-lock after 5 min. Regular security updates. Avoid: pirated software, browser extensions with no reviews, admin account for daily use. Use ad blocker (uBlock Origin). Disable automatic download + execution of macros in Office
  - Microphone + camera covers (laptops: many have physical shutter or you can use tape). Turn off WiFi/BT when not needed. Don't use public USB chargers (data over USB — use data blocker or charge-only cable/ AC only)

## Network Security
- **Home Wi-Fi**: WPA3 (or WPA2-AES) encryption. Strong password (20+ random characters). Don't broadcast SSID as identifying (like "FBI Surveillance Van"). Guest network for IoT devices. Disable WPS. Use Pi-hole or AdGuard for DNS-level ad blocking for whole network
  - DNS privacy: use DNS-over-HTTPS (DoH) or DNS-over-TLS (DoT). Cloudflare 1.1.1.1, Quad9 9.9.9.9, or NextDNS (custom filtering). Configure on router per device. Encrypt DNS to prevent ISP from tracking websites
- **VPN**: encrypts internet traffic to VPN server. Hides IP from websites. Good for: public Wi-Fi, ISP hiding, geo-unblocking. NOT anonymous (VPN provider can see traffic). Choose: Mullvad (anonymous, no email, $5/mo, accepts cash). ProtonVPN (free tier available, Switzerland-based, no logs). iVPN (Netherlands, port forwarding). IVPN (audited no-logs). Avoid: free VPNs (sell data, inject ads, malware). Avoid: HMA, PureVPN, IPVanish (logged data before)
  - Kill switch: if VPN drops, block all traffic (prevent IP leak). WireGuard: fastest, simplest, modern protocol. OpenVPN: older, more configurable

## Data Brokers & Opt-Out
- **Data broker opt-out**: DeleteMe ($129/year, does it for you). or DIY: opt-outs for major data brokers (Whitepages, Spokeo, BeenVerified, MyLife, Intelius, Acxiom, PeopleFinders. Each requires separate process (mail a form, verify email, provide ID. Some require notarized letter). OptOutPrescreen.com: stop pre-approved credit card offers (5 years). DoNotCall.gov: stop telemarketing calls. DMAchoice.org: reduce junk mail

## Communications Security
- **Email encryption**: ProtonMail (end-to-end encrypted, Switzerland). Tutanota (encrypted, Germany). Can't encrypt subject line + metadata (from/to). PGP: very secure for email, complex setup (public/private key pairs, no large attachment support). Most secure: don't use email for secrets — use Signal
- **Signal**: gold standard for secure messaging + calls. End-to-end encrypted, open source, disappearing messages, no metadata, no ads. Requires phone number for signup (use Google Voice? Signal notifies if you). Sealed sender: even Signal doesn't know who sent to whom
