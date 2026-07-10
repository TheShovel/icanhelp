# Digital Privacy & Security

## Threat Modeling
- Identify what data you need to protect (passwords, location, browsing, messages)
- Identify who might want it (advertisers, employers, governments, criminals)
- Choose protections proportional to risk — convenience vs. security tradeoffs
- Common models: your threat is mass surveillance, not targeted attack

## Password Management
- Use a password manager (Bitwarden, KeePassXC, 1Password, Proton Pass)
- Generate unique 15+ character random passwords per site
- Never reuse passwords across services
- Enable 2FA/MFA everywhere: TOTP (Authy, Aegis, 2FAS) > SMS > none
- Store TOTP seeds in authenticator app, NOT same device as password manager
- Use passkeys/FIDO2/WebAuthn where supported (hardware tokens: YubiKey, Nitrokey)
- Emergency access: designate trusted contacts or store backup codes offline

## Browser Hardening
- **Firefox**: `about:config` — set `privacy.trackingprotection.fingerprinting.enabled=true`, `privacy.resistFingerprinting=true`, `network.dns.disablePrefetch=true`
- Use uBlock Origin (best ad/tracker blocker, medium mode recommended)
- Use containers (Firefox Multi-Account Containers) to isolate sessions
- Enable DNS-over-HTTPS (DoH): Settings → Network Settings → Enable DNS over HTTPS
- Use **Brave** as Chromium alternative: built-in Shields, fingerprinting protection, Tor tabs
- Disable WebRTC leak: `media.peerconnection.enabled=false` in Firefox
- Regularly clear cookies, or use auto-deleting exceptions (Firefox: clear on close + exceptions)

## VPNs vs. Proxies vs. Tor
- **VPN**: encrypts all traffic, routes through VPN server, trusted provider sees all
  - Use: Mullvad, Proton VPN, IVPN — no-logs policy, accepts anonymous payments
  - Avoid: free VPNs (they sell data), provider based in 5/9/14-eyes if concerned
  - Kill switch: always enable (cuts internet if VPN drops)
  - Not a privacy silver bullet — websites still track via accounts, cookies, fingerprinting
- **Tor Browser**: routes through 3 relays, anonymity network, slower but strongest
  - Use for sensitive research, whistleblowing, bypassing censorship
  - Don't torrent over Tor, don't install extra extensions, don't maximize window
- **HTTP/SOCKS proxies**: per-application tunneling, no encryption on their own
- **Split tunneling**: route only specific apps through VPN

## Email Privacy
- **Proton Mail** — end-to-end encrypted, zero-access encryption, Swiss jurisdiction
- **Tutanota** — encrypted, open-source, European
- **SimpleLogin / Addy.io** — email aliases to mask real address
- Use aliases per service so tracking across services fails
- PGP encryption: still useful for specific contacts, but usability is poor
- Avoid: Gmail, Outlook, Yahoo for sensitive communication (no E2EE by default)

## Messaging Apps (E2EE)
| App | E2EE Default | Metadata Protection | Open Source |
|-----|-------------|-------------------|-------------|
| Signal | Yes | Minimal (no message content) | Yes |
| WhatsApp | Yes (Signal protocol) | Metadata shared with Meta | No |
| Telegram Secret Chats | Yes (only secret chats) | Weak | Partial |
| Element/Matrix | Yes | Server-dependent | Yes |
| SimpleX | Yes | No identifiers at all | Yes |

- **Signal** is the gold standard: disappearing messages, sealed sender, open source
- Verify safety numbers out-of-band for sensitive conversations

## Device Security
- Full disk encryption: LUKS (Linux), BitLocker (Windows), FileVault (macOS)
- Use strong disk encryption passphrase, not TPM-only unlock
- Lock screen with short timeout (5 min max)
- Smartphone: use PIN//password (6+ digits), NOT pattern or biometric alone
- Keep OS and apps updated// — zero-days are the main attack vector
- Disable Bluetooth/WiFi when not in use
- Remove unnecessary apps and permissions

## Data Backup (3-2-1 Rule)
- **3** copies of data, **2** different media types, **1** off-site
- Example: local NAS + external HDD + cloud backup (Backblaze B2, BorgBase)
- Encrypt backups before uploading (`gpg -c`, `rclone crypt`, Borg encryption)
- Test restore process annually

## OSINT Exposure Reduction
- Remove yourself from people-search sites (DuckDuckGo's removal guide)
- Use different usernames across services (don't reuse handles)
- Minimize social media: set to private, remove old accounts, avoid check-ins
- Use fake details where legal (don't use real birthday/phone for store loyalty cards)
- Check `haveibeenpwned.com` for breach exposure (Firefox Monitor)
- Google yourself regularly to audit public information

## Anti-Forensics
- Use incognito/private browsing (limits local history, not IP tracking)
- Secure delete: `shred -uz file` (overwrite + remove), `wipe` for directories
- Full disk wipe before selling: `blkdiscard /dev/sda` for SSDs, DBAN for HDDs
- Use `tmpfs` for ephemeral files: `mount -t tmpfs tmpfs /mnt/ramdisk`
- Metadata stripping: `exiftool -all= *.jpg` to remove EXIF, `mat2` for various formats
