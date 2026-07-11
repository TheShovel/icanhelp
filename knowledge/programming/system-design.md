# System Design Fundamentals

## Scalability Patterns

### Vertical vs Horizontal Scaling

| Aspect | Vertical (Scale Up) | Horizontal (Scale Out) |
|--------|---------------------|------------------------|
| **Cost** | Exponential | Linear |
| **Limit** | Hardware max | Near unlimited |
| **Downtime** | Often required | Zero-downtime possible |
| **Complexity** | Low | Higher |

### Load Balancing Algorithms

```
Round Robin:        A → B → C → A → B → C
Weighted Round Robin: A(3) → A(3) → A(3) → B(1) → C(1) → A...
Least Connections:  Route to server with fewest active connections
Least Response Time: Route to server with lowest latency
IP Hash:            hash(client_ip) % servers → consistent routing
Consistent Hashing: Ring-based, minimal reshuffle on node changes
```

## Caching Strategies

### Cache Patterns

```python
# Cache-Aside (Lazy Loading)
async def get_user(user_id: str) -> User:
    # 1. Check cache
    user = await cache.get(f"user:{user_id}")
    if user:
        return user
    
    # 2. Fetch from DB
    user = await db.get_user(user_id)
    
    # 3. Populate cache
    await cache.set(f"user:{user_id}", user, ttl=300)
    return user

# Write-Through
async def update_user(user_id: str, data: dict) -> User:
    user = await db.update_user(user_id, data)
    await cache.set(f"user:{user_id}", user, ttl=300)
    return user

# Write-Behind (Write-Back)
async def update_user_async(user_id: str, data: dict):
    await cache.set(f"user:{user_id}", data, ttl=300)
    # Async write to DB
    task_queue.enqueue("db.update_user", user_id, data)

# Refresh-Ahead
async def get_user_predictive(user_id: str):
    # Check if near expiry
    ttl = await cache.ttl(f"user:{user_id}")
    if ttl < 60:  # Less than 1 min
        asyncio.create_task(refresh_user_cache(user_id))
    return await cache.get(f"user:{user_id}")
```

### Cache Invalidation

```python
# TTL-based (simple)
await cache.set(key, value, ttl=300)

# Event-based (precise)
async def on_user_updated(user_id: str):
    await cache.delete(f"user:{user_id}")
    await cache.delete(f"user:profile:{user_id}")
    await cache.delete_pattern(f"user:posts:{user_id}:*")

# Write-through with versioning
async def get_user_v2(user_id: str):
    version = await cache.get(f"user:version:{user_id}")
    cached = await cache.get(f"user:{user_id}:{version}")
    if cached:
        return cached
    
    user = await db.get_user(user_id)
    new_version = uuid.uuid4().hex[:8]
    await cache.set(f"user:version:{user_id}", new_version)
    await cache.set(f"user:{user_id}:{new_version}", user, ttl=3600)
    return user
```

## Database Scaling

### Read Replicas

```yaml
# Primary: writes + critical reads
# Replicas: read-heavy queries
```

```python
# Application-level routing
class DatabaseRouter:
    def __init__(self, primary: Pool, replicas: list[Pool]):
        self.primary = primary
        self.replicas = replicas
        self._rr_index = 0
    
    async def execute_read(self, query: str, *args):
        # Round-robin across replicas
        replica = self.replicas[self._rr_index % len(self.replicas)]
        self._rr_index += 1
        return await replica.fetch(query, *args)
    
    async def execute_write(self, query: str, *args):
        return await self.primary.execute(query, *args)
```

### Sharding

```python
# Shard by user_id
SHARD_COUNT = 16

def get_shard(user_id: str) -> int:
    return hash(user_id) % SHARD_COUNT

class ShardedDatabase:
    def __init__(self, shards: list[Pool]):
        self.shards = shards
    
    def _get_shard(self, user_id: str) -> Pool:
        return self.shards[get_shard(user_id)]
    
    async def get_user(self, user_id: str):
        return await self._get_shard(user_id).fetchrow(
            "SELECT * FROM users WHERE id = $1", user_id
        )
    
    async def get_users_batch(self, user_ids: list[str]):
        # Group by shard
        by_shard = defaultdict(list)
        for uid in user_ids:
            by_shard[get_shard(uid)].append(uid)
        
        results = []
        for shard_id, ids in by_shard.items():
            rows = await self.shards[shard_id].fetch(
                "SELECT * FROM users WHERE id = ANY($1)", ids
            )
            results.extend(rows)
        return results
```

