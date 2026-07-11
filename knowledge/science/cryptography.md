# Cryptography Fundamentals

## Overview
Cryptography is the practice of secure communication in the presence of adversaries. It provides confidentiality, integrity, authentication, and non-repudiation.

## Symmetric Encryption

### Block Ciphers
| Algorithm | Block Size | Key Sizes | Status |
|-----------|------------|-----------|--------|
| **AES** | 128-bit | 128, 192, 256 | Standard |
| **ChaCha20** | 512-bit | 256 | Modern, fast |
| **DES** | 64-bit | 56 | **Broken** |
| **3DES** | 64-bit | 112, 168 | **Deprecated** |
| **Blowfish** | 64-bit | 32-448 | Legacy |
| **Twofish** | 128-bit | 128, 192, 256 | Secure |

### Modes of Operation
```text
ECB (Electronic Codebook)    - NEVER USE - patterns visible
CBC (Cipher Block Chaining)  - IV required, sequential
CTR (Counter)                - Parallel, stream-like
GCM (Galois/Counter Mode)    - AEAD, authenticated
CCM (Counter with CBC-MAC)   - AEAD, constrained
OCB (Offset Codebook)        - AEAD, patented (expired)
```

### AES-GC Example (Python)
```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)
nonce = os.urandom(12)  # 96-bit nonce
plaintext = b"Secret message"
associated_data = b"header"

ciphertext = aesgcm.encrypt(nonce, plaintext, associated_data)
# ciphertext = ciphertext + tag (16 bytes)

decrypted = aesgcm.decrypt(nonce, ciphertext, associated_data)
```

### ChaCha20-Poly1305
```python
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305

key = ChaCha20Poly1305.generate_key()
cipher = ChaCha20Poly1305(key)
nonce = os.urandom(12)

ciphertext = cipher.encrypt(nonce, plaintext, associated_data)
decrypted = cipher.decrypt(nonce, ciphertext, associated_data)
```

## Asymmetric Encryption

### RSA
```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

# Generate key pair
private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
public_key = private_key.public_key()

# Encrypt (with OAEP)
ciphertext = public_key.encrypt(
    plaintext,
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)

# Decrypt
plaintext = private_key.decrypt(
    ciphertext,
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)
```

### Key Sizes (NIST Recommendations 2024)
| Algorithm | Legacy | Current | Future |
|-----------|--------|---------|--------|
| RSA | 1024 | 2048 | 3072+ |
| ECC | 160 | 256 | 384+ |
| DH | 1024 | 2048 | 3072+ |
| AES | 128 | 256 | 256 |

### Elliptic Curve Cryptography (ECC)
```python
from cryptography.hazmat.primitives.asymmetric import ec

# Generate key pair
private_key = ec.generate_private_key(ec.SECP256R1())
public_key = private_key.public_key()

# ECDH Key Exchange
peer_public_key = ...  # Received from peer
shared_key = private_key.exchange(ec.ECDH(), peer_public_key)

# Derive symmetric key
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
derived_key = HKDF(
    algorithm=hashes.SHA256(),
    length=32,
    salt=None,
    info=b'handshake data'
).derive(shared_key)

# ECDSA Signing
signature = private_key.sign(
    message,
    ec.ECDSA(hashes.SHA256())
)

# Verification
public_key.verify(signature, message, ec.ECDSA(hashes.SHA256()))
```

## Hash Functions

### Properties
- **Preimage Resistance**: Hard to find input for given hash
- **Second Preimage Resistance**: Hard to find different input with same hash
- **Collision Resistance**: Hard to find any two inputs with same hash

### Common Hash Functions
| Algorithm | Output | Status |
|-----------|--------|--------|
| **SHA-256** | 256-bit | Standard |
| **SHA-384** | 384-bit | Standard |
| **SHA-512** | 512-bit | Standard |
| **SHA-3 (Keccak)** | 224-512 | Standard |
| **BLAKE2b** | 512-bit | Fast, secure |
| **BLAKE3** | 256-bit | Very fast |
| **MD5** | 128-bit | **Broken** |
| **SHA-1** | 160-bit | **Broken** |

### Usage
```python
from cryptography.hazmat.primitives import hashes

# SHA-256
digest = hashes.Hash(hashes.SHA256())
digest.update(b"data")
hash_value = digest.finalize()

# SHA-3
digest = hashes.Hash(hashes.SHA3_256())
digest.update(b"data")
hash_value = digest.finalize()

# BLAKE2
from cryptography.hazmat.primitives import hashes
digest = hashes.Hash(hashes.BLAKE2b(64))
digest.update(b"data")
hash_value = digest.finalize()
```

## Message Authentication Codes (MAC)

