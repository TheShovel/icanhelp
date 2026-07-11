# SSL/TLS & PKI

## Certificate Types

| Type | Use Case | Validation |
|------|----------|------------|
| **DV** (Domain Validated) | Basic HTTPS | Email/DNS control |
| **OV** (Organization Validated) | Business sites | Org identity + domain |
| **EV** (Extended Validation) | High-trust (banks) | Rigorous legal checks |
| **Wildcard** | `*.example.com` | Single domain + subdomains |
| **SAN** (Multi-domain) | Multiple domains | List of domains in cert |
| **Self-signed** | Internal/testing | No CA validation |
| **Client cert** | mTLS, auth | Client authentication |

## Key Generation

```bash
# RSA (2048 min, 4096 recommended)
openssl genrsa -out private.key 4096

# ECDSA (P-256, P-384, P-521)
openssl ecparam -genkey -name prime256v1 -out private.key
openssl ecparam -genkey -name secp384r1 -out private.key

# Ed25519 (modern, fast, small)
openssl genpkey -algorithm ed25519 -out private.key

# View key
openssl rsa -in private.key -text -noout
openssl ec -in private.key -text -noout
openssl pkey -in private.key -text -noout
```

## CSR (Certificate Signing Request)

```bash
# Generate CSR
openssl req -new -key private.key -out request.csr \
  -subj "/C=US/ST=CA/L=San Francisco/O=MyOrg/OU=IT/CN=example.com"

# With SAN (Subject Alternative Names)
cat > san.cnf <<EOF
[req]
distinguished_name = dn
req_extensions = ext
prompt = no

[dn]
C = US
ST = CA
L = San Francisco
O = MyOrg
OU = IT
CN = example.com

[ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = example.com
DNS.2 = www.example.com
DNS.3 = api.example.com
DNS.4 = *.example.com
EOF

openssl req -new -key private.key -out request.csr -config san.cnf

# View CSR
openssl req -in request.csr -text -noout
```

## Self-Signed Certificates

```bash
# Quick self-signed (valid 365 days)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem \
  -days 365 -nodes -subj "/CN=localhost"

# With SAN
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem \
  -days 365 -nodes -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"

# PKCS#12 (for Java/Windows)
openssl pkcs12 -export -out cert.p12 -inkey key.pem -in cert.pem \
  -name "mycert" -passout pass:password
```

## CA (Certificate Authority)

### Root CA

```bash
# Generate root CA key
openssl genrsa -out ca.key 4096

# Create root CA cert (10 years)
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -out ca.pem -subj "/C=US/O=MyOrg/CN=MyOrg Root CA"

# Verify
openssl x509 -in ca.pem -text -noout
```

### Intermediate CA

```bash
# Generate intermediate key
openssl genrsa -out intermediate.key 4096

# Create CSR for intermediate
openssl req -new -key intermediate.key -out intermediate.csr \
  -subj "/C=US/O=MyOrg/CN=MyOrg Intermediate CA"

# Sign with root CA
openssl x509 -req -in intermediate.csr -CA ca.pem -CAkey ca.key \
  -CAcreateserial -out intermediate.pem -days 1825 -sha256 \
  -extfile <(echo -e "basicConstraints=critical,CA:true\nkeyUsage=critical,keyCertSign,cRLSign")

# Create chain
cat intermediate.pem ca.pem > chain.pem
```

### Issue Certificates

```bash
# Sign server certificate
openssl x509 -req -in server.csr -CA intermediate.pem -CAkey intermediate.key \
  -CAcreateserial -out server.crt -days 365 -sha256 \
  -extfile <(echo -e "basicConstraints=CA:false\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=DNS:example.com,DNS:www.example.com")

# Sign client certificate
openssl x509 -req -in client.csr -CA intermediate.pem -CAkey intermediate.key \
  -CAcreateserial -out client.crt -days 365 -sha256 \
  -extfile <(echo -e "basicConstraints=CA:false\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=clientAuth")
```

## Certificate Verification

```bash
# Verify cert chain
openssl verify -CAfile ca.pem server.crt

# Verify with chain
openssl verify -CAfile chain.pem server.crt

# Check cert details
openssl x509 -in server.crt -text -noout

# Check expiration
openssl x509 -in server.crt -noout -enddate

# Check SAN
openssl x509 -in server.crt -noout -ext subjectAltName

# Check specific host
openssl s_client -connect example.com:443 -servername example.com < /dev/null
openssl s_client -connect example.com:443 -servername example.com -CAfile ca.pem < /dev/null

# Full handshake debug
openssl s_client -connect example.com:443 -debug -msg < /dev/null
```

