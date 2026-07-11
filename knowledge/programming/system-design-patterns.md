# System Design Patterns

## Scalability Patterns

### Horizontal Scaling (Scale Out)
```
Load Balancer → [App Instance 1] [App Instance 2] [App Instance 3] ...
                      ↓              ↓              ↓
                 [Shared Cache] [Shared DB] [Message Queue]
```

**Stateless Services**: Any instance can handle any request
- Store session in Redis/DB, not memory
- Use JWT for auth (stateless)
- Externalize config (ConfigMap, Consul, etcd)

### Vertical Scaling (Scale Up)
- Increase CPU/RAM of existing instances
- Limited by hardware, single point of failure
- Good for databases (read replicas for horizontal reads)

### Database Scaling

#### Read Replicas
```
Primary (Write) → Async Replication → Replica 1 (Read)
                                      → Replica 2 (Read)
                                      → Replica 3 (Read)
```
- Route reads to replicas, writes to primary
- Eventual consistency (replication lag)
- Use for: reporting, analytics, non-critical reads

#### Sharding (Horizontal Partitioning)
```
Shard Key: user_id % 4
Shard 0: user_id % 4 = 0
Shard 1: user_id % 4 = 1
Shard 2: user_id % 4 = 2
Shard 3: user_id % 4 = 3
```
- Distribute data across multiple databases
- Consistent hashing for rebalancing
- Challenges: cross-shard queries, transactions, hotspots

#### Vertical Partitioning
- Split tables by column access patterns
- Frequently accessed columns together
- Rarely accessed columns separate

### Caching Strategies

#### Cache-Aside (Lazy Loading)
```python
def get_user(user_id):
    user = cache.get(f"user:{user_id}")
    if user is None:
        user = db.query("SELECT * FROM users WHERE id = ?", user_id)
        cache.set(f"user:{user_id}", user, ttl=300)
    return user
```
- On miss: load from DB, populate cache
- On write: invalidate or update cache
- Pros: Simple, cache only needed data
- Cons: Cache miss penalty, stale data on write

#### Write-Through
```python
def update_user(user_id, data):
    db.execute("UPDATE users SET ... WHERE id = ?", user_id)
    cache.set(f"user:{user_id}", data, ttl=300)
```
- Write to cache and DB simultaneously
- Pros: Cache always fresh
- Cons: Write latency, writes to unused data

#### Write-Behind (Write-Back)
```python
def update_user(user_id, data):
    cache.set(f"user:{user_id}", data, ttl=300)
    queue.enqueue("db_write", user_id, data)  # Async
```
- Write to cache, async flush to DB
- Pros: Fast writes
- Cons: Data loss risk, complexity

#### Refresh-Ahead
- Background job refreshes cache before expiry
- Good for predictable access patterns

### Cache Invalidation
```python
# Invalidate on write
def update_user(user_id, data):
    db.execute("UPDATE users SET ... WHERE id = ?", user_id)
    cache.delete(f"user:{user_id}")
    cache.delete(f"user:{user_id}:posts")  # Related keys

# Tag-based invalidation
cache.set("user:1", data, tags=["user:1", "user:1:profile"])
cache.invalidate_tag("user:1")  # Invalidates all tagged keys
```

## Reliability Patterns

### Circuit Breaker
```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failures = 0
        self.state = "closed"  # closed, open, half-open
        self.last_failure_time = None
    
    def call(self, func, *args, **kwargs):
        if self.state == "open":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "half-open"
            else:
                raise CircuitOpenException()
        
        try:
            result = func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise
    
    def on_success(self):
        self.failures = 0
        self.state = "closed"
    
    def on_failure(self):
        self.failures += 1
        self.last_failure_time = time.time()
        if self.failures >= self.failure_threshold:
            self.state = "open"
```

**States**:
- **Closed**: Normal operation, failures counted
- **Open**: Short-circuit, fail fast
- **Half-Open**: Test if service recovered

### Retry with Exponential Backoff
```python
import random
import time

def retry_with_backoff(func, max_retries=3, base_delay=1, max_delay=60):
    for attempt in range(max_retries + 1):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries:
                raise
            delay = min(base_delay * (2 ** attempt) + random.uniform(0, 1), max_delay)
            time.sleep(delay)

# With jitter (prevents thundering herd)
delay = min(base * (2 ** attempt) + random.uniform(0, 1), max_delay)
```