### HMAC
```python
import hmac
import hashlib

key = b"secret-key"
message = b"message"

# HMAC-SHA256
mac = hmac.new(key, message, hashlib.sha256).digest()

# Verify
expected_mac = hmac.new(key, message, hashlib.sha256).digest()
hmac.compare_digest(mac, expected_mac)  # Constant-time comparison
```

### CMAC (AES-based)
```python
from cryptography.hazmat.primitives.cmac import CMAC
from cryptography.hazmat.primitives.ciphers import algorithms

cmac = CMAC(algorithms.AES(key))
cmac.update(message)
tag = cmac.finalize()

# Verify
cmac = CMAC(algorithms.AES(key))
cmac.update(message)
cmac.verify(tag)
```

## Key Derivation Functions (KDF)

### PBKDF2 (Password-Based)
```python
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
import os

salt = os.urandom(16)
kdf = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length=32,
    salt=salt,
    iterations=100000,  # Minimum 100k, preferably 600k+
)
key = kdf.derive(password.encode())
```

### Argon2 (Modern, Memory-Hard)
```python
from cryptography.hazmat.primitives.kdf.argon2 import Argon2id

salt = os.urandom(16)
kdf = Argon2id(
    salt=salt,
    length=32,
    iterations=3,       # Time cost
    memory=65536,       # Memory cost (64 MB)
    parallelism=4,      # Parallelism
    hashlen=32,
    type=Type.ID
)
key = kdf.derive(password.encode())
```

### HKDF (Key-Based)
```python
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

hkdf = HKDF(
    algorithm=hashes.SHA256(),
    length=32,
    salt=salt,
    info=b'application-specific-info'
)
derived_key = hkdf.derive(input_key_material)
```

## Digital Signatures

### RSA-PSS
```python
from cryptography.hazmat.primitives.asymmetric import padding

signature = private_key.sign(
    message,
    padding.PSS(
        mgf=padding.MGF1(hashes.SHA256()),
        salt_length=padding.PSS.MAX_LENGTH
    ),
    hashes.SHA256()
)

public_key.verify(
    signature,
    message,
    padding.PSS(
        mgf=padding.MGF1(hashes.SHA256()),
        salt_length=padding.PSS.MAX_LENGTH
    ),
    hashes.SHA256()
)
```

### Ed25519 (Modern, Fast)
```python
from cryptography.hazmat.primitives.asymmetric import ed25519

private_key = ed25519.Ed25519PrivateKey.generate()
public_key = private_key.public_key()

signature = private_key.sign(message)
public_key.verify(signature, message)
```

## TLS/SSL

### Certificate Structure (X.509)
```text
Certificate:
    Version: 3 (0x2)
    Serial Number: 1234567890
    Signature Algorithm: sha256WithRSAEncryption
    Issuer: CN=Let's Encrypt Authority X3, O=Let's Encrypt, C=US
    Validity:
        Not Before: Jan 1 00:00:00 2024 GMT
        Not After:  Apr 1 00:00:00 2024 GMT
    Subject: CN=example.com
    Subject Public Key Info:
        Public Key Algorithm: rsaEncryption
        Public-Key: (2048 bit)
    X509v3 Extensions:
        X509v3 Subject Alternative Name:
            DNS:example.com, DNS:www.example.com
        X509v3 Key Usage: critical
            Digital Signature, Key Encipherment
        X509v3 Extended Key Usage:
            TLS Web Server Authentication, TLS Web Client Authentication
        Authority Information Access:
            OCSP - URI:http://ocsp.int-x3.letsencrypt.org
            CA Issuers - URI:http://cert.int-x3.letsencrypt.org/
```

### TLS 1.3 Handshake
```text
Client                          Server
-----                          ------
ClientHello (key_share)   ------>
                          <------  ServerHello (key_share)
                          <------  EncryptedExtensions
                          <------  CertificateRequest
                          <------  Certificate
                          <------  CertificateVerify
                          <------  Finished
Client Finished (CertificateVerify) ------>
Application Data           <------>  Application Data
```

### Cipher Suites (TLS 1.3)
```text
TLS_AES_256_GCM_SHA384          - Recommended
TLS_CHACHA20_POLY1305_SHA256    - Recommended (mobile)
TLS_AES_128_GCM_SHA256          - Acceptable
TLS_AES_128_CCM_SHA256          - Constrained devices
```

### Certificate Generation (OpenSSL)
```bash
# Private key
openssl genrsa -out private.key 2048

# CSR
openssl req -new -key private.key -out request.csr -subj "/CN=example.com"

# Self-signed
openssl req -x509 -new -key private.key -out cert.pem -days 365 -subj "/CN=example.com"

# With SAN
openssl req -new -key private.key -out request.csr -config openssl.cnf

# openssl.cnf
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = example.com

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = example.com
DNS.2 = www.example.com
```

