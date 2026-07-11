# Redis Operations & Performance

## Installation

```bash
# Ubuntu/Debian
apt install redis-server

# RHEL/Fedora
dnf install redis

# From source (latest)
wget http://download.redis.io/redis-stable.tar.gz
tar xzf redis-stable.tar.gz
cd redis-stable && make && make install
```

## Configuration

### redis.conf - Memory

```conf
# Memory limit
maxmemory 4gb
maxmemory-policy allkeys-lru

# Memory allocation
maxmemory-samples 5
```

### redis.conf - Persistence

```conf
# RDB Snapshots
save 900 1      # 1 change in 15 min
save 300 10     # 10 changes in 5 min
save 60 10000   # 10000 changes in 1 min

stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# AOF (Append Only File)
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec  # always, everysec, no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes
```

### redis.conf - Network

```conf
bind 127.0.0.1 ::1
port 6379
timeout 0
tcp-keepalive 300
maxclients 10000
tcp-backlog 511
```

### redis.conf - Security

```conf
requirepass yourpassword
# rename-command FLUSHDB ""
# rename-command FLUSHALL ""
# rename-command CONFIG ""
# rename-command EVAL ""
```

### redis.conf - Replication

```conf
# Replica
replicaof 192.168.1.10 6379
masterauth masterpassword
replica-serve-stale-data yes
replica-read-only yes
repl-diskless-sync yes
repl-diskless-sync-delay 5
repl-disable-tcp-nodelay no
```

### redis.conf - Performance

```conf
# Lua
lua-time-limit 5000

# Slow log
slowlog-log-slower-than 10000  # microseconds
slowlog-max-len 128

# Latency monitoring
latency-monitor-threshold 100  # milliseconds

# Active defragmentation
activedefrag yes
active-defrag-ignore-bytes 100mb
active-defrag-threshold-lower 10
active-defrag-threshold-upper 100
```

## Data Structures

### Strings

```bash
SET key value
GET key
MSET key1 val1 key2 val2
MGET key1 key2
SETEX key 60 value
SETNX key value
INCR key
INCRBY key 10
APPEND key "suffix"
STRLEN key
GETRANGE key 0 5
SETRANGE key 3 "over"
```

### Hashes

```bash
HSET user:1 name "John" email "john@example.com" age 30
HGET user:1 name
HMGET user:1 name email
HGETALL user:1
HKEYS user:1
HVALS user:1
HLEN user:1
HEXISTS user:1 name
HDEL user:1 age
HINCRBY user:1 age 1
```

### Lists

```bash
LPUSH mylist "world"
LPUSH mylist "hello"
RPUSH mylist "again"
LRANGE mylist 0 -1
LPOP mylist
RPOP mylist
LLEN mylist
LINDEX mylist 1
LSET mylist 0 "new"
LTRIM mylist 0 2
```

### Sets

```bash
SADD myset "a" "b" "c"
SREM myset "a"
SMEMBERS myset
SISMEMBER myset "b"
SCARD myset
SINTER set1 set2
SUNION set1 set2
SDIFF set1 set2
SPOP myset
SRANDMEMBER myset 2
```

### Sorted Sets

```bash
ZADD leaderboard 100 "player1"
ZADD leaderboard 200 "player2"
ZRANGE leaderboard 0 -1 WITHSCORES
ZREVRANGE leaderboard 0 -1 WITHSCORES
ZRANK leaderboard "player1"
ZSCORE leaderboard "player1"
ZINCRBY leaderboard 50 "player1"
ZREM leaderboard "player1"
ZCOUNT leaderboard 100 200
```

### Streams (Redis 5+)

```bash
XADD mystream * name "John" message "Hello"
XADD mystream MAXLEN 1000 * name "Jane" message "Hi"
XREAD COUNT 2 STREAMS mystream 0
XREAD BLOCK 5000 STREAMS mystream $
XRANGE mystream - +
XLEN mystream

# Consumer groups
XGROUP CREATE mystream mygroup 0
XREADGROUP GROUP mygroup consumer1 COUNT 2 STREAMS mystream >
XACK mystream mygroup 1234567890-0
XPENDING mystream mygroup
```

## Redis Cluster

