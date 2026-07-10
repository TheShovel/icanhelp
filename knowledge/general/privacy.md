# Digital Privacy

## Threat Modeling
- **Who are you protecting from?** Advertisers, governments, employers, stalkers, thieves?
- **What data matters?** Location, communications, browsing habits, financials, health?
- **What's your risk appetite?** Convenience vs. privacy is a spectrum — pick appropriate tools

## Browser Privacy
- Use **Firefox** (with `about:config` hardening) or **Brave** (built-in shields)
- Extensions:
  - **uBlock Origin** — efficient ad/tracker blocking (not just adblock, also anti-tracking cosmetic filters)
  - **Privacy Badger** — learns blocking rules for 3rd-party trackers
  - **CanvasBlocker** — prevents canvas fingerprinting
  - **ClearURLs** — strips tracking params from URLs
- Settings:
  - Enable **Do Not Track** (DNT) — ignored by many, no harm
  - Block third-party cookies
  - Enable **HTTPS-Only mode**
  - Disable **DNS over HTTPS** if using system-level encrypted DNS
- User agent randomization is detectable and fingerprintable — don't bother

## Search Engines
- **DuckDuckGo** — privacy-focused, still uses Bing index, some CDN tracking
- **SearXNG** — self-hosted metasearch engine, aggregates results privately
- **Kagi** — paid, privacy-respecting, excellent results, no ads/tracking

## Email & Communication
- **Proton Mail** — encrypted at rest, Swiss jurisdiction, zero-access encryption
- **Tutanota** — fully encrypted, German jurisdiction
- **SimpleLogin** / **Addy.io** — email aliases to hide real address
- **Signal** — E2EE messaging, open source, minimal metadata
- **Matrix** (Element client) — decentralized, federated, E2EE optional

## VPNs
- Avoid free VPNs — they monetize by selling your data
- **Mullvad** — no account needed, accepts cash, audited no-logs policy
- **ProtonVPN** — integrated with Proton Mail, free tier available (no logs)
- **WireGuard** protocol preferred over OpenVPN (faster, simpler, audited)
- Kill switch: block all traffic if VPN drops
- **What a VPN hides**: IP address from websites, traffic from ISP
- **What a VPN does NOT hide**: cookies/logins from sites, DNS leaks (test at `ipleak.net`), metadata (you still connect to sites)

## Password Management
- Use a **password manager** (Bitwarden, 1Password, KeePassXC)
- Every account gets a unique, randomly generated password (16+ chars)
- Enable 2FA/MFA everywhere it's offered
  - **TOTP** (Time-based One-Time Password) via authenticator app (Aegis, 2FAS, Bitwarden) — better than SMS
  - **WebAuthn/passkeys** — hardware security keys (YubiKey) or platform authenticator
- **Passkeys**: replacing passwords entirely — phishing-resistant, device-bound

## Device & OS Privacy
- **Linux**: generally most private (no telemetry, open source, granular permissions)
  - Use FDE (full disk encryption) — LUKS on Linux
- **macOS**: decent privacy, but iCloud/analytics telemetry can be disabled
- **Android** (GrapheneOS / CalyxOS) vs stock Android — Google Play Services is a major tracker
- **iOS**: strong app sandboxing, but Apple has iCloud data access
- Disable telemetry, location history, ad ID, Bluetooth scanning
- Use a local firewall: `ufw`/`nftables` on Linux, Little Snitch on macOS

## Metadata & Attribution
- **Email headers**: IP, client info, routing — use aliases and Proton/Tutanota
- **File metadata (EXIF)**: GPS coordinates, camera model, timestamps — strip with `exiftool -all=` before sharing
- **Browser fingerprinting**: screen resolution, fonts, GPU, timezone — creates unique hash; Brave + ResistFingerprinting helps
- **Correlation attacks**: different anonymous accounts linked by writing style, behavior patterns, login times