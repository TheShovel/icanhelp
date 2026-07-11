# REST API Design Guidelines

## Resource Naming

### Use Nouns, Not Verbs
```
❌ GET /getUsers
❌ POST /createUser
❌ DELETE /deleteUser/123

✅ GET /users
✅ POST /users
✅ DELETE /users/123
```

### Pluralize Collections
```
✅ GET /users
✅ GET /users/123
✅ GET /users/123/posts
✅ GET /posts?userId=123
```

### Hierarchical Resources
```
# Comments on a post
GET    /posts/123/comments
POST   /posts/123/comments
GET    /posts/123/comments/456
PATCH  /posts/123/comments/456
DELETE /posts/123/comments/456

# Non-hierarchical (use query params)
GET /posts?author=123
GET /comments?postId=123
```

## HTTP Methods

| Method | Use Case | Idempotent | Safe |
|--------|----------|------------|------|
| GET | Retrieve | Yes | Yes |
| POST | Create | No | No |
| PUT | Replace entire resource | Yes | No |
| PATCH | Partial update | No* | No |
| DELETE | Delete | Yes | No |
| HEAD | Headers only | Yes | Yes |
| OPTIONS | Discover capabilities | Yes | Yes |

*PATCH can be idempotent if implemented correctly

## Status Codes

### 2xx Success
```
200 OK                    - GET, PUT, PATCH success
201 Created               - POST success (include Location header)
202 Accepted              - Async processing started
204 No Content            - DELETE success, no body
```

### 3xx Redirection
```
301 Moved Permanently     - Resource moved
304 Not Modified          - Cached version valid (ETag/If-None-Match)
```

### 4xx Client Errors
```
400 Bad Request           - Invalid syntax, validation error
401 Unauthorized          - Missing/invalid auth
403 Forbidden             - Authenticated but not authorized
404 Not Found             - Resource doesn't exist
405 Method Not Allowed    - Method not supported for resource
409 Conflict              - Resource conflict (duplicate, version)
422 Unprocessable Entity  - Semantic errors (validation)
429 Too Many Requests     - Rate limited
```

### 5xx Server Errors
```
500 Internal Server Error - Unexpected error
502 Bad Gateway           - Upstream service failed
503 Service Unavailable   - Temporary overload/maintenance
504 Gateway Timeout       - Upstream timeout
```

## Request/Response Format

### JSON Standards
```json
{
  "data": {
    "id": "123",
    "type": "user",
    "attributes": {
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "relationships": {
      "posts": {
        "links": {
          "self": "/users/123/relationships/posts",
          "related": "/users/123/posts"
        }
      }
    },
    "links": {
      "self": "/users/123"
    }
  }
}
```

### Error Format (RFC 7807)
```json
{
  "type": "https://api.example.com/errors/validation-error",
  "title": "Validation Failed",
  "status": 422,
  "detail": "One or more fields failed validation",
  "instance": "/users/123",
  "errors": [
    {
      "field": "email",
      "code": "invalid_format",
      "message": "Email format is invalid"
    },
    {
      "field": "age",
      "code": "out_of_range",
      "message": "Age must be between 18 and 120"
    }
  ]
}
```

### Empty Responses
```json
// 204 No Content - no body
// 200 OK with empty array
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "per_page": 20
  }
}
```

## Filtering, Sorting, Pagination

### Filtering
```
GET /users?status=active&role=admin
GET /posts?author=123&tags=tech,science
GET /orders?createdAfter=2024-01-01&createdBefore=2024-12-31
GET /products?price[gte]=10&price[lte]=100
```

### Sorting
```
GET /users?sort=name          # Ascending
GET /users?sort=-name         # Descending
GET /users?sort=-createdAt,name  # Multiple fields
```

### Pagination

#### Offset-based (Simple)
```
GET /users?page=2&per_page=20
```
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "per_page": 20,
    "total_pages": 8
  },
  "links": {
    "first": "/users?page=1&per_page=20",
    "last": "/users?page=8&per_page=20",
    "prev": "/users?page=1&per_page=20",
    "next": "/users?page=3&per_page=20"
  }
}
```

#### Cursor-based (Performant for Large Data)
```
GET /users?limit=20&cursor=eyJpZCI6MTAwfQ==
```
```json
{
  "data": [...],
  "meta": {
    "limit": 20
  },
  "links": {
    "next": "/users?limit=20&cursor=eyJpZCI6MTIwfQ=="
  }
}
```

## Versioning

### URL Versioning (Recommended)
```
GET /api/v1/users
GET /api/v2/users
```

### Header Versioning
```
Accept: application/vnd.example.v1+json
Accept: application/vnd.example.v2+json
```

### Deprecation
```
Sunset: Sat, 01 Jan 2025 00:00:00 GMT
Link: <https://api.example.com/v2/users>; rel="successor-version"
```

## Authentication & Authorization

### Bearer Token (JWT)
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key
```
X-API-Key: sk_live_abc123
Authorization: ApiKey sk_live_abc123
```

### OAuth 2.0
```
Authorization: Bearer <access_token>
```

### Scopes
```
POST /tokens
{
  "scopes": ["users:read", "users:write", "posts:read"]
}
```

## Rate Limiting

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705312800
Retry-After: 60
```