```bash
# Create cluster (6 nodes, 3 masters + 3 replicas)
redis-cli --cluster create \
  192.168.1.10:7000 192.168.1.11:7000 192.168.1.12:7000 \
  192.168.1.13:7000 192.168.1.14:7000 192.168.1.15:7000 \
  --cluster-replicas 1

# Check cluster
redis-cli -c -h 192.168.1.10 -p 7000 CLUSTER INFO
redis-cli -c -h 192.168.1.10 -p 7000 CLUSTER NODES
redis-cli -c -h 192.168.1.10 -p 7000 CLUSTER SLOTS

# Reshard
redis-cli --cluster reshard 192.168.1.10:7000 \
  --cluster-from <node-id> --cluster-to <node-id> --cluster-slots 1000

# Add node
redis-cli --cluster add-node 192.168.1.16:7000 192.168.1.10:7000
redis-cli --cluster add-node 192.168.1.17:7000 192.168.1.10:7000 --cluster-slave --cluster-master <master-id>

# Remove node
redis-cli --cluster del-node 192.168.1.10:7000 <node-id>
```

## Sentinel (HA)

```conf
# sentinel.conf
port 26379
sentinel monitor mymaster 192.168.1.10 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
sentinel parallel-syncs mymaster 1
sentinel auth-pass mymaster yourpassword
```

```bash
# Start sentinel
redis-sentinel /etc/redis/sentinel.conf

# Query
redis-cli -p 26379 SENTINEL MASTER mymaster
redis-cli -p 26379 SENTINEL REPLICAS mymaster
redis-cli -p 26379 SENTINEL GET-MASTER-ADDR-BY-NAME mymaster
```

## Lua Scripting

```lua
-- Atomic operations
-- KEYS[1] = key, ARGV[1] = value

-- Set if not exists with TTL
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'EX', ARGV[2]) then
    return 1
else
    return 0
end

-- Rate limiting (sliding window)
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = redis.call('TIME')
local current = now[1] * 1000000 + now[2]
local start = current - window * 1000000
redis.call('ZREMRANGEBYSCORE', key, '-inf', start)
local count = redis.call('ZCARD', key)
if count < limit then
    redis.call('ZADD', key, current, current .. '-' .. math.random())
    redis.call('EXPIRE', key, window + 1)
    return {1, limit - count - 1}
else
    return {0, limit - count}
end
```

```bash
# Load script
SCRIPT LOAD "script_content"
EVALSHA <sha1> 1 key 10 60

# Redis 7+ functions
FUNCTION LOAD "library_name" "code"
FCALL library_name.fn 1 key arg1 arg2
```

## Monitoring

```bash
# INFO sections
INFO memory
INFO stats
INFO replication
INFO cpu
INFO commandstats
INFO keyspace

# Memory analysis
MEMORY USAGE key
MEMORY STATS
MEMORY DOCTOR

# Slow log
SLOWLOG GET 10
SLOWLOG LEN
SLOWLOG RESET

# Latency
LATENCY LATEST
LATENCY HISTORY command
LATENCY RESET

# Client list
CLIENT LIST
CLIENT KILL TYPE normal SKIP ME

# Keyspace stats
redis-cli --bigkeys
redis-cli --hotkeys
redis-cli --memkeys
```

## Performance Tuning

### Pipeline & MGET

```bash
# Pipeline (batch commands)
redis-cli --pipe < commands.txt

# MGET instead of multiple GET
MGET key1 key2 key3 key4 key5

# Lua for complex atomic ops
```

### Connection Pooling

```python
# Python redis-py
pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    max_connections=50,
    decode_responses=True
)
r = redis.Redis(connection_pool=pool)

# With retry
from redis.retry import Retry
from redis.backoff import ExponentialBackoff

retry = Retry(ExponentialBackoff(), 3)
r = redis.Redis(retry=retry, retry_on_timeout=True)
```

### Key Design

```bash
# Good: short keys with prefixes
user:1000:profile
user:1000:orders
session:abc123
cache:product:5000

# Bad: long keys
"user_profile_for_user_id_1000_v2"
```

### Memory Optimization

