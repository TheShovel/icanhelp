# System Design & Architecture

## Design Process
1. **Clarify requirements**: functional (what the system must do) + non-functional (performance, availability, scalability, latency, durability, consistency)
   - Ask: what are the features? How many users? Read vs write heavy? Expected traffic? Latency requirements? Data storage needs? Geographic distribution?
2. **Estimate scale**: requests per second (RPS), storage needed (TB/PB), bandwidth, read/write ratio
   - Daily active users (DAU) × actions per user per day / 86400 seconds = peak RPS
   - Storage: data per item × items created per day × retention period
3. **High-level design**: components, data flow, APIs, data model
4. **Deep dive**: specific components, tradeoffs, bottlenecks, optimization

## Key Tradeoffs
- **Latency vs throughput**: can optimize for low latency (response quickly) or high throughput (handle many requests) — often conflicting
- **Consistency vs availability** (CAP theorem): in distributed systems, you can't have all three (Consistency, Availability, Partition tolerance). Pick two
  - CP system (consistent, partition tolerant): bank transactions — if network partition, may refuse writes (unavailable)
  - AP system (available, partition tolerant): social media feed — you can always post, but followers may not see it immediately (eventually consistent)
- **Strong vs eventual consistency**: strong (all replicas agree immediately — write is slower), eventual (replicas converge over time — faster writes, read could see stale data)
- **SQL vs NoSQL**:
  - SQL: structured data, relationships, ACID transactions, complex queries. Use for: payments, user accounts, any data with joins and strict consistency
  - NoSQL: flexible schema, horizontal scaling, high throughput. Key-value (Redis, DynamoDB): simple lookups, caching. Document (MongoDB): semi-structured data. Column-family (Cassandra): time-series, high write volume. Graph (Neo4j): relationships, recommendations
- **Normalization vs denormalization**: normalize (reduce redundancy, preserve integrity) vs denormalize (improve read performance, simplify queries) — often denormalize for read-heavy systems

## Core Components

### Load Balancer
- Distributes traffic across servers — LB is single point of failure (use redundant LBs)
  - Layer 4 (TCP): faster, IP-based. Layer 7 (HTTP): slower, but can route by path/header/cookie
  - Algorithms: round-robin, least connections, IP hash, consistent hashing, weighted
  - Health checks: verify backend servers are alive before sending traffic

### Caching
- Store frequently accessed data in fast storage (memory > SSD > network)
  - Client-side: browser cache (HTTP caching headers), CDN cache (static assets)
  - Server-side: in-memory cache (Redis, Memcached), CDN, reverse proxy cache (Varnish, Nginx)
- **Cache-aside (lazy loading)**: check cache first → miss → load from DB → write to cache. Good for read-heavy, handles cache misses gracefully
- **Write-through**: write to cache then DB — cache always consistent but slower writes
- **Write-behind (write-back)**: write to cache, async write to DB — fast writes, risk of data loss if cache fails
- **Eviction policies**: LRU (least recently used), LFU (least frequently used), TTL (time-to-live), FIFO (first in first out)
- **Cache invalidation**: one of the hardest problems in CS — "there are only two hard problems in computer science: cache invalidation and naming things"

### Database Scaling
- **Read replicas**: copies of DB for read queries — master handles writes, replicas handle reads (reduce load on master)
  - Replication lag: replicas may be slightly behind master (eventual consistency)
- **Sharding (horizontal partitioning)**: split data across multiple databases by shard key (user_id, geo, hash)
  - Sharding key is critical — bad choice = hotspots (one shard has all the traffic)
  - Re-sharding is painful — plan capacity ahead (consistent hashing helps redistribute)
- **Vertical scaling**: bigger server — easier but has limits (max hardware size)
- **Connection pooling**: reuse database connections instead of opening/closing per request — critical for performance

### Message Queues
- Async communication between services — producer sends message, consumer processes when ready
  - Benefits: decoupling, load smoothing (buffer spikes), fault tolerance (retry failed messages), ordering
  - Kafka: high throughput, persistent (disk), supports replay, best for event streaming and log processing
  - RabbitMQ: flexible routing, low latency, good for task queues and RPC
  - SQS (AWS): fully managed, at-least-once delivery, simple API
  - Pub/Sub pattern: one message → multiple subscribers (fan-out)

### Microservices vs Monolith
- **Monolith**: all code in one deployable unit — simpler, faster development early, easier debugging, lower latency
  - Good for: small teams, early stage, simple domains. Bad for: large teams, scaling independently, different technologies per component
- **Microservices**: independent deployable services, each owns its data — independent scaling, tech diversity, fault isolation, team autonomy
  - Costs: inter-service communication (network latency), distributed tracing, eventual consistency, data duplication, orchestration
  - Service mesh (Istio, Linkerd): handles service-to-service communication (retries, circuit breaking, observability) — adds complexity
  - **Strangler fig pattern**: gradually replace monolith features with microservices, one at a time
  - Don't start with microservices — start monolith, extract services when the monolith hurts (Conway's Law: systems mirror communication structures)

### API Design (for scale)
- **REST**: resources, HTTP methods, stateless — simple, cacheable, familiar. Limits: over-fetching (too much data), under-fetching (too little, need multiple requests)
- **GraphQL**: client specifies exactly what data it needs, single endpoint — solves over/under-fetching, but caching is harder, query complexity can be dangerous (deeply nested queries kill server)
- **gRPC**: protobuf binary format, HTTP/2, streaming, strongly typed, code generation — fast, efficient, great for internal services. Harder debugging, limited browser support
- **Rate limiting**: token bucket, leaky bucket, sliding window — prevent abuse, ensure fair usage
  - Return 429 Too Many Requests + Retry-After header

### Observability
- **Logging**: structured logs (JSON), correlation IDs (trace through services), log levels (DEBUG, INFO, WARN, ERROR)
- **Metrics**: request rate, error rate, latency (p50, p95, p99), service health, business metrics
  - USE method (Brendan Gregg): Utilization, Saturation, Errors for every resource
  - RED method (Tom Wilkie): Rate, Errors, Duration for every service
  - Prometheus + Grafana: most common open-source stack
- **Tracing**: follow a single request across services (Jaeger, Zipkin, OpenTelemetry)
  - Each request gets a trace ID propagated through all services
- **Alerting**: alert on symptoms (high error rate, high latency) not causes (CPU high). On-call rotation, escalation policy, runbooks
- **SLO/SLA/SLI**: Service Level Indicator (what you measure), Objective (target: 99.9% uptime), Agreement (contract with customer)

## Example: URL Shortener Design
- **Requirements**: create short URLs, redirect, analytics (click count, referrer, geo), 100M URLs, 10K reads/s, 1K writes/s
- **Key decisions**: use a distributed DB (Cassandra/DynamoDB) for scale, base62 encoding for short keys (7 chars = 62⁷ = 3.5T URLs), cache popular URLs in Redis
- **API**: POST /shorten (create), GET /{short_code} (redirect 301 to long URL)
- **Scale**: reads >> writes, so cache heavy (Redis), read replicas. Generate unique IDs (Snowflake/Twitter-style) or use DB sequence
- **Cleanup**: TTL for old URLs or archive to cold storage