### Bulkhead Pattern
```python
# Isolate resources per service/client
class BulkheadExecutor:
    def __init__(self, max_concurrent=10):
        self.semaphore = asyncio.Semaphore(max_concurrent)
    
    async def execute(self, coro):
        async with self.semaphore:
            return await coro

# Separate thread pools for different dependencies
db_executor = ThreadPoolExecutor(max_workers=10)
http_executor = ThreadPoolExecutor(max_workers=20)
cache_executor = ThreadPoolExecutor(max_workers=5)
```

### Timeout & Deadline Propagation
```python
# Always set timeouts
async def call_service(url, timeout=5.0):
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout)) as session:
        async with session.get(url) as resp:
            return await resp.json()

# Propagate deadline (context in Go, deadline in gRPC)
async def handler(request):
    deadline = request.headers.get("x-deadline")
    if deadline:
        timeout = float(deadline) - time.time()
        if timeout <= 0:
            raise TimeoutError()
    return await call_downstream(timeout=timeout)
```

## Data Consistency Patterns

### Saga Pattern (Distributed Transactions)
```
Order Service          Payment Service          Inventory Service
    │                      │                        │
    ├─ Create Order ──────►│                        │
    │                      ├─ Charge Payment ──────►│
    │                      │◄─ Success ─────────────┤
    │◄─ Order Created ─────┤                        │
    │                      │                        │
    │                      ├─ Reserve Inventory ───►│
    │                      │◄─ Reserved ────────────┤
    │◄─ Confirmed ─────────┤                        │
    
# On failure: Compensating transactions
# Payment fails → Cancel Order
# Inventory fails → Refund Payment
```

**Choreography** (Event-driven):
```python
# Each service publishes events, others react
def handle_order_created(event):
    try:
        charge_payment(event.order_id)
        publish("PaymentCharged", order_id=event.order_id)
    except PaymentFailed:
        publish("OrderCancelled", order_id=event.order_id, reason="payment_failed")

def handle_payment_charged(event):
    try:
        reserve_inventory(event.order_id)
        publish("InventoryReserved", order_id=event.order_id)
    except InventoryFailed:
        refund_payment(event.order_id)
        publish("OrderCancelled", order_id=event.order_id, reason="inventory_failed")
```

**Orchestration** (Central coordinator):
```python
class OrderSaga:
    def execute(self, order_id):
        steps = [
            (self.create_order, self.cancel_order),
            (self.charge_payment, self.refund_payment),
            (self.reserve_inventory, self.release_inventory),
            (self.confirm_order, self.cancel_order),
        ]
        
        completed = []
        for forward, backward in steps:
            try:
                forward(order_id)
                completed.append(backward)
            except Exception:
                # Rollback in reverse
                for rollback in reversed(completed):
                    rollback(order_id)
                raise
```

### Event Sourcing
```python
# Store events, not current state
class Account:
    def __init__(self):
        self.events = []
        self.balance = 0
    
    def deposit(self, amount):
        event = {"type": "Deposited", "amount": amount, "timestamp": now()}
        self.events.append(event)
        self.apply(event)
    
    def withdraw(self, amount):
        if self.balance < amount:
            raise InsufficientFunds()
        event = {"type": "Withdrawn", "amount": amount, "timestamp": now()}
        self.events.append(event)
        self.apply(event)
    
    def apply(self, event):
        if event["type"] == "Deposited":
            self.balance += event["amount"]
        elif event["type"] == "Withdrawn":
            self.balance -= event["amount"]
    
    # Rebuild state from events
    @classmethod
    def from_events(cls, events):
        acc = cls()
        for event in events:
            acc.apply(event)
        return acc
```

**CQRS** (Command Query Responsibility Segregation):
```
Commands (Write)          Queries (Read)
    │                         │
    ▼                         ▼
[Write Model]           [Read Model]
    │                         │
    └──── Events ────────────┘
         │
         ▼
    [Event Store]
```

### Two-Phase Commit (2PC) - Avoid if possible
```
Coordinator                    Participants
    │                              │
    ├─ PREPARE ───────────────────►│
    │◄─ READY/ABORT ───────────────┤
    │                              │
    ├─ COMMIT (if all READY) ─────►│
    │                              │
    │◄─ ACK ───────────────────────┤
```
- Blocking, coordinator is SPOF
- Use Saga instead for microservices

