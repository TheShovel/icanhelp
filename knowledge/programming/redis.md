# Redis

In-memory data structure store used as cache, database, and message broker.

## Data Structures
- **Strings**: `SET key value`, `GET key`, `INCR key` (atomic increment), `SETEX key 3600 value` (set + expire). Binary safe. Max 512MB per string
- **Lists**: `LPUSH/RPUSH`, `LPOP/RPOP`, `LRANGE key 0 -1` (all elements), `LLEN`. Linked lists — fast head/tail operations, slow random access. Use for: queues, recent items, timelines
- **Sets**: `SADD`, `SMEMBERS`, `SISMEMBER`, `SINTER` (intersection), `SUNION`, `SDIFF`. Unordered, unique strings. Use for: tags, deduplication, friends list, random sampling via `SRANDMEMBER`
- **Sorted sets**: `ZADD key score member`, `ZRANGE key 0 -1 WITHSCORES`, `ZRANK`, `ZREVRANK`, `ZRANGEBYSCORE`. Ordered by score. Use for: leaderboards, rate limiting (score = timestamp), autocomplete, priority queues
- **Hashes**: `HSET`, `HGET`, `HGETALL`, `HDEL`, `HINCRBY`. Like objects/dicts — efficient for storing objects. Use for: user profiles, session data, product details
- **Bitmaps**: `SETBIT`, `GETBIT`, `BITCOUNT`, `BITOP`. Operate on bits of string value. Extremely memory efficient. Use for: daily active users (setbit 100M users = 12.5MB), bloom filters
- **HyperLogLog**: `PFADD`, `PFCOUNT`, `PFMERGE`. Probabilistic cardinality estimator. ~0.81% error, constant memory ~12KB. Use for: unique visitor counting
- **Streams**: `XADD`, `XREAD`, `XREADGROUP`, `XRANGE`, `XDEL`. Append-only log of messages. Like Kafka but simpler. Use for: event sourcing, message queuing, log aggregation
- **Geospatial**: `GEOADD`, `GEODIST`, `GEORADIUS`, `GEOSEARCH`. Store lat/lon, query by radius. Use for: nearby places, location-based services

## Persistence
- **RDB (Redis Database Backup)**: Point-in-time snapshot at configurable intervals (save 900 1 — if 1 key changed in 900 sec, save). Compact binary file. Good for backups, failover. Loses data since last save on crash
- **AOF (Append-Only File)**: Logs every write operation. More durable (fsync every sec = 1 sec data loss). Larger than RDB. Slower rewrites (background rewrite compacts log). Choose: `appendonly yes`, `appendfsync everysec`
- **RDB + AOF combined**: Best durability — AOF for crash recovery (more complete), RDB for faster restarts
- **Hybrid persistence** (Redis 4.0+): `aof-use-rdb-preamble yes` — AOF starts with RDB header for faster rewrite + replay

## Caching Patterns
- **Cache-aside (lazy loading)**: App checks cache → miss → load from DB → store in cache. Set TTL for eventual consistency. Simple, handles failures gracefully
- **Write-through**: Write to cache AND DB simultaneously. Ensures cache always fresh. More writes, higher latency
- **Write-behind**: Write to cache, async write to DB. Lower latency, risk of data loss if cache fails
- **Cache invalidation**: Hardest problem — invalidate/ update cache when DB changes. Use TTL + explicit invalidation. Avoid complex cache consistency schemes
- **Cache stampede prevention**: When hot key expires and multiple requests hit — all go to DB. Use locking (SETNX) or "early recompute" (recompute before TTL expires)

## Pub/Sub
- **Publishers**: `PUBLISH channel message` — fire and forget. No message persistence (subscriber down = message lost)
- **Subscribers**: `SUBSCRIBE channel` → blocks waiting. Pattern subscribe: `PSUBSCRIBE news:*`
- **Limitations**: No message acknowledgment, no replay, no delivery guarantees. For reliable messaging use Redis Streams or dedicated queue

## Lua Scripting
- **Atomic scripts**: `EVAL "return redis.call('SET', KEYS[1], ARGV[1])" 1 key value`. Execute Lua inside Redis atomically. No race conditions
- **Use cases**: Compare-and-set, rate limiting (sliding window), batch operations with rollback
- **Script cache**: `SCRIPT LOAD` → `EVALSHA` — avoid sending script text every time

## Clustering
- **Redis Cluster**: Data sharded across nodes (16384 hash slots). Automatic failover. `redis-cli --cluster create`. No cross-slot multi-key operations (unless keys share hash tag `{user:123}:key1`)
- **Sentinel**: High availability without clustering — monitors master, promotes replica on failure. Client connects via sentinel (get-master-addr-by-name). Use for: HA with single-node performance
- **Replication**: Master-replica — async replication (replica lag). Replica can serve read queries (scale reads). Chain replication (replica of replica) allowed

## Performance
- **Single-threaded** for command execution (networking + processing). Benefits: no locking overhead, atomic operations. Limits: one slow command blocks all others. Avoid: KEYS (use SCAN), HGETALL on huge hashes, LRANGE on long lists
- **I/O multiplexing**: Uses epoll/kqueue — handles 100K+ connections on single thread
- **Pipelining**: Send multiple commands without waiting for each response — ~10x throughput improvement
- **Memory optimization**: Use smaller keys (short names), hash data types for objects (not string-per-field), `MEMORY USAGE key` to check, set `maxmemory` + eviction policy

## Eviction Policies
- `noeviction`: Return errors on write when memory limit reached (default)
- `allkeys-lru`: Evict least recently used keys (most common — good for cache)
- `allkeys-lfu`: Evict least frequently used keys
- `volatile-lru`: Evict LRU among keys with TTL set (use when mix cache + persistent data)
- `volatile-ttl`: Evict shortest TTL first
- `allkeys-random`: Evict random keys — fair but unpredictable
- `volatile-random`: Evict random among keys with TTL
