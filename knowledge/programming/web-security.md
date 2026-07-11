# Web Security (OWASP Top 10 + Beyond)

## OWASP Top 10 2021

### A01: Broken Access Control
```python
# Bad: No authorization check
@app.route('/api/users/<user_id>/orders')
def get_orders(user_id):
    return db.query('SELECT * FROM orders WHERE user_id = ?', user_id)

# Good: Authorization enforced
@app.route('/api/users/<user_id>/orders')
@login_required
def get_orders(user_id):
    if current_user.id != user_id and not current_user.is_admin:
        abort(403)
    return db.query('SELECT * FROM orders WHERE user_id = ?', user_id)

# RBAC implementation
def require_role(*roles):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if current_user.role not in roles:
                abort(403)
            return f(*args, **kwargs)
        return wrapped
    return decorator

@app.route('/admin/users')
@require_role('admin')
def admin_users():
    ...
```

### A02: Cryptographic Failures
```python
# Bad: Weak crypto
password_hash = hashlib.md5(password.encode()).hexdigest()
# Or: plain text storage

# Good: Strong hashing
import bcrypt
password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))
# Verify
bcrypt.checkpw(password.encode(), stored_hash)

# Or argon2 (modern)
import argon2
ph = argon2.PasswordHasher()
hash = ph.hash(password)
ph.verify(hash, password)

# Encryption for sensitive data
from cryptography.fernet import Fernet
key = Fernet.generate_key()
cipher = Fernet(key)
encrypted = cipher.encrypt(b"SSN: 123-45-6789")
decrypted = cipher.decrypt(encrypted)
```

### A03: Injection

#### SQL Injection
```python
# Bad: String concatenation
query = f"SELECT * FROM users WHERE email = '{email}'"

# Good: Parameterized queries
# SQLite
cursor.execute("SELECT * FROM users WHERE email = ?", (email,))

# PostgreSQL (psycopg2)
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))

# MySQL (mysql-connector)
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))

# SQLAlchemy ORM
user = session.query(User).filter_by(email=email).first()

# Raw SQL with SQLAlchemy
result = session.execute(text("SELECT * FROM users WHERE email = :email"), 
                        {"email": email})
```

#### NoSQL Injection (MongoDB)
```python
# Bad: Direct object
db.users.find({"email": email, "password": password})

# Good: Explicit operators
db.users.find({"email": email, "password": {"$eq": password}})

# Or use ODM (Mongoose)
User.findOne({ email: email }).select('+password')
```

#### Command Injection
```python
# Bad: Shell injection
os.system(f"ping -c 4 {host}")
subprocess.run(f"ping -c 4 {host}", shell=True)

# Good: No shell, args list
subprocess.run(["ping", "-c", "4", host], capture_output=True)

# Or use libraries
import ping3
ping3.ping(host)
```

#### LDAP Injection
```python
# Bad
filter = f"(uid={username})"

# Good: Escape
import ldap3
from ldap3.utils.conv import escape_filter_chars
filter = f"(uid={escape_filter_chars(username)})"
```

### A04: Insecure Design
```python
# Design security from start
# Threat modeling: STRIDE
# Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege

# Secure design patterns:
# - Principle of least privilege
# - Defense in depth
# - Fail securely
# - Secure defaults
# - Economy of mechanism
# - Complete mediation
# - Open design
# - Separation of privilege
# - Least common mechanism
# - Psychological acceptability
```

### A05: Security Misconfiguration
```nginx
# Secure headers
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.example.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://api.example.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self';";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";

# Hide version
server_tokens off;

# Secure cookies
# Set-Cookie: session=abc; HttpOnly; Secure; SameSite=Strict
```

```python
# Flask/Django secure config
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=timedelta(hours=1),
    WTF_CSRF_ENABLED=True,
    WTF_CSRF_TIME_LIMIT=None,
)

# Security headers via Flask-Talisman
from flask_talisman import Talisman
Talisman(app, 
    force_https=True,
    strict_transport_security=True,
    session_cookie_secure=True,
    content_security_policy={
        'default-src': "'self'",
        'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.example.com'],
        'style-src': ["'self'", "'unsafe-inline'"],
    }
)
```

### A06: Vulnerable Components
```bash
# Dependency scanning
# npm
npm audit
npm audit fix

# Python
pip-audit
safety check

# Go
govulncheck ./...

# Java
mvn org.owasp:dependency-check-maven:check

# Docker
docker scan myimage
trivy image myimage

# CI integration
# GitHub Actions: github/codeql-action
# GitLab: dependency_scanning
```

### A07: Authentication Failures
```python
# Strong password policy
import zxcvbn
def validate_password(password):
    result = zxcvbn.zxcvbn(password)
    if result['score'] < 3:
        raise ValueError("Password too weak")
    if len(password) < 12:
        raise ValueError("Password too short")

# Rate limiting
from flask_limiter import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    ...

# Multi-factor authentication
import pyotp
# Setup
totp = pyotp.TOTP(pyotp.random_base32())
qr = totp.provisioning_uri(user.email, issuer_name="MyApp")
# Verify
if totp.verify(token):
    login_user(user)

# Account lockout
FAILED_ATTEMPTS = 5
LOCKOUT_TIME = 300  # 5 minutes

def check_lockout(ip):
    key = f"login_failures:{ip}"
    count = redis.get(key)
    if count and int(count) >= FAILED_ATTEMPTS:
        return True
    return False

def record_failure(ip):
    key = f"login_failures:{ip}"
    redis.incr(key)
    redis.expire(key, LOCKOUT_TIME)

def clear_failures(ip):
    redis.delete(f"login_failures:{ip}")
```

