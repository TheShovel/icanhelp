# Web Development

## HTTP Methods
- `GET` — retrieve resource (idempotent, safe)
- `POST` — create resource (non-idempotent)
- `PUT` — replace resource entirely (idempotent)
- `PATCH` — partial update (non-idempotent)
- `DELETE` — remove resource (idempotent)
- `HEAD` — GET without body (headers only)
- `OPTIONS` — list allowed methods for endpoint

## HTTP Status Codes
- `200` OK — successful GET/PUT/PATCH
- `201` Created — successful POST
- `204` No Content — successful DELETE
- `301` Moved Permanently — redirect (SEO)
- `302` Found — temporary redirect
- `304` Not Modified — cached response (ETag/If-Modified-Since)
- `400` Bad Request — malformed client input
- `401` Unauthorized — authentication required
- `403` Forbidden — authenticated but not allowed
- `404` Not Found — resource doesn't exist
- `405` Method Not Allowed — wrong HTTP method
- `409` Conflict — state conflict (duplicate, stale version)
- `422` Unprocessable Entity — validation failure
- `429` Too Many Requests — rate limited
- `500` Internal Server Error — generic server error
- `502` Bad Gateway — upstream proxy/service down
- `503` Service Unavailable — overloaded or down for maintenance
- `504` Gateway Timeout — upstream didn't respond in time

## RESTful API Design
- Use nouns, not verbs: `/users` not `/getUsers`
- Use plural: `/users/123` rather than `/user/123`
- Nest resources: `/users/123/posts/456`
- Filtering: `GET /users?role=admin&status=active`
- Pagination: `GET /users?page=2&limit=20`
  Response headers: `X-Total-Count`, `Link: <...>; rel="next"`
- Versioning: `/v1/users` or `Accept: application/vnd.api.v1+json`
- Use consistent error format:
  ```json
  {"error": {"code": "VALIDATION_ERROR", "message": "...", "details": [...]}}
  ```

## Security Headers
```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: same-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cache-Control: no-store, must-revalidate  # for authenticated responses
```

## Common Web Vulnerabilities
- **XSS** — sanitize user input, use CSP headers, escape HTML output
- **SQL Injection** — use parameterized queries (never concatenate)
- **CSRF** — use anti-CSRF tokens, SameSite cookies
- **Clickjacking** — use X-Frame-Options
- **Open Redirect** — validate redirect URLs against whitelist
- **IDOR** — check authorization on every resource access
- **SSRF** — restrict outbound URLs, block private IPs
- **Prototype Pollution** — freeze Object.prototype, validate keys

## Authentication Methods
- **Session cookies**: server-side session, cookie with session ID (HttpOnly, Secure, SameSite)
- **JWT (JSON Web Token)**: stateless, base64-encoded payload, HMAC-signed or RSA-signed
  - Header: `{"alg": "HS256", "typ": "JWT"}`
  - Payload: `{"sub": "user123", "exp": 1700000000, "iat": 1699996400}`
  - Signature: `HMACSHA256(base64(header) + "." + base64(payload), secret)`
- **OAuth 2.0**: authorization framework (4 flows: authorization_code, implicit, client_credentials, password)
- **API Keys**: simple token in header `Authorization: Bearer <key>`
- **Basic Auth**: base64-encoded `user:pass` in header (use only with HTTPS)

## Passwords
- Never store in plain text
- Use bcrypt, argon2, or scrypt for hashing
- bcrypt: `await bcrypt.hash(password, 12)` — cost factor 12
- Verify: `await bcrypt.compare(password, hash)`
- Minimum password length: 8 (NIST recommends 12+)
- Rate-limit login attempts (e.g., 5 attempts per 15 min)

## CORS (Cross-Origin Resource Sharing)
Server response headers:
```
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
Access-Control-Allow-Credentials: true  # if using cookies
```
Preflight: browser sends `OPTIONS` request for non-simple requests.

## HTML/CSS Basics
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page</title>
</head>
<body>
  <header role="banner">...</header>
  <main role="main">...</main>
  <footer>...</footer>
</body>
</html>
```
CSS Box Model: content → padding → border → margin
- `display: block | inline | inline-block | flex | grid | none`
- `position: static | relative | absolute | fixed | sticky`
- Flexbox: `display: flex; justify-content: center; align-items: center`
- Grid: `display: grid; grid-template-columns: 1fr 1fr; gap: 16px`

## HTML Forms
```html
<form method="POST" action="/submit">
  <label for="email">Email</label>
  <input type="email" id="email" name="email" required>
  <button type="submit">Submit</button>
</form>
```
Common input types: `text`, `email`, `password`, `number`, `checkbox`,
`radio`, `file`, `date`, `url`, `tel`, `range`, `color`, `hidden`

## CSS Units
- `px` — absolute pixels
- `rem` — relative to root font-size (16px default)
- `em` — relative to parent font-size
- `%` — percentage of parent
- `vh` / `vw` — percentage of viewport height/width
- `vmin` / `vmax` — smaller/larger of vh/vw
- `ch` — width of '0' character
- `fr` — fraction of available space (grid only)
