# Web Application Security

## OWASP Top 10 (2021)
1. **Broken Access Control** — users access resources they shouldn't
2. **Cryptographic Failures** — weak encryption, exposed secrets
3. **Injection** — SQL, NoSQL, OS command, LDAP injection
4. **Insecure Design** — missing threat modeling, rate limiting
5. **Security Misconfiguration** — default creds, verbose errors, missing headers
6. **Vulnerable Components** — outdated libraries with known CVEs
7. **Auth Failures** — weak passwords, broken session management
8. **Data Integrity Failures** — software supply chain, unsigned updates
9. **Logging/Monitoring Failures** — can't detect breaches
10. **SSRF** — server-side request forgery

## SQL Injection Prevention
```python
# BAD — string concatenation
cursor.execute(f"SELECT * FROM users WHERE id = '{user_input}'")

# GOOD — parameterized query
cursor.execute("SELECT * FROM users WHERE id = %s", (user_input,))
```
- Use parameterized queries / prepared statements — always
- ORMs (SQLAlchemy, Prisma, Hibernate) prevent injection when used correctly
- Avoid raw `$where` in MongoDB, raw queries in any DB
- Least privilege: DB user should only have needed permissions

## XSS (Cross-Site Scripting)
- **Stored**: malicious script saved to DB, served to all visitors
- **Reflected**: script in URL/search param, reflected back immediately
- **DOM-based**: client-side JS modifies DOM unsafely
```javascript
// BAD — inserts raw HTML
document.getElementById('output').innerHTML = userInput;

// GOOD — never use innerHTML with user content
document.getElementById('output').textContent = userInput;
```
- **Sanitize output**: template engines auto-escape (React JSX, Jinja2, Handlebars)
- Content Security Policy (CSP) header as defense-in-depth
- `HttpOnly` cookies — prevent JS from reading session cookies
- Validate input on server too (client validation is cosmetic)

## CSRF (Cross-Site Request Forgery)
- Attacker tricks logged-in user into making unwanted requests
- **Prevention**:
  - CSRF tokens: random token per session/form, validated server-side
  - `SameSite=Strict` or `SameSite=Lax` cookie attribute
  - Custom request headers (API calls from JS can set headers)
  - Double-submit cookie pattern

## Authentication Best Practices
- Hash passwords: **bcrypt** (cost ≥ 12), **argon2**, or **scrypt** — never MD5/SHA1
- Rate limit login attempts (e.g., 5 tries/min per IP)
- MFA: TOTP (Google Authenticator), WebAuthn/passkeys > SMS codes
- Session management: rotate session ID on login, set expiry
- JWT: short expiry (15 min), store refresh tokens securely, `aud` + `iss` claims
- Never roll your own crypto or auth — use well-audited libraries

## API Security
- Rate limiting: 100 req/min per user, 10 req/min for sensitive endpoints
- Auth: OAuth 2.0 / OpenID Connect for third-party, API keys for service-to-service
- Input validation: validate all input types, lengths, ranges server-side
- CORS: don't use `Access-Control-Allow-Origin: *` for authenticated endpoints
- GraphQL: depth limiting, query cost analysis, pagination
- Versioning: `/v1/users`, `Accept: application/vnd.api+json;version=1`

## Security Headers
```
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=()
```

## Dependency Management
- Scan regularly: `npm audit`, `pip audit`, `mvn dependency-check`, `trivy`
- Dependabot / Renovate: auto-PR for vulnerable dependencies
- Pin versions in lockfiles (npm ci, pip freeze, Cargo.lock)
- Supply chain: sign commits, verify package checksums, use private registry for internal packages

## Secrets Management
- Never commit secrets to git; use `.gitignore` and pre-commit hooks
- Environment variables for config; secrets stored in vault (HashiCorp Vault, AWS Secrets Manager)
- Rotate keys/credentials regularly
- Scan repos for leaked secrets (git-secrets, truffleHog, GitHub secret scanning)

## Logging & Monitoring
- Log auth failures, access denied, input validation errors
- Never log passwords, tokens,信用卡 numbers (PCI DSS)
- Centralized logging: ELK (Elasticsearch, Logstash, Kibana), Loki, Datadog
- Alert on: repeated 403/401, unusual traffic spikes, known attack patterns
- Incident response plan: detect → contain → eradicate → recover → postmortem