### A08: Software & Data Integrity Failures
```python
# Subresource Integrity (SRI)
# <script src="https://cdn.example.com/app.js" 
#         integrity="sha384-..." crossorigin="anonymous"></script>

# Generate SRI
import hashlib, base64
def generate_sri(filepath):
    with open(filepath, 'rb') as f:
        content = f.read()
    hash = hashlib.sha384(content).digest()
    return f"sha384-{base64.b64encode(hash).decode()}"

# CI/CD integrity
# - Sign commits (GPG)
# - Verify signatures
# - SBOM (Software Bill of Materials)
# - Reproducible builds

# Supply chain
# - Pin dependencies (package-lock.json, Pipfile.lock)
# - Use private registries
# - Scan for malicious packages
# - Dependency confusion prevention
```

### A09: Logging & Monitoring Failures
```python
# Structured logging
import structlog
logger = structlog.get_logger()

logger.info("user_login", 
    user_id=user.id, 
    ip=request.remote_addr,
    user_agent=request.user_agent.string,
    success=True
)

logger.warning("failed_login",
    email=email,
    ip=request.remote_addr,
    reason="invalid_password",
    attempt_count=attempts
)

# Security events to monitor
SECURITY_EVENTS = [
    'failed_login',
    'password_change',
    'email_change',
    'permission_change',
    'admin_action',
    'data_export',
    'bulk_delete',
    'privilege_escalation',
    'unauthorized_access',
    'sql_injection_attempt',
    'xss_attempt',
    'csrf_failure',
]

# Alerting rules (Prometheus/Grafana)
# - Failed logins > 10/min from same IP
- 404 errors > 100/min (scanning)
- 5xx errors > 1% (attack causing errors)
- New admin user created
- Password reset requested
- Unusual data access patterns
```

### A10: Server-Side Request Forgery (SSRF)
```python
# Bad: User-controlled URL
@app.route('/fetch')
def fetch():
    url = request.args.get('url')
    response = requests.get(url)  # SSRF!
    return response.text

# Good: Validate URL
def fetch_url(url):
    parsed = urlparse(url)
    
    # Block private/internal networks
    blocked = [
        'localhost', '127.0.0.1', '::1',
        '10.', '172.16.', '172.17.', '172.18.', '172.19.',
        '172.20.', '172.21.', '172.22.', '172.23.',
        '172.24.', '172.25.', '172.26.', '172.27.',
        '172.28.', '172.29.', '172.30.', '172.31.',
        '192.168.', '169.254.', '::ffff:'
    ]
    
    for block in blocked:
        if parsed.hostname.startswith(block):
            raise ValueError("Blocked URL")
    
    # Allow only HTTP/HTTPS
    if parsed.scheme not in ('http', 'https'):
        raise ValueError("Invalid scheme")
    
    # Use allowlist for domains
    allowed_domains = ['api.github.com', 'api.twitter.com']
    if parsed.hostname not in allowed_domains:
        raise ValueError("Domain not allowed")
    
    return requests.get(url, timeout=5)
```

## Additional Critical Vulnerabilities

### Cross-Site Scripting (XSS)

#### Reflected XSS
```python
# Bad: Direct output
@app.route('/search')
def search():
    q = request.args.get('q', '')
    return f"<h1>Results for: {q}</h1>"

# Good: Template engine auto-escapes
@app.route('/search')
def search():
    q = request.args.get('q', '')
    return render_template('search.html', query=q)

# search.html
# <h1>Results for: {{ query }}</h1>  # Auto-escaped
```

#### Stored XSS
```python
# Bad: Raw HTML storage
@app.route('/comment', methods=['POST'])
def add_comment():
    comment = Comment(content=request.form['content'])
    db.save(comment)

# Good: Sanitize on input AND output
import bleach

ALLOWED_TAGS = ['b', 'i', 'u', 'em', 'strong', 'a', 'p', 'br']
ALLOWED_ATTRS = {'a': ['href', 'title']}

def sanitize_html(html):
    return bleach.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS)

@app.route('/comment', methods=['POST'])
def add_comment():
    clean_content = sanitize_html(request.form['content'])
    comment = Comment(content=clean_content)
    db.save(comment)

# Also escape on output (defense in depth)
# {{ comment.content | safe }}  # Only if already sanitized
```

#### DOM-based XSS
```javascript
// Bad: Using innerHTML with user data
document.getElementById('output').innerHTML = location.hash.substring(1);

// Good: textContent
document.getElementById('output').textContent = location.hash.substring(1);

// Or DOMPurify
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

### Cross-Site Request Forgery (CSRF)
```python
# Flask-WTF CSRF protection
from flask_wtf.csrf import CSRFProtect
csrf = CSRFProtect(app)

