# Security & Cryptography

## Password Security
- Min 12 characters, mix of cases/digits/symbols
- Use a password manager (Bitwarden, KeePassXC)
- Enable 2FA where possible (TOTP > SMS)
- Never reuse passwords across sites
- Passphrase > complex random string (easier to remember/type)
- Default passwords: `admin:admin`, `root:root`, `pi:raspberry`

## Encryption Types
- **Symmetric**: same key for encrypt/decrypt (AES-256-GCM, ChaCha20-Poly1305)
  - Fast, good for bulk encryption
  - Key distribution is the challenge
- **Asymmetric**: public/private key pair (RSA, ECDSA, Ed25519)
  - Encrypt with public key, decrypt with private key
  - Sign with private key, verify with public key
  - Slower, used for key exchange and signatures
- **Hybrid**: asymmetric to exchange symmetric key, then symmetric for data (TLS, PGP)
- **Hashing**: one-way (SHA-256, SHA-3, BLAKE2)
  - Not encryption — cannot reverse
  - Used for passwords (with salt), integrity checks, digital signatures
- **Key Derivation**: PBKDF2, bcrypt, scrypt, argon2
  - Deliberately slow to resist brute force
  - Argon2id is currently recommended (winner of PHC)

## Common Attacks
- **Phishing**: fake emails/sites stealing credentials
- **Man-in-the-Middle**: attacker intercepts communication (prevent with TLS)
- **SQL Injection**: malicious SQL in input fields (prevent with parameterized queries)
- **XSS**: injected scripts in web pages (prevent with output encoding + CSP)
- **CSRF**: forged requests from other sites (prevent with anti-CSRF token + SameSite cookies)
- **Buffer Overflow**: writing past buffer bounds (prevent with bounds checking, ASLR, NX)
- **Race Condition**: time-of-check/time-of-use (prevent with locks, atomic ops)
- **DDoS**: overwhelming a service with traffic (mitigate with rate limiting, CDN, WAF)
- **Supply Chain**: compromised dependencies (verify hashes, pin versions, audit)
- **Social Engineering**: manipulating people to reveal information

## TLS Handshake (simplified)
1. Client sends supported ciphers + TLS version
2. Server picks cipher, sends certificate (public key)
3. Client verifies certificate (CA chain, hostname, expiry)
4. Client generates session key, encrypts with server's public key
5. Server decrypts with private key — both now have shared symmetric key
6. Encrypted communication begins

## Certificates
- **CA** (Certificate Authority): trusted third party that signs certificates
- **Let's Encrypt**: free automated CA (uses ACME protocol, certbot)
- **Self-signed**: free but triggers browser warnings (use for internal/test only)
- Certificate validation: check CA signature, hostname match, not expired, not revoked (CRL/OCSP)
- `openssl s_client -connect example.com:443` — inspect remote cert

## GPG (GNU Privacy Guard)
```bash
gpg --full-generate-key        # create keypair
gpg --list-keys                # list public keys
gpg --list-secret-keys         # list private keys
gpg -c file                    # symmetric encrypt
gpg -d file.gpg                # decrypt
gpg --encrypt --recipient user@example.com file
gpg --sign file                # sign with your key
gpg --verify file.sig          # verify signature
gpg --export -a user@example.com > pubkey.asc
gpg --import pubkey.asc
gpg --keyserver keyserver.ubuntu.com --search-keys user@example.com
```

## SSH Key Authentication
- Ed25519 recommended over RSA (smaller, faster, equally secure)
- Generate: `ssh-keygen -t ed25519 -a 100`
- Add to agent: `ssh-add ~/.ssh/id_ed25519`
- Copy to server: `ssh-copy-id user@host`
- Protect private key: `chmod 600 ~/.ssh/id_ed25519`

## Hardening Checklist
- Keep system updated (security patches)
- Use a firewall (UFW, firewalld, nftables)
- Disable root SSH login
- Use SSH keys (disable password auth)
- Enable SELinux or AppArmor
- Use full-disk encryption (LUKS)
- Regular backups (3-2-1 rule: 3 copies, 2 media, 1 offsite)
- Use fail2ban to block brute force attempts
- Audit open ports: `ss -tulpn`, `nmap -sV localhost`
- Check for suspicious cron jobs: `crontab -l`, `ls /etc/cron*`
- Review system logs regularly: `journalctl -p err`