### Response (429)
```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests",
    "retry_after": 60
  }
}
```

## Caching

### ETag
```
# Request
If-None-Match: "abc123"

# Response
ETag: "abc123"
304 Not Modified
```

### Cache-Control
```
# Response
Cache-Control: public, max-age=3600
Cache-Control: private, no-cache, no-store
Cache-Control: no-store, must-revalidate
```

### Last-Modified
```
# Request
If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT

# Response
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT
```

## Request/Response Examples

### Create Resource
```bash
POST /api/v1/users
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

```http
HTTP/1.1 201 Created
Location: /api/v1/users/123
Content-Type: application/json

{
  "data": {
    "id": "123",
    "type": "user",
    "attributes": {
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Partial Update
```bash
PATCH /api/v1/users/123
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "John Smith"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "id": "123",
    "type": "user",
    "attributes": {
      "name": "John Smith",
      "email": "john@example.com",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  }
}
```

### Batch Operations
```bash
POST /api/v1/users/batch
Content-Type: application/json

{
  "operations": [
    { "method": "POST", "path": "/users", "body": {"name": "A"} },
    { "method": "PATCH", "path": "/users/123", "body": {"name": "B"} },
    { "method": "DELETE", "path": "/users/456" }
  ]
}
```

```json
{
  "results": [
    { "status": 201, "body": {...} },
    { "status": 200, "body": {...} },
    { "status": 204 }
  ]
}
```

## Webhooks

### Registration
```bash
POST /api/v1/webhooks
Content-Type: application/json

{
  "url": "https://app.example.com/webhook",
  "events": ["user.created", "order.completed"],
  "secret": "whsec_abc123"
}
```

### Delivery
```bash
POST /webhook
Content-Type: application/json
X-Webhook-Signature: sha256=abc123...
X-Webhook-Delivery: uuid
X-Webhook-Event: user.created

{
  "id": "evt_123",
  "type": "user.created",
  "createdAt": "2024-01-15T10:30:00Z",
  "data": { "user": {...} }
}
```

### Retry Policy
- Exponential backoff: 1m, 5m, 15m, 1h, 6h, 24h
- Max retries: 6
- Timeout: 10s per attempt

## API Documentation (OpenAPI)

```yaml
openapi: 3.0.3
info:
  title: Example API
  version: 1.0.0
servers:
  - url: https://api.example.com/v1
paths:
  /users:
    get:
      summary: List users
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: per_page
          in: query
          schema: { type: integer, default: 20, maximum: 100 }
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserList'
    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreate'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '422':
          description: Validation error
components:
  schemas:
    User:
      type: object
      properties:
        id: { type: string, format: uuid }
        name: { type: string }
        email: { type: string, format: email }
        createdAt: { type: string, format: date-time }
      required: [id, name, email, createdAt]
    UserCreate:
      type: object
      properties:
        name: { type: string, minLength: 1, maxLength: 100 }
        email: { type: string, format: email }
      required: [name, email]
    UserList:
      type: object
      properties:
        data:
          type: array
          items: { $ref: '#/components/schemas/User' }
        meta:
          $ref: '#/components/schemas/PaginationMeta'
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security:
  - BearerAuth: []
```

## Testing Checklist

- [ ] All endpoints return correct status codes
- [ ] Error responses follow consistent format
- [ ] Pagination works correctly (first, last, next, prev)
- [ ] Filtering and sorting work as documented
- [ ] Authentication required where specified
- [ ] Authorization enforced (403 vs 404)
- [ ] Rate limiting headers present
- [ ] Caching headers appropriate
- [ ] Input validation rejects invalid data
- [ ] Idempotency keys work for POST
- [ ] Request/response schemas match documentation
- [ ] CORS configured correctly
- [ ] API versioning works
- [ ] Deprecation headers present
- [ ] Webhook delivery and retries work