### Let's Encrypt (ACME)
```bash
# certbot
certbot certonly --standalone -d example.com -d www.example.com

# With nginx
certbot --nginx -d example.com

# Auto-renewal
certbot renew --dry-run
systemctl enable certbot.timer
```

## Public Key Infrastructure (PKI)

### Certificate Authority Setup
```bash
# Root CA
openssl genrsa -out rootCA.key 4096
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 3650 -out rootCA.pem -subj "/CN=My Root CA"

# Intermediate CA
openssl genrsa -out intermediate.key 4096
openssl req -new -key intermediate.key -out intermediate.csr -subj "/CN=My Intermediate CA"
openssl x509 -req -in intermediate.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out intermediate.pem -days 1825 -sha256

# Sign server cert
openssl x509 -req -in server.csr -CA intermediate.pem -CAkey intermediate.key -CAcreateserial -out server.pem -days 365 -sha256 -extfile server.ext
```

### Certificate Revocation
```bash
# CRL
openssl ca -gencrl -keyfile ca.key -cert ca.pem -out crl.pem

# OCSP responder
openssl ocsp -index index.txt -CA ca.pem -rkey ca.key -rsigner ca.pem -port 8888 -text
```

## Cryptographic Protocols

### SSH
```bash
# Key generation
ssh-keygen -t ed25519 -C "user@host"
ssh-keygen -t rsa -b 4096 -C "user@host"

# Key exchange algorithms (modern)
# curve25519-sha256, curve25519-sha256@libssh.org
# ecdh-sha2-nistp256, ecdh-sha2-nistp384, ecdh-sha2-nistp521

# Ciphers
# chacha20-poly1305@openssh.com
# aes256-gcm@openssh.com
# aes128-gcm@openssh.com

# MACs
# hmac-sha2-256-etm@openssh.com
# hmac-sha2-512-etm@openssh.com
```

### PGP/GPG
```bash
# Generate key
gpg --full-generate-key

# Export public key
gpg --armor --export user@example.com > public.key

# Encrypt
gpg --encrypt --recipient user@example.com file.txt

# Decrypt
gpg --decrypt file.txt.gpg > file.txt

# Sign
gpg --sign --armor file.txt

# Verify
gpg --verify file.txt.asc
```

### Age (Modern File Encryption)
```bash
# Generate key
age-keygen -o key.txt

# Encrypt
age -r age1... file.txt > file.txt.age

# Decrypt
age -d -i key.txt file.txt.age > file.txt

# Passphrase
age -p file.txt > file.txt.age
age -d file.txt.age > file.txt
```

## Post-Quantum Cryptography

### NIST PQC Standards (2024)
| Algorithm | Type | Purpose |
|-----------|------|---------|
| **CRYSTALS-Kyber** | KEM | Key encapsulation |
| **CRYSTALS-Dilithium** | Signature | Digital signatures |
| **FALCON** | Signature | Digital signatures |
| **SPHINCS+** | Signature | Hash-based signatures |

### Hybrid Approach (Recommended)
```python
# Classical + Post-Quantum
# X25519 + Kyber768 for key exchange
# Ed25519 + Dilithium3 for signatures
```

## Common Vulnerabilities

### Implementation Issues
1. **ECB Mode** - Patterns visible
2. **Static IV** - Reused nonces break GCM/CTR
3. **No Authentication** - CBC without MAC
4. **Timing Attacks** - Non-constant-time comparison
5. **Padding Oracles** - CBC padding errors leak info
6. **Weak RNG** - Predictable keys/nonces
7. **Key Reuse** - Same key for different purposes

### Protocol Issues
1. **Downgrade Attacks** - Force weak ciphers
2. **Replay Attacks** - No nonce/timestamp
3. **MITM** - No certificate validation
4. **Bleichenbacher** - RSA PKCS#1 v1.5 padding oracle

## Best Practices

### Do
- Use authenticated encryption (AES-GCM, ChaCha20-Poly1305)
- Use high-level libraries (libsodium, cryptography.io)
- Generate keys with CSPRNG
- Use proper key derivation (Argon2, PBKDF2)
- Rotate keys periodically
- Implement constant-time comparisons
- Validate certificates properly

### Don't
- Roll your own crypto
- Use ECB mode
- Reuse nonces/IVs
- Use MD5/SHA1
- Use RSA < 2048 bits
- Hardcode keys
- Skip authentication

## Resources
- [cryptography.io](https://cryptography.io/)
- [libsodium](https://libsodium.org/)
- [NIST Cryptographic Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Real World Crypto](https://www.realworldcrypto.com/)
- [Crypto 101](https://www.crypto101.io/)