## Communication Patterns

### Synchronous (Request-Response)
```python
# REST, gRPC, GraphQL
# Client waits for response
# Simple, but tight coupling, cascade failures
```

### Asynchronous (Message Queue)
```python
# Producer
def create_order(order_data):
    order = save_order(order_data)
    message_queue.publish("order.created", {"order_id": order.id})
    return order

# Consumer
def handle_order_created(message):
    order_id = message["order_id"]
    process_order(order_id)
    message.ack()
```

**Patterns**:
- **Fire and Forget**: No response needed
- **Request-Reply**: Correlation ID, reply queue
- **Pub/Sub**: Multiple consumers, broadcast

### Event-Driven Architecture
```python
# Event schema
{
  "event_id": "uuid",
  "event_type": "OrderCreated",
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "order-service",
  "data": { "order_id": 123, "customer_id": 456, "total": 99.99 }
}

# Consumer with idempotency
def handle(event):
    # Check if already processed
    if redis.setnx(f"processed:{event['event_id']}", "1"):
        process(event)
    # Else: duplicate, ignore
```

## API Design Patterns

### REST Best Practices
```
GET    /users              # List
POST   /users              # Create
GET    /users/{id}         # Get
PUT    /users/{id}         # Replace
PATCH  /users/{id}         # Partial update
DELETE /users/{id}         # Delete

# Nested resources
GET    /users/{id}/orders
POST   /users/{id}/orders

# Custom actions (use POST on sub-resource
POST   /orders/{id}/cancel
```

### Pagination
```python
# Cursor-based (preferred for large datasets)
GET /users?cursor=abc123&limit=20
# Response: {"data": [...], "next_cursor": "def456", "has_more": true}

# Offset-based (simple, but slow on large offsets)
GET /users?page=2&size=20
```

### Versioning
```
# URL versioning
/v1/users
/v2/users

# Header versioning
Accept: application/vnd.myapp.v2+json

# Query param (avoid)
GET /users?version=2
```

### Error Responses
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {"field": "email", "code": "INVALID_FORMAT", "message": "Invalid email"}
    ],
    "request_id": "req_abc123"
  }
}
```

## Observability

### Three Pillars
```
Metrics (Prometheus)     Logs (ELK/Loki)      Traces (Jaeger/Zipkin)
    │                         │                      │
    ▼                         ▼                      ▼
  Aggregated              Structured            Request flow
  numeric data            text records          across services
    │                         │                      │
    └─────────────────────────┼──────────────────────┘
                              ▼
                      Alerting & Dashboards
```

### Key Metrics (RED Method)
- **Rate**: Requests per second
- **Errors**: Error rate (5xx / total)
- **Duration**: Latency (p50, p95, p99)

### USE Method (Resources)
- **Utilization**: % busy
- **Saturation**: Queue length, wait time
- **Errors**: Error count

### Structured Logging
```python
import structlog

logger = structlog.get_logger()

logger.info("order_created", 
    order_id=order.id,
    customer_id=order.customer_id,
    total=order.total,
    items_count=len(order.items),
    duration_ms=duration
)

# Output: timestamp=2024-01-15T10:30:00.123Z level=info event=order_created order_id=123 customer_id=456 total=99.99 items_count=3 duration_ms=45
```

### Distributed Tracing
```python
# OpenTelemetry
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

@tracer.start_as_current_span("create_order")
def create_order(data):
    with tracer.start_as_current_span("validate") as span:
        validate(data)
        span.set_attribute("items_count", len(data.items))
    
    with tracer.start_as_current_span("save_db") as span:
        order = db.save(data)
        span.set_attribute("order_id", order.id)
    
    with tracer.start_as_current_span("publish_event"):
        event_bus.publish("OrderCreated", order)
    
    return order
```

## Security Patterns

### Authentication
```
JWT (Stateless)          Session/Cookie (Stateful)
    │                         │
    ▼                         ▼
Header: Authorization    Cookie: session_id
Bearer <token>           Secure, HttpOnly
    │                         │
    ▼                         ▼
Validate signature      Lookup in Redis/DB
Check exp claim         Check expiry
No revocation*          Can revoke instantly
```
*JWT: Use short expiry + refresh tokens, or token blocklist

### Authorization
```python
# RBAC (Role-Based)
@require_role("admin")
def delete_user(user_id): ...