### Connection Pooling

```python
# PgBouncer / PgPool-II / Built-in pool
pool = asyncpg.create_pool(
    host="pgbouncer",
    port=6432,
    min_size=10,
    max_size=50,
    command_timeout=30,
    # Prepared statements work with pgbouncer in transaction mode
)
```

## Message Queues

### Patterns

```python
# Publish-Subscribe (Fanout)
await exchange.publish(
    message=json.dumps(event),
    routing_key="",  # Fanout ignores routing key
)

# Work Queue (Competing Consumers)
await channel.default_exchange.publish(
    Message(body=json.dumps(task).encode()),
    routing_key="tasks",
)

# Priority Queue
await channel.default_exchange.publish(
    Message(
        body=json.dumps(task).encode(),
        priority=10,  # High priority
    ),
    routing_key="tasks",
)

# Delayed/Scheduled
await channel.default_exchange.publish(
    Message(
        body=json.dumps(task).encode(),
        headers={"x-delay": 60000},  # 60 seconds (ms)
    ),
    routing_key="delayed_tasks",
)

# Dead Letter Queue
await channel.declare_queue("tasks", arguments={
    "x-dead-letter-exchange": "dlx",
    "x-dead-letter-routing-key": "failed",
})
```

### Exactly-Once Processing

```python
async def process_with_idempotency(message: Message):
    msg_id = message.headers.get("message_id")
    
    # Check if already processed
    processed = await redis.set(
        f"processed:{msg_id}", 
        "1", 
        nx=True,  # Only set if not exists
        ex=86400  # 24h TTL
    )
    
    if not processed:
        logger.info(f"Duplicate message {msg_id}, skipping")
        return
    
    try:
        await do_work(message.body)
    except Exception:
        # Don't delete idempotency key on failure
        # Allows retry
        raise
```

## API Design

### RESTful Principles

```
GET    /users              # List
POST   /users              # Create
GET    /users/{id}         # Get
PUT    /users/{id}         # Replace
PATCH  /users/{id}         # Partial update
DELETE /users/{id}         # Delete

# Nested resources
GET    /users/{id}/posts
POST   /users/{id}/posts

# Actions (use sparingly)
POST   /users/{id}/activate
POST   /orders/{id}/cancel
```

### Pagination

```python
# Cursor-based (preferred for large datasets)
@app.get("/users")
async def list_users(
    limit: int = Query(20, le=100),
    cursor: str | None = None,
    sort: str = "created_at"
):
    query = "SELECT * FROM users ORDER BY created_at DESC"
    params = [limit + 1]  # Fetch one extra
    
    if cursor:
        decoded = base64.b64decode(cursor).decode()
        query += " AND created_at < $2"
        params.append(decoded)
    
    rows = await db.fetch(query, *params)
    
    has_more = len(rows) > limit
    if has_more:
        rows = rows[:limit]
        next_cursor = base64.b64encode(rows[-1]["created_at"].isoformat().encode()).decode()
    else:
        next_cursor = None
    
    return {
        "data": rows,
        "next_cursor": next_cursor,
        "has_more": has_more,
    }
```

### Rate Limiting

```python
# Token Bucket (Redis)
async def rate_limit(key: str, limit: int, window: int) -> tuple[bool, dict]:
    now = time.time()
    pipeline = redis.pipeline()
    
    # Remove expired tokens
    pipeline.zremrangebyscore(key, 0, now - window)
    
    # Count current
    pipeline.zcard(key)
    
    # Add new token
    pipeline.zadd(key, {str(now): now})
    pipeline.expire(key, window)
    
    results = await pipeline.execute()
    current_count = results[1]
    
    if current_count >= limit:
        return False, {
            "limit": limit,
            "remaining": 0,
            "reset": int(now + window),
        }
    
    return True, {
        "limit": limit,
        "remaining": limit - current_count - 1,
        "reset": int(now + window),
    }
```

## Consistency Patterns

### CAP Theorem