## Certificate Formats

| Format | Extension | Encoding | Use Case |
|--------|-----------|----------|----------|
| **PEM** | `.pem`, `.crt`, `.cer` | Base64 | Apache, Nginx, most Linux |
| **DER** | `.der`, `.cer` | Binary | Java, Windows |
| **PKCS#7** | `.p7b`, `.p7c` | Base64 | Windows, Java (chain) |
| **PKCS#12** | `.p12`, `.pfx` | Binary + encrypted | Windows, Java, IIS (key+cert) |

```bash
# Convert PEM to DER
openssl x509 -in cert.pem -outform der -out cert.der

# Convert DER to PEM
openssl x509 -in cert.der -inform der -out cert.pem

# PEM to PKCS#12
openssl pkcs12 -export -out cert.p12 -inkey key.pem -in cert.pem -certfile chain.pem

# PKCS#12 to PEM
openssl pkcs12 -in cert.p12 -out cert.pem -nodes
openssl pkcs12 -in cert.p12 -out key.pem -nodes -nocerts
```

## TLS Configuration

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/nginx/certs/example.com.pem;
    ssl_certificate_key /etc/nginx/certs/example.com.key;
    ssl_trusted_certificate /etc/nginx/certs/chain.pem;

    # TLS 1.2 + 1.3 only
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Modern cipher suites
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;

    # Session resumption
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;

    # mTLS (optional)
    # ssl_client_certificate /etc/nginx/certs/ca.pem;
    # ssl_verify_client optional;
}
```

### Apache

```apache
<VirtualHost *:443>
    ServerName example.com
    
    SSLEngine on
    SSLCertificateFile /etc/apache2/certs/example.com.pem
    SSLCertificateKeyFile /etc/apache2/certs/example.com.key
    SSLCertificateChainFile /etc/apache2/certs/chain.pem
    
    # Modern config
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305
    SSLHonorCipherOrder off
    
    # Session
    SSLSessionCache shmcb:/var/cache/apache2/ssl_scache(512000)
    SSLSessionCacheTimeout 300
    
    # OCSP
    SSLUseStapling on
    SSLStaplingCache shmcb:/var/cache/apache2/ssl_stapling(32768)
    
    # Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
</VirtualHost>
```

### HAProxy

```haproxy
frontend https_in
    bind *:443 ssl crt /etc/haproxy/certs/ alpn h2,http/1.1
    bind *:443 ssl crt /etc/haproxy/certs/ alpn h2,http/1.1 ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305
    
    ssl-min-ver TLSv1.2
    ssl-max-ver TLSv1.3
    tune.ssl.default-dh-param 2048
    
    # OCSP
    ssl-load-extra-files-from /etc/haproxy/certs/
    
    # HSTS
    http-response set-header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
```

## mTLS (Mutual TLS)

```bash
# Generate client cert
openssl req -newkey rsa:4096 -keyout client.key -out client.csr -nodes -subj "/CN=client"
openssl x509 -req -in client.csr -CA ca.pem -CAkey ca.key -CAcreateserial -out client.crt -days 365 -sha256

# Create client PKCS#12 (for browsers)
openssl pkcs12 -export -out client.p12 -inkey client.key -in client.crt -certfile ca.pem

# Test with curl
curl --cert client.crt --key client.key --cacert ca.pem https://example.com

# Test with openssl
openssl s_client -connect example.com:443 -cert client.crt -key client.key -CAfile ca.pem
```

### Nginx mTLS

```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/certs/server.pem;
    ssl_certificate_key /etc/nginx/certs/server.key;
    
    # Client CA
    ssl_client_certificate /etc/nginx/certs/ca.pem;
    ssl_verify_client on;
    ssl_verify_depth 2;
    
    # Pass client cert info to backend
    proxy_set_header X-Client-Cert $ssl_client_cert;
    proxy_set_header X-Client-Cert-DN $ssl_client_s_dn;
    proxy_set_header X-Client-Verify $ssl_client_verify;
}
```

## Certificate Management

### Let's Encrypt (ACME)

```bash
# certbot (nginx)
certbot --nginx -d example.com -d www.example.com