# ABAC (Attribute-Based)
@require_permission("document:read", resource=lambda: get_doc(doc_id))
def read_document(doc_id): ...

# Policy Engine (OPA)
policy = """
package app.authz
allow {
  input.user.role == "admin"
}
allow {
  input.user.id == input.resource.owner_id
  input.action == "read"
}
"""
```

### API Gateway Pattern
```
Client → API Gateway → Services
              │
              ├─ Auth (JWT validation)
              ├─ Rate Limiting
              ├─ Request/Response Transform
              ├─ Logging/Monitoring
              ├─ Circuit Breaker
              └─ Routing
```

## Deployment Patterns

### Blue-Green Deployment
```
Traffic → [Blue v1] (Active)
          
Deploy → [Green v2] (Staging)
          
Switch → Traffic → [Green v2] (Active)
          
Rollback → Traffic → [Blue v1] (Instant)
```

### Canary Deployment
```
Traffic: 95% → [v1]  5% → [v2]
         ▼
    Monitor metrics
         ▼
Traffic: 50% → [v1]  50% → [v2]
         ▼
Traffic: 0% → [v1]  100% → [v2]
```

### Rolling Update
```
[Pod v1] [Pod v1] [Pod v1]
    │
    ▼ (maxSurge=1, maxUnavailable=0)
[Pod v2] [Pod v1] [Pod v1] [Pod v1]
    │
    ▼
[Pod v2] [Pod v2] [Pod v1] [Pod v1]
    │
    ▼
[Pod v2] [Pod v2] [Pod v2] [Pod v2]
```

### Feature Flags
```python
# LaunchDarkly, Unleash, custom
if feature_flag.is_enabled("new_checkout", user_id):
    return new_checkout_flow()
else:
    return old_checkout_flow()

# Percentage rollout
if feature_flag.is_enabled("new_ui", percentage=10):
    return new_ui()
```

## Database Patterns

### Connection Pooling
```python
# Configure appropriately
pool = psycopg2.pool.ThreadedConnectionPool(
    minconn=5,
    maxconn=20,
    host="db",
    database="app",
    user="user",
    password="pass"
)

# Per-request
conn = pool.getconn()
try:
    cursor = conn.cursor()
    cursor.execute("SELECT ...")
finally:
    pool.putconn(conn)
```

### Read/Write Splitting
```python
class Database:
    def __init__(self):
        self.write_pool = create_pool(primary_dsn)
        self.read_pool = create_pool(replica_dsn)
    
    def execute_write(self, query, params):
        return self.write_pool.execute(query, params)
    
    def execute_read(self, query, params):
        return self.read_pool.execute(query, params)

# Or use middleware (ProxySQL, PgBouncer-rw)
```

### Optimistic Locking
```sql
UPDATE accounts 
SET balance = balance - 100, version = version + 1
WHERE id = 1 AND version = 5;

-- Check affected rows
-- 0 rows = conflict, retry
```

### Soft Deletes
```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- Queries
SELECT * FROM users WHERE deleted_at IS NULL;
-- Or use view
CREATE VIEW active_users AS SELECT * FROM users WHERE deleted_at IS NULL;
```

## Checklist for New Services

- [ ] Health endpoints: `/health/live`, `/health/ready`, `/health/startup`
- [ ] Metrics: `/metrics` (Prometheus format)
- [ ] Structured logging (JSON, correlation IDs)
- [ ] Distributed tracing headers propagation
- [ ] Graceful shutdown (SIGTERM handling, drain connections)
- [ ] Configuration via environment variables
- [ ] Secrets via secret manager (not env vars)
- [ ] Resource requests/limits defined
- [ ] Liveness/readiness probes configured
- [ ] Circuit breakers on external calls
- [ ] Timeouts on all external calls
- [ ] Retry with backoff on transient failures
- [ ] Idempotency keys for mutating operations
- [ ] Rate limiting
- [ ] Input validation & sanitization
- [ ] Audit logging for sensitive operations
- [ ] Run as non-root, read-only filesystem
- [ ] Network policies restrict traffic
- [ ] Pod security standards (restricted)
- [ ] Documentation: API spec, runbooks, architecture diagram