```
Consistency ──────────────── Availability
     │                          │
     │    Partition             │
     │    Tolerance ────────────┘
     
CP: Consistency + Partition Tolerance (e.g., etcd, ZooKeeper)
AP: Availability + Partition Tolerance (e.g., Cassandra, DynamoDB)
CA: Consistency + Availability (single node, no partitions)
```

### Eventual Consistency

```python
# Saga Pattern for distributed transactions
class OrderSaga:
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
    
    async def create_order(self, command: CreateOrder):
        order = Order.create(command)
        
        try:
            # Step 1: Reserve inventory
            await self.event_bus.publish(ReserveInventory(
                order_id=order.id,
                items=command.items
            ))
            
            # Step 2: Process payment
            await self.event_bus.publish(ProcessPayment(
                order_id=order.id,
                amount=order.total,
                payment_method=command.payment_method
            ))
            
            # Step 3: Confirm order
            order.confirm()
            await order_repo.save(order)
            
        except InventoryUnavailable:
            order.fail("Inventory unavailable")
            await order_repo.save(order)
            # Trigger compensation
            await self.event_bus.publish(ReleaseInventory(order_id=order.id))
        
        except PaymentFailed:
            order.fail("Payment failed")
            await order_repo.save(order)
            await self.event_bus.publish(ReleaseInventory(order_id=order.id))
```

### Conflict Resolution

```python
# Last-Writer-Wins (LWW)
def merge_lww(local: dict, remote: dict, timestamp_key: str) -> dict:
    return remote if remote[timestamp_key] > local[timestamp_key] else local

# Vector Clocks
@dataclass
class VectorClock:
    clocks: dict[str, int]  # node_id -> counter
    
    def increment(self, node_id: str) -> "VectorClock":
        new_clocks = self.clocks.copy()
        new_clocks[node_id] = new_clocks.get(node_id, 0) + 1
        return VectorClock(new_clocks)
    
    def merge(self, other: "VectorClock") -> "VectorClock":
        all_nodes = set(self.clocks) | set(other.clocks)
        return VectorClock({
            node: max(self.clocks.get(node, 0), other.clocks.get(node, 0))
            for node in all_nodes
        })
    
    def happens_before(self, other: "VectorClock") -> bool:
        """True if self is ancestor of other"""
        return all(
            self.clocks.get(node, 0) <= other.clocks.get(node, 0)
            for node in set(self.clocks) | set(other.clocks)
        ) and any(
            self.clocks.get(node, 0) < other.clocks.get(node, 0)
            for node in set(self.clocks) | set(other.clocks)
        )

# CRDT (Conflict-free Replicated Data Type)
class GCounter:
    """Grow-only counter"""
    def __init__(self):
        self.counts: dict[str, int] = defaultdict(int)
    
    def increment(self, node_id: str):
        self.counts[node_id] += 1
    
    def value(self) -> int:
        return sum(self.counts.values())
    
    def merge(self, other: "GCounter"):
        for node, count in other.counts.items():
            self.counts[node] = max(self.counts[node], count)
```

## Observability

### Three Pillars

```
┌─────────────────────────────────────────────────────┐
│                    METRICS                          │
│  - Latency (p50, p95, p99)                         │
│  - Error rate                                       │
│  - Throughput (RPS)                                 │
│  - Saturation (CPU, memory, disk, network)         │
├─────────────────────────────────────────────────────┤
│                    LOGS                             │
│  - Structured JSON                                  │
│  - Correlation IDs                                  │
│  - Log levels (DEBUG, INFO, WARN, ERROR)           │
├─────────────────────────────────────────────────────┤
│                    TRACES                           │
│  - Request flow across services                     │
│  - Span: operation + duration + tags                │
│  - Parent-child relationships                       │
└─────────────────────────────────────────────────────┘
```

### SLO/SLI/SLA

```
SLI (Service Level Indicator): 
  - Latency < 200ms for 95% of requests
  - Error rate < 0.1%
  - Availability > 99.9%

SLO (Service Level Objective):
  - Target: 99.9% availability over 30 days
  - Target: 95th percentile latency < 200ms

SLA (Service Level Agreement):
  - Contract with customer
  - Penalties for breach
  - Usually looser than SLO
```

### Error Budget