# certbot (standalone)
certbot certonly --standalone -d example.com -d www.example.com

# certbot (dns challenge for wildcard)
certbot certonly --manual --preferred-challenges dns -d example.com -d *.example.com

# Auto-renewal (cron/systemd timer)
certbot renew --quiet

# certbot with nginx reload hook
certbot renew --deploy-hook "systemctl reload nginx"
```

```bash
# acme.sh (lightweight, no dependencies)
curl https://get.acme.sh | sh
acme.sh --issue -d example.com -d www.example.com --nginx
acme.sh --install-cert -d example.com \
  --key-file /etc/nginx/certs/example.com.key \
  --fullchain-file /etc/nginx/certs/example.com.crt \
  --reloadcmd "systemctl reload nginx"
```

### Step-CA (Internal PKI)

```bash
# Install
curl -sSL https://dl.step.sm/gh/install.sh | bash

# Initialize
step ca init --name "MyOrg CA" --dns "ca.example.com" --address ":443" --provisioner "admin"

# Generate cert
step ca certificate example.com cert.pem key.pem --profile leaf --not-after 24h

# Renew
step ca renew cert.pem key.pem --force

# Provisioner (ACME)
step ca provisioner add acme --type ACME
```

### cert-manager (Kubernetes)

```yaml
# ClusterIssuer
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
    - http01:
        ingress:
          class: nginx

---
# Certificate
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: example-com
  namespace: production
spec:
  secretName: example-com-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - example.com
  - www.example.com
  duration: 2160h # 90 days
  renewBefore: 360h # 15 days
```

## Security Best Practices

### Key Management

```bash
# Protect private keys
chmod 600 private.key
chown root:root private.key

# Use HSM/KMS for production
# AWS KMS, Azure Key Vault, GCP KMS, HashiCorp Vault

# Key rotation
# Rotate annually or per compliance
# Automate with cert-manager, step-ca, or custom scripts
```

### Certificate Transparency

```bash
# Check CT logs
curl -s "https://crt.sh/?q=example.com&output=json" | jq '.[].name_value'

# Monitor with certspotter
curl -s "https://api.certspotter.com/v1/issuances?domain=example.com&include_subdomains=true&expand=details"
```

### Revocation

```bash
# CRL (Certificate Revocation List)
openssl ca -gencrl -out crl.pem -keyfile ca.key -cert ca.pem

# OCSP (Online Certificate Status Protocol)
openssl ocsp -index index.txt -CA ca.pem -rkey ca.key -rsigner ca.pem -port 8888

# Check revocation
openssl verify -crl_check -CRLfile crl.pem server.crt
openssl ocsp -issuer ca.pem -cert server.crt -url http://ocsp.example.com:8888
```

## Testing Tools

```bash
# testssl.sh (comprehensive)
git clone https://github.com/drwetter/testssl.sh
./testssl.sh example.com

# SSLyze (fast scanner)
pip install sslyze
sslyze --regular example.com

# nmap SSL scripts
nmap --script ssl-enum-ciphers,ssl-cert,ssl-dh-params -p 443 example.com

# openssl cipher test
openssl ciphers -v 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256'

# Qualys SSL Labs (web)
# https://www.ssllabs.com/ssltest/
```

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `certificate verify failed` | Missing CA, wrong chain | Provide full chain, update CA store |
| `certificate has expired` | Past notAfter date | Renew certificate |
| `hostname mismatch` | CN/SAN doesn't match | Add hostname to SAN |
| `self signed certificate` | Not trusted by system | Add to trust store, use real CA |
| `unable to get local issuer certificate` | Missing intermediate | Include full chain |
| `certificate signature failure` | Corrupt cert, wrong key | Re-issue certificate |
| `no suitable key exchange` | Weak DH params, no ECDHE | Generate 2048+ DH params, enable ECDHE |

## Quick Reference

```bash
# Check cert expiry
openssl x509 -in cert.pem -noout -enddate

# Days until expiry
openssl x509 -in cert.pem -noout -checkend 2592000 && echo "Valid >30 days" || echo "Expiring soon"

# Verify private key matches cert
openssl x509 -noout -modulus -in cert.pem | openssl md5
openssl rsa -noout -modulus -in key.pem | openssl md5

# Create self-signed for localhost with IP SAN
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"

# View all certs in chain
openssl crl2pkcs7 -nocrl -certfile chain.pem | openssl pkcs7 -print_certs -text -noout
```