# Templates
<form method="POST">
    {{ csrf_token() }}
    <!-- form fields -->
</form>

# AJAX
$.ajaxSetup({
    beforeSend: function(xhr) {
        xhr.setRequestHeader('X-CSRFToken', '{{ csrf_token() }}');
    }
});

# Exempt API endpoints (use token auth instead)
@csrf.exempt
@app.route('/api/webhook', methods=['POST'])
def webhook():
    ...

# SameSite cookie (modern CSRF protection)
app.config.update(
    SESSION_COOKIE_SAMESITE='Lax',  # or 'Strict'
    SESSION_COOKIE_SECURE=True,
)
```

### Insecure Deserialization
```python
# Bad: pickle (arbitrary code execution)
import pickle
data = pickle.loads(user_supplied_data)

# Good: JSON only
import json
data = json.loads(user_supplied_data)

# If complex objects needed: safe serialization
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
s = Serializer(secret_key, expires_in=3600)
token = s.dumps({'user_id': 123})
data = s.loads(token)  # Verifies signature

# Or marshmallow for validation
from marshmallow import Schema, fields, validate

class UserSchema(Schema):
    id = fields.Int(required=True)
    email = fields.Email(required=True)
    name = fields.Str(validate=validate.Length(min=1, max=100))

schema = UserSchema()
user_data = schema.load(json_data)  # Validates!
```

### XXE (XML External Entity)
```python
# Bad: Vulnerable to XXE
import xml.etree.ElementTree as ET
root = ET.fromstring(xml_data)  # Processes external entities!

# Good: Disable external entities
parser = ET.XMLParser()
parser.parser.UseForeignDTD(False)
parser.parser.SetParamEntityParsing(0)  # XML_PARAM_ENTITY_PARSING_NEVER
root = ET.fromstring(xml_data, parser=parser)

# Or use defusedxml
from defusedxml import ElementTree as ET
root = ET.fromstring(xml_data)  # Safe by default
```

### Path Traversal
```python
# Bad: No validation
@app.route('/download/<filename>')
def download(filename):
    return send_file(f"/uploads/{filename}")

# Good: Secure filename handling
import os
from werkzeug.utils import secure_filename

@app.route('/download/<filename>')
def download(filename):
    # Secure the filename
    safe_name = secure_filename(filename)
    
    # Validate path stays in upload directory
    upload_dir = os.path.abspath("/uploads")
    requested_path = os.path.abspath(os.path.join(upload_dir, safe_name))
    
    if not requested_path.startswith(upload_dir):
        abort(403)
    
    if not os.path.exists(requested_path):
        abort(404)
    
    return send_file(requested_path)
```

## Security Headers Reference

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Force HTTPS |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'...` | Prevent XSS |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer |
| `Permissions-Policy` | `geolocation=(), microphone=()` | Feature policy |
| `Cross-Origin-Embedder-Policy` | `require-corp` | COEP |
| `Cross-Origin-Opener-Policy` | `same-origin` | COOP |
| `Cross-Origin-Resource-Policy` | `same-origin` | CORP |

## Content Security Policy Generator

```python
# Build CSP programmatically
CSP_DEFAULTS = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https:', 'data:'],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'self'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
}

def build_csp(overrides=None):
    csp = CSP_DEFAULTS.copy()
    if overrides:
        for k, v in overrides.items():
            csp[k] = v
    return '; '.join(f"{k} {' '.join(v)}" for k, v in csp.items())

# Usage
csp = build_csp({
    'script-src': ["'self'", 'https://cdn.example.com'],
    'connect-src': ["'self'", 'https://api.example.com', 'wss://ws.example.com'],
})
```

## Security Testing Tools

| Category | Tools |
|----------|-------|
| **SAST** | SonarQube, CodeQL, Semgrep, Bandit (Python), ESLint security plugins |
| **DAST** | OWASP ZAP, Burp Suite, Nikto, w3af |
| **IAST** | Contrast Security, Seeker |
| **SCA** | Dependabot, Snyk, WhiteSource, OWASP Dependency Check |
| **Secrets** | TruffleHog, GitLeaks, detect-secrets |
| **Container** | Trivy, Clair, Anchore, Docker Scout |
| **Infrastructure** | Checkov, tfsec, kics, OPA |

## Security Checklist for Releases

- [ ] Dependency scan passes
- [ ] SAST scan passes
- [ ] DAST scan on staging
- [ ] Penetration test (annual)
- [ ] Secrets scan clean
- [ ] CSP implemented and tested
- [ ] Security headers present
- [ ] HTTPS enforced everywhere
- [ ] Cookies secure (HttpOnly, Secure, SameSite)
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all endpoints
- [ ] Output encoding on all templates
- [ ] Authentication tested (MFA, lockout, reset)
- [ ] Authorization tested (RBAC, ABAC)
- [ ] Error handling doesn't leak info
- [ ] Logging captures security events
- [ ] Monitoring alerts configured
- [ ] Incident response plan tested
- [ ] Backup/restore tested
- [ ] Third-party components assessed