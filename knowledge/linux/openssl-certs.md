# OpenSSL Certificates and PKI Management

## Certificate Generation

### Self-Signed Certificates
```bash
# Generate private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/server.key \
  -out /etc/ssl/certs/server.crt \
  -subj "/C=US/ST=State/L=City/O=Org/CN=example.com"

# With config file
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key -out server.crt \
  -config openssl.cnf
```

### Certificate Request (CSR)
```bash
# Create CSR for CA signing
openssl req -new -newkey rsa:2048 -nodes \
  -keyout server.key -out server.csr \
  -subj "/C=US/ST=State/O=Org/CN=example.com"

# View CSR
openssl req -in server.csr -noout -text

# Verify CSR signing
openssl req -in server.csr -noout -verify
```

### Private Key Operations
```bash
# Generate key only
openssl genrsa -out private.key 2048
openssl genpkey -algorithm RSA -out private.key -pkeyopt rsa_keygen_bits:2048

# Encrypted key
openssl rsa -in private.key -aes256 -out encrypted.key

# Remove password
openssl rsa -in encrypted.key -out private.key

# View key
openssl rsa -in private.key -check -noout -text
```

## Certificate Formats

### PEM Format
- Base64 encoded
- `-----BEGIN CERTIFICATE-----`
- Default for OpenSSL
- Used in Apache, Nginx

### DER Format
- Binary
- Use for Windows
- Convert with:
```bash
# PEM to DER
openssl x509 -in cert.pem -outform der -out cert.der

# DER to PEM
openssl x509 -inform der -in cert.der -out cert.pem
```

### PKCS#12 (PFX)
- Bundle certificate + key + CA chain
- Use for Windows/IIS
- Password protected
```bash
# Create PFX
openssl pkcs12 -export -out cert.pfx \
  -inkey private.key -in cert.pem -certfile ca.pem \
  -passout pass:

# Extract from PFX
openssl pkcs12 -in cert.pfx -out pem.pem -nodes
```

## CA Management

### Create CA
```bash
# Directory structure
mkdir -p ca/{certs,crl,newcerts,private}
chmod 700 ca/private
touch ca/index.txt
echo 1000 > ca/serial

# openssl.cnf
# dir = /path/to/ca
# database = $dir/index.txt
# serial = $dir/serial
```

### openssl.cnf Template
```ini
[ ca ]
default_ca = CA_default

[ CA_default ]
dir = /etc/ssl/ca
database = $dir/index.txt
new_certs_dir = $dir/newcerts
certificate = $dir/cacert.pem
serial = $dir/serial
private_key = $dir/private/cakey.pem
RANDFILE = $dir/private/.rand
default_days = 365
default_crl_days = 30
default_md = sha256
policy = policy_any
copy_extensions = copy
```

### Sign Certificate
```bash
# Sign CSR
openssl ca -config openssl.cnf -in server.csr -out server.crt

# Sign with specific extensions
openssl ca -config openssl.cnf -in server.csr -out server.crt \
  -extfile v3_ext.cnf

# Revoke certificate
openssl ca -config openssl.cnf -revoke server.crt

# Generate CRL
openssl ca -config openssl.cnf -gencrl -out ca.crl
```

## Certificate Extensions

### SAN (Subject Alternative Names)
```bash
# v3_ext.cnf
[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = example.com
DNS.2 = www.example.com
DNS.3 = api.example.com
IP.1 = 192.168.1.100
IP.2 = 10.0.0.1
```

### Key Usage Extensions
```
[ server_ext ]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
```

## Certificate Chain

### Combine Certificates
```bash
# Server + Intermediate + Root
cat server.crt intermediate.crt root.crt > fullchain.crt

# Verify chain
openssl verify -CAfile root.crt fullchain.crt
```

### Check Certificate Chain
```bash
# Show certificate chain
openssl s_client -connect example.com:443 -showcerts

# Trace chain locally
cat server.crt intermediate.crt root.crt > chain.pem
openssl verify -CAfile chain.pem server.crt
```

## Certificate Information

### View Certificate
```bash
# PEM certificate
openssl x509 -in cert.pem -noout -text

# Remote certificate
openssl s_client -connect example.com:443 </dev/null 2>/dev/null | openssl x509 -noout -text

# Key details only
openssl x509 -in cert.pem -noout -subject -issuer -dates -serial
```

### Certificate Dates
```bash
# Valid dates
openssl x509 -in cert.pem -noout -dates

# Check expiration
openssl x509 -in cert.pem -noout -checkend 86400
# Returns 0 if valid for 1 more day
```

### Certificate Fingerprint
```bash
# SHA256 fingerprint
openssl x509 -in cert.pem -noout -fingerprint -sha256

# SHA1 fingerprint
openssl x509 -in cert.pem -noout -fingerprint -sha1
```

## Key Extraction

### Extract Public Key
```bash
# From certificate
openssl x509 -in cert.pem -noout -pubkey > pubkey.pem

# From private key
openssl rsa -in private.key -pubout > pubkey.pem

# Compare
diff <(openssl rsa -pubin -in pubkey.pem -modulus) \
     <(openssl x509 -in cert.pem -modulus)
```

### Extract Components
```bash
# Modulus (for comparison)
openssl rsa -in private.key -modulus -noout

# Private key components
openssl rsa -in private.key -out private.der -outform der
openssl rsa -inform der -in private.der -text -noout
```

## TLS Testing

### Test TLS Connection
```bash
# Simple test
openssl s_client -connect example.com:443

# With SNI
openssl s_client -connect example.com:443 -servername example.com

# Show certificates
openssl s_client -connect example.com:443 -showcerts

# Specific protocol
openssl s_client -connect example.com:443 -tls1_2
```