```bash
# Use hashes for small objects (encoded as ziplist)
HSET user:1000 name "John" email "john@example.com"

# Use INTSET for small integer sets
SADD tags 1 2 3 4 5

# Compress large values
SET large_data "<compressed_json>"

# TTL for temporary data
EXPIRE key 3600
EXPIREAT key 1705315200
```

## Backup & Restore

```bash
# RDB copy (while running)
cp /var/lib/redis/dump.rdb /backup/dump-$(date +%F).rdb

# BGSAVE (async)
redis-cli BGSAVE
redis-cli LASTSAVE

# SAVE (blocking - avoid)
redis-cli SAVE

# AOF rewrite
redis-cli BGREWRITEAOF

# Restore
redis-cli -r /backup/dump.rdb
# Or copy to data dir and restart
```

## Redis Modules

```bash
# RedisJSON
redis-server --loadmodule /path/to/rejson.so

# RedisSearch
redis-server --loadmodule /path/to/redisearch.so

# RedisGraph
redis-server --loadmodule /path/to/redisgraph.so

# RedisTimeSeries
redis-server --loadmodule /path/to/redistimeseries.so

# RedisBloom
redis-server --loadmodule /path/to/redisbloom.so
```

## Troubleshooting

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| OOM | `INFO memory`, `maxmemory` | Increase limit, change policy, expire keys |
| High CPU | `INFO commandstats`, slowlog | Optimize queries, add indexes |
| High latency | `LATENCY DOCTOR`, slowlog | Pipeline, reduce payload, check persistence |
| Memory fragmentation | `MEMORY STATS` | Active defrag, restart |
| Replication lag | `INFO replication` | Network, disk I/O, replica priority |
| Connection refused | `maxclients`, firewall | Increase limit, check bind |
| Keyspace misses | `INFO stats` | Check TTL, add cache warming |

## Security Checklist

- [ ] Bind to localhost or specific IP
- [ ] Set strong password (`requirepass`)
- [ ] Rename dangerous commands (`FLUSHALL`, `CONFIG`, `EVAL`)
- [ ] Disable protected mode if not needed
- [ ] Use TLS (Redis 6+)
- [ ] Run as non-root user
- [ ] Limit network exposure
- [ ] Regular key rotation
- [ ] Audit access logs

## TLS (Redis 6+)

```conf
# redis.conf
tls-port 6380
port 0
tls-cert-file /etc/redis/certs/redis.crt
tls-key-file /etc/redis/certs/redis.key
tls-ca-cert-file /etc/redis/certs/ca.crt
tls-auth-clients yes
tls-replication yes
```

```bash
# Client
redis-cli --tls --cacert /etc/redis/certs/ca.crt --cert /etc/redis/certs/client.crt --key /etc/redis/certs/client.key
```

## Benchmarking

```bash
# redis-benchmark
redis-benchmark -h localhost -p 6379 -n 100000 -c 50 -t SET,GET -d 100

# Pipeline benchmark
redis-benchmark -h localhost -p 6379 -n 100000 -c 50 -P 10 -t SET,GET

# Custom Lua
redis-benchmark -h localhost -p 6379 -n 100000 -c 50 -r 100000 \
  -l 'eval "return redis.call(\"SET\",KEYS[1],ARGV[1])" 1 key value'
```

## Patterns

### Distributed Lock

```lua
-- Lock
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
    return 1
else
    return 0
end

-- Unlock (only if owner)
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
else
    return 0
end
```

### Rate Limiter

```bash
# Sliding window (via Lua)
# Or use RedisCell module
CL.THROTTLE user:1000 15 30 60 1
```

### Session Store

```bash
# Session with TTL
SET session:abc123 '{"user_id":1000,"roles":["admin"]}' EX 86400

# Get
GET session:abc123

# Extend
EXPIRE session:abc123 86400
```

### Cache Invalidation

```bash
# Tags pattern
SADD cache:tags:user:1000 product:500 product:501
# Invalidate
SMEMBERS cache:tags:user:1000 | xargs redis-cli DEL
```

## Redis 7 Features

- Functions (replaces scripts, persistent)
- ACL improvements
- RESP3 protocol
- Cluster sharding improvements
- Lua 5.4
- ACL LOG
- Client tracking (caching)