```
Error Budget = (1 - SLO) * Time Period

Example: 99.9% availability over 30 days
  Total minutes = 30 * 24 * 60 = 43,200
  Error budget = 0.001 * 43,200 = 43.2 minutes downtime allowed

Alerting:
  - Burn rate 1x: 43 min/month → Alert in 24h
  - Burn rate 2x: 21 min/month → Alert in 6h
  - Burn rate 10x: 4 min/month → Alert in 1h
```

## Architecture Patterns

### CQRS (Command Query Responsibility Segregation)

```python
# Write Model (Commands)
class OrderCommandHandler:
    def __init__(self, event_store: EventStore):
        self.event_store = event_store
    
    async def handle(self, command: CreateOrder):
        order = Order.create(command)
        await self.event_store.append(order.events)

# Read Model (Queries)
class OrderReadModel:
    def __init__(self, read_db: Pool):
        self.db = read_db
    
    async def get_order_summary(self, order_id: str) -> OrderSummary:
        return await self.db.fetchrow("""
            SELECT o.*, c.name as customer_name, 
                   SUM(oi.quantity * oi.price) as total
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = $1
            GROUP BY o.id, c.name
        """, order_id)

# Event Processor (Sync read model)
class OrderEventProcessor:
    async def process(self, event: Event):
        if isinstance(event, OrderCreated):
            await self.db.execute("""
                INSERT INTO order_summary (id, customer_id, status, total, created_at)
                VALUES ($1, $2, $3, $4, $5)
            """, event.order_id, event.customer_id, "pending", event.total, event.timestamp)
```

### Event Sourcing

```python
# Event Store
class EventStore:
    async def append(self, aggregate_id: str, events: list[Event], expected_version: int):
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                # Check version
                current = await conn.fetchval(
                    "SELECT version FROM aggregates WHERE id = $1", aggregate_id
                )
                if current != expected_version:
                    raise ConcurrentModificationError()
                
                # Append events
                for i, event in enumerate(events):
                    await conn.execute("""
                        INSERT INTO events (aggregate_id, version, type, data, timestamp)
                        VALUES ($1, $2, $3, $4, $5)
                    """, aggregate_id, expected_version + i + 1, 
                        type(event).__name__, json.dumps(event.to_dict()), datetime.utcnow())
                
                # Update aggregate version
                await conn.execute("""
                    INSERT INTO aggregates (id, version) VALUES ($1, $2)
                    ON CONFLICT (id) DO UPDATE SET version = $2
                """, aggregate_id, expected_version + len(events))

# Aggregate Base
class Aggregate:
    def __init__(self):
        self._events: list[Event] = []
        self._version = 0
    
    @property
    def version(self) -> int:
        return self._version
    
    @property
    def events(self) -> list[Event]:
        return self._events
    
    def _add_event(self, event: Event):
        self._events.append(event)
        self._version += 1
    
    @classmethod
    def from_events(cls, events: list[Event]) -> "Aggregate":
        aggregate = cls()
        for event in events:
            aggregate.apply(event)
            aggregate._version += 1
        return aggregate
    
    def apply(self, event: Event):
        handler = getattr(self, f"apply_{type(event).__name__}", None)
        if handler:
            handler(event)
```

## Capacity Planning

### Little's Law

```
L = λ × W

L = Average number of requests in system
λ = Average arrival rate (requests/sec)
W = Average time in system (seconds)

Example:
  Target: 1000 RPS, 100ms avg latency
  L = 1000 × 0.1 = 100 concurrent requests
  
  With 3x headroom: 300 concurrent
  Thread pool size: 300
  Connection pool: 300
```

### Queue Sizing

```
M/M/c queue (c servers, exponential service time)

Utilization ρ = λ / (c × μ)
Where μ = service rate (requests/sec per server)

Queue length Lq = (ρ^c / (c! × (1-ρ))) × P0 / (1-ρ)^2

Rule of thumb: Keep ρ < 0.7 for low latency variance
```

## Checklist for New Services

- [ ] Define SLIs/SLOs
- [ ] Implement health checks (liveness, readiness, startup)
- [ ] Add structured logging with correlation IDs
- [ ] Export Prometheus metrics
- [ ] Add distributed tracing
- [ ] Configure rate limiting
- [ ] Set up alerting on error budget burn
- [ ] Document API with OpenAPI
- [ ] Load test before launch
- [ ] Run chaos engineering experiments
- [ ] Define runbooks for common failures
- [ ] Plan capacity with 3x headroom