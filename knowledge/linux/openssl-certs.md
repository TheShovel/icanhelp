# OpenSSL Certificates & PKI

`openssl` is universal — use it directly (not wrapped by `sys`). All commands below are distro-independent.

## Generate a self-signed certificate
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key -out server.crt \
  -subj "/CN=example.com"
openssl x509 -in server.crt -noout -text      # verify it
```

## Certificate signing request (CSR)
```bash
openssl req -new -newkey rsa:2048 -nodes \
  -keyout server.key -out server.csr \
  -subj "/CN=example.com"
openssl req -in server.csr -noout -text      # inspect
```

## Private keys
```bash
openssl genrsa -out private.key 2048
openssl genpkey -algorithm RSA -out private.key -pkeyopt rsa_keygen_bits:2048
openssl rsa -in private.key -aes256 -out encrypted.key -passout pass:secret   # encrypt
openssl rsa -in encrypted.key -passin pass:secret -out private.key            # decrypt
openssl rsa -in private.key -check -noout -text
```

## ECDSA
```bash
openssl ecparam -name prime256v1 -genkey -noout -out ecdsa.key
openssl req -new -x509 -key ecdsa.key -out ecdsa.crt -days 365 -subj "/CN=example.com"
```

## Inspect certificates
```bash
openssl x509 -in cert.pem -noout -text
openssl x509 -in cert.pem -noout -subject -issuer -dates -serial
openssl x509 -in cert.pem -noout -fingerprint -sha256
openssl x509 -in cert.pem -noout -checkend 86400   # 0 if valid >1 day
```

## Verify & chains
```bash
openssl verify -CAfile ca.crt server.crt
cat server.crt intermediate.crt root.crt > fullchain.crt
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null | openssl x509 -noout -text
```

## Format conversion
```bash
openssl x509 -in cert.pem -outform der -out cert.der
openssl x509 -inform der -in cert.der -out cert.pem
openssl pkcs12 -export -out cert.pfx -inkey private.key -in cert.pem -passout pass:secret
openssl pkcs12 -in cert.pfx -out pem.pem -nodes -passin pass:secret
```

## Key/cert match check
```bash
openssl x509 -in cert.pem -noout -modulus > cert.mod
openssl rsa -in private.key -noout -modulus > key.mod
diff cert.mod key.mod     # identical => match
```

## TLS test
```bash
openssl s_client -connect example.com:443
openssl s_client -connect example.com:443 -tls1_2
```

## Quick encrypt (use -pbkdf2)
```bash
openssl enc -aes-256-cbc -pbkdf2 -salt -in file -out file.enc -pass pass:secret
openssl enc -d -aes-256-cbc -pbkdf2 -in file.enc -out file -pass pass:secret
```

## Permissions
```bash
chmod 600 server.key
chmod 644 server.crt
chmod 700 /etc/ssl/private
```