### TLS Options
```bash
# Client certificate
openssl s_client -connect server:443 -cert client.crt -key client.key

# CA certificate
openssl s_client -connect server:443 -CAfile ca.crt

# Cipher suite
openssl s_client -connect server:443 -cipher HIGH
```

## Certificate Verification

### OCSP (Online Certificate Status)
```bash
# Check OCSP
openssl ocsp -issuer ca.crt -cert server.crt -text -url http://ocsp.example.com

# OCSP with nonce
openssl ocsp -issuer ca.crt -cert server.crt -nonce -text -url http://ocsp.example.com
```

### CRL Verification
```bash
# Verify with CRL
openssl verify -CAfile ca.crt -CRLFile ca.crl -crl_check server.crt

# Check revoked
openssl crl -in ca.crl -noout -text
```

## Certificate Management

### ACME/Let's Encrypt
```bash
# certbot
certbot --standalone -d example.com -d www.example.com

# Manual with CSR
certbot --csr server.csr --manual --preferred-challenges dns

# Renewal hook
certbot renew --deploy-hook "systemctl reload nginx"
```

### acme.sh
```bash
# Install acme.sh
curl https://get.acme.sh | sh

# Issue certificate
~/.acme.sh/acme.sh --issue -d example.com --standalone

# Install certificate
~/.acme.sh/acme.sh --install-cert -d example.com \
  --key-file /etc/ssl/private/server.key \
  --fullchain-file /etc/ssl/certs/server.crt
```

## Certificate Conversion

### Convert Formats
```bash
# PEM to PFX
openssl pkcs12 -export -out cert.pfx \
  -inkey private.key -in cert.pem -certfile ca.pem

# PFX to PEM
openssl pkcs12 -in cert.pfx -out cert.pem -nodes

# PEM to JKS (Java)
keytool -importkeystore -srckeystore cert.pfx \
  -srcstoretype pkcs12 -destkeystore keystore.jks \
  -deststoretype JKS
```

### Combine Operations
```bash
# Chain + key to PFX
cat server.crt intermediate.crt > chain.crt
openssl pkcs12 -export -out cert.pfx -inkey private.key -in chain.crt
```

## Security Best Practices

### Private Key Security
```bash
# Correct permissions
chmod 600 /etc/ssl/private/server.key
chmod 644 /etc/ssl/certs/server.crt

# Directory permissions
chmod 700 /etc/ssl/private/
chown root:root /etc/ssl/private/
```

### Key Strength
- RSA: 2048 bits minimum (4096 recommended)
- ECDSA: P-256 minimum (P-384 better)
- Ed25519: Modern alternative

### Generate ECDSA
```bash
# ECDSA key
openssl ecparam -name prime256v1 -genkey -noout -out ecdsa.key

# ECDSA certificate
openssl req -new -x509 -key ecdsa.key -out ecdsa.crt -days 365

# ECDSA CSR
openssl req -new -key ecdsa.key -out ecdsa.csr
```

### Certificate Transparency
```bash
# Submit to CT log
# Use certbot or acme.sh with --preferred-chain

# Check CT
openssl x509 -in cert.pem -text -noout | grep -i ct
```

## Automation Scripts

### Certificate Expiration Check
```bash
#!/bin/bash
# check-cert-expiry.sh
OPENSSL="/usr/bin/openssl"
DAYS=${1:-30}

for cert in /etc/ssl/certs/*.crt; do
    $OPENSSL x509 -in "$cert" -noout -checkend $((DAYS * 86400)) \
        || echo "Certificate $cert expires in less than $DAYS days"
done
```

### Certificate Info Script
```bash
#!/bin/bash
# cert-info.sh
cert=$1
echo "=== Certificate Info ==="
$OPENSSL x509 -in "$cert" -noout -subject -issuer -dates
echo ""
echo "=== SANs ==="
$OPENSSL x509 -in "$cert" -noout -ext subjectAltName
echo ""
echo "=== Signature ==="
$OPENSSL x509 -in "$cert" -noout -fingerprint -sha256
```

## Debugging

### Common Errors

#### Certificate Mismatch
```bash
# Verify key and cert match
openssl x509 -in cert.pem -noout -modulus > cert.mod
openssl rsa -in private.key -noout -modulus > key.mod
diff cert.mod key.mod
```

#### Expired Certificate
```bash
# Check dates
openssl x509 -in cert.pem -noout -dates

# Check notAfter
openssl x509 -in cert.pem -noout -enddate
```

#### Missing Intermediate
```bash
# Check chain
openssl verify -partial_chain -x509_issuer_cert intermediate.crt server.crt

# Add missing intermediate
cat server.crt intermediate.crt > fullchain.crt
```

## Certificate Bundle Management

### Mozilla Bundle
```bash
# Update trust store
# /usr/local/share/ca-certificates/
# Update with: update-ca-certificates

# Or use certifi/python
pip install certifi
python -c "import certifi; print(certifi.where())"
```

### Custom CA Bundle
```bash
# Add custom CA
cp my-ca.crt /usr/local/share/ca-certificates/
update-ca-certificates

# Remove CA
# Remove from /usr/local/share/ca-certificates/
update-ca-certificates --fresh
```

## OpenSSL Configuration

### Default Config
```
# /etc/ssl/openssl.cnf
[ req ]
default_bits = 2048
distinguished_name = req_distinguished_name
string_mask = utf8only

[ req_distinguished_name ]
countryName = Country Name (2 letter code)
stateOrProvinceName = State
localityName = Locality
0.organizationName = Organization
commonName = Common Name
```

### Custom Config
```bash
# Use custom config
openssl req -config my-openssl.cnf -newkey rsa:4096 -nodes -out req.csr

# Multi-domain SAN
openssl req -config openssl-san.cnf -newkey rsa:2048 -nodes -out req.csr
```