# API Design & REST Best Practices

## URL Design
- Use nouns not verbs: `/users` not `/getUsers`
- Plural nouns: `/users`, `/users/123`, `/users/123/posts`
- Hierarchical: `/users/123/posts/456/comments`
- Filtering: `?status=active&role=admin`
- Sorting: `?sort=created_at&order=desc`
- Pagination: `?page=2&limit=25` or `?cursor=abc123&limit=25`
  - Cursor-based > page-based for real-time data (page numbers shift if data changes)
- Fields: `?fields=id,name,email` — client specifies what to return
- Embedding: `?include=comments.author` — return related resources inline

## HTTP Methods
- `GET` — retrieve resource(s). Idempotent, safe. 200 OK
- `POST` — create resource. Non-idempotent. 201 Created, Location header
- `PUT` — full replacement. Idempotent. 200 OK (or 204 No Content)
- `PATCH` — partial update. Idempotent if well-defined. 200 OK
- `DELETE` — remove resource. Idempotent. 204 No Content
- `HEAD` — GET without body (check existence, headers). 200
- `OPTIONS` — list allowed methods. 200 (Allow header)

## Status Codes
- 200 OK — success for GET, PUT, PATCH
- 201 Created — success for POST
- 204 No Content — success for DELETE or PUT with no response body
- 301/302 — redirect (301 permanent, 302 temporary)
- 304 Not Modified — use with ETag/If-None-Match for caching
- 400 Bad Request — malformed syntax
- 401 Unauthorized — missing/invalid authentication
- 403 Forbidden — authenticated but not allowed
- 404 Not Found — resource doesn't exist
- 405 Method Not Allowed — wrong method for endpoint
- 409 Conflict — state conflict (duplicate, stale version)
- 422 Unprocessable Entity — validation failure
- 429 Too Many Requests — rate limited
- 500 Internal Server Error — generic server failure
- 502 Bad Gateway — upstream service failed
- 503 Service Unavailable — overloaded/down for maintenance
- 504 Gateway Timeout — upstream didn't respond

## Request/Response Format
```json
// Standard envelope
{
  "data": { ... },
  "meta": { "page": 1, "total": 100 },
  "links": {
    "self": "...",
    "next": "...",
    "prev": null
  }
}

// Error format
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is invalid",
    "details": [
      { "field": "email", "message": "must be a valid email address" }
    ]
  }
}
```

## Authentication
- **API key**: simple, passed in header `Authorization: Bearer <key>`
- **JWT**: self-contained token, decoded server-side, can include user info/scopes
  - Send in `Authorization: Bearer <token>` header
  - Short-lived (15 min access), longer-lived refresh token
- **OAuth 2.0**: authorization framework — user grants third-party access
  - Authorization code flow: redirect → user consents → code → exchange for token
- Rate limiting: indicate via headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Versioning
- URL path: `/v1/users`, `/v2/users` — simplest, most common
- Header: `Accept: application/vnd.api+json; version=2`
- Never break backward compatibility without warning + migration period
- Deprecate: add `Deprecation` and `Sunset` headers to old versions

## Caching
- `ETag`: hash of response — client sends `If-None-Match`, server returns 304 if unchanged
- `Last-Modified`: client sends `If-Modified-Since`
- `Cache-Control`: `public` (CDN caches), `private` (only browser), `no-cache` (revalidate), `no-store` (never)
- `Expires`: absolute expiration time (use Cache-Control max-age instead, more precise)

## Best Practices Checklist
- Use HTTPS everywhere
- Validate all input (type, range, format, length)
- Rate limit by user/IP/API key
- Log all requests (method, path, status, latency, user)
- ID all resources (UUIDv4 for public IDs, integers for internal)
- Return consistent error format
- Document with OpenAPI/Swagger
- Paginate all list endpoints
- Use idempotency key for POST (retry-safe: `Idempotency-Key` header)
- Respond with appropriate status codes (don't return 200 for errors)
- Never expose internal implementation (SQL errors, stack traces)
- CORS: narrow origin, specific methods, not wildcard for auth endpoints
