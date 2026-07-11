# SQL Performance Tuning

## Overview
Database performance tuning involves optimizing queries, indexes, schema design, and configuration to achieve optimal response times and throughput.

## Query Analysis

### EXPLAIN Plans
```sql
-- PostgreSQL
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM users WHERE email = 'test@example.com';

-- MySQL
EXPLAIN FORMAT=JSON
SELECT * FROM users WHERE email = 'test@example.com';

-- SQL Server
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
SELECT * FROM users WHERE email = 'test@example.com';

-- Key things to look for:
-- Seq Scan / Table Scan          -> Missing index
-- Index Scan / Index Seek        -> Good (usually)
-- Nested Loop                    -> Small result sets
-- Hash Join                      -> Large unsorted joins
-- Merge Join                     -> Large sorted joins
-- Filter / Sort                  -> Missing index or ORDER BY
-- High "rows" vs "actual rows"   -> Statistics outdated
-- High cost                      -> Expensive operation
```

### Common Plan Issues
| Issue | Cause | Solution |
|-------|-------|----------|
| Sequential Scan | No usable index | Add index |
| Bitmap Heap Scan | Index not selective enough | Better index, more selective WHERE |
| Sort | ORDER BY without index | Add index on ORDER BY columns |
| Hash Join | Large unsorted join | Index join columns |
| Nested Loop (slow) | Large outer table | Better index, rewrite query |

## Indexing Strategy

### Index Types
```sql
-- B-Tree (default, most common)
CREATE INDEX idx_users_email ON users(email);

-- Hash (equality only, PostgreSQL)
CREATE INDEX idx_users_status ON users USING hash(status);

-- GiST (geometric, full-text, PostgreSQL)
CREATE INDEX idx_locations_geom ON locations USING gist(geom);

-- GIN (arrays, JSONB, full-text, PostgreSQL)
CREATE INDEX idx_users_tags ON users USING gin(tags);
CREATE INDEX idx_documents_content ON documents USING gin(to_tsvector('english', content));

-- BRIN (large tables, correlated data, PostgreSQL)
CREATE INDEX idx_logs_created ON logs USING brin(created_at);

-- Partial Index (filtered)
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- Covering Index (INCLUDE columns, PostgreSQL 11+)
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at) INCLUDE (total);

-- Expression Index
CREATE INDEX idx_users_lower_email ON users(lower(email));

-- Composite Index (column order matters!)
CREATE INDEX idx_orders_user_status_date ON orders(user_id, status, created_at);
```

### Index Design Rules
1. **Equality first, then range** - `WHERE a=1 AND b>2` → index `(a, b)`
2. **Cardinality matters** - High cardinality columns first
3. **Covering indexes** - Include SELECT columns to avoid heap fetch
4. **Partial indexes** - For skewed data (e.g., `WHERE status='active'`)
5. **Don't over-index** - Each index slows INSERT/UPDATE/DELETE

### Index Maintenance
```sql
-- PostgreSQL: Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;

-- Find unused indexes
SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexrelid NOT IN (SELECT indexrelid FROM pg_index WHERE indisprimary);

-- Index bloat
SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE pg_relation_size(indexrelid) > 100*1024*1024; -- >100MB

-- Reindex
REINDEX INDEX idx_name;
REINDEX TABLE table_name;

-- MySQL: Analyze table
ANALYZE TABLE users;

-- SQL Server: Rebuild
ALTER INDEX idx_name ON table_name REBUILD;
```

## Query Optimization

### Common Patterns

#### 1. Avoid SELECT *
```sql
-- Bad
SELECT * FROM users WHERE id = 1;

-- Good
SELECT id, name, email FROM users WHERE id = 1;
```

#### 2. Use LIMIT for Pagination
```sql
-- Bad (offset gets slower as page increases)
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 10000;

-- Good (keyset pagination)
SELECT * FROM posts WHERE created_at < '2024-01-15' ORDER BY created_at DESC LIMIT 20;
```

#### 3. EXISTS vs IN
```sql
-- IN (can be slow with large subqueries)
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 1000);

-- EXISTS (often faster, stops at first match)
SELECT * FROM users u WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total > 1000
);
```

#### 4. JOIN vs Subquery
```sql
-- Subquery (may materialize)
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);

-- JOIN (often better optimized)
SELECT DISTINCT u.* FROM users u JOIN orders o ON u.id = o.user_id;
```

#### 5. OR to UNION
```sql
-- OR (can't use index well)
SELECT * FROM users WHERE email = 'a@b.com' OR phone = '123';

-- UNION (can use separate indexes)
SELECT * FROM users WHERE email = 'a@b.com'
UNION
SELECT * FROM users WHERE phone = '123';
```

#### 6. Avoid Functions on Indexed Columns
```sql
-- Bad (can't use index on created_at)
SELECT * FROM orders WHERE DATE(created_at) = '2024-01-15';

-- Good (uses index)
SELECT * FROM orders WHERE created_at >= '2024-01-15' AND created_at < '2024-01-16';
```

#### 7. Use CTEs Wisely
```sql
-- Materialized CTE (PostgreSQL < 12, or explicitly)
WITH user_stats AS MATERIALIZED (
    SELECT user_id, COUNT(*) as cnt FROM orders GROUP BY user_id
)
SELECT * FROM users u JOIN user_stats s ON u.id = s.user_id;

-- Non-materialized (inline, PostgreSQL 12+)
WITH user_stats AS NOT MATERIALIZED (
    SELECT user_id, COUNT(*) as cnt FROM orders GROUP BY user_id
)
SELECT * FROM users u JOIN user_stats s ON u.id = s.user_id;
```

### Specific Optimizations

#### Pagination
```sql
-- Keyset pagination (fast, consistent)
-- First page
SELECT * FROM posts ORDER BY created_at DESC, id DESC LIMIT 20;

-- Subsequent pages (use last row's values)
SELECT * FROM posts 
WHERE (created_at, id) < ('2024-01-15 10:00:00', 12345)
ORDER BY created_at DESC, id DESC LIMIT 20;
```

#### Time-Series Queries
```sql
-- Partition by time (PostgreSQL)
CREATE TABLE metrics (
    time timestamptz NOT NULL,
    host_id int,
    cpu double precision
) PARTITION BY RANGE (time);

CREATE TABLE metrics_2024_01 PARTITION OF metrics
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Query only hits relevant partition
SELECT * FROM metrics WHERE time >= '2024-01-15' AND time < '2024-01-16';
```

#### JSON/JSONB Queries (PostgreSQL)
```sql
-- GIN index for JSONB
CREATE INDEX idx_data ON events USING gin(data);

-- Query
SELECT * FROM events WHERE data @> '{"type": "click"}';
SELECT * FROM events WHERE data->>'user_id' = '123';
```

## Database Configuration

### PostgreSQL (postgresql.conf)
```conf
# Memory
shared_buffers = 256MB          # 25% of RAM
effective_cache_size = 1GB      # 75% of RAM
work_mem = 16MB                 # Per operation (sort, hash)
maintenance_work_mem = 512MB    # For VACUUM, CREATE INDEX

# Parallelism
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
parallel_setup_cost = 1000
parallel_tuple_cost = 0.1

# Planner
random_page_cost = 1.1          # SSD
seq_page_cost = 1.0
cpu_tuple_cost = 0.01
cpu_index_tuple_cost = 0.005
cpu_operator_cost = 0.0025

# WAL
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9

# Statistics
default_statistics_target = 100
track_activities = on
track_counts = on
track_io_timing = on
track_functions = pl

# Logging
log_min_duration_statement = 1000  # Log slow queries >1s
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
```

### MySQL (my.cnf)
```ini
[mysqld]
# InnoDB
innodb_buffer_pool_size = 2G       # 70-80% of RAM
innodb_log_file_size = 512M
innodb_log_buffer_size = 64M
innodb_flush_log_at_trx_commit = 1
innodb_flush_method = O_DIRECT
innodb_file_per_table = 1

# Query Cache (deprecated in 8.0)
query_cache_type = 0
query_cache_size = 0

# Connections
max_connections = 200
thread_cache_size = 50

# Temp tables
tmp_table_size = 64M
max_heap_table_size = 64M

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1
log_queries_not_using_indexes = 1

# Optimizer
optimizer_switch = 'index_merge=on,index_merge_union=on,index_merge_sort_union=on,index_merge_intersection=on,engine_condition_pushdown=on'
```

## Monitoring & Diagnostics

### PostgreSQL Monitoring Queries
```sql
-- Active queries
SELECT pid, usename, application_name, client_addr, state, 
       now() - query_start as duration, query
FROM pg_stat_activity
WHERE state != 'idle' AND pid != pg_backend_pid()
ORDER BY query_start;

-- Blocking queries
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_query,
       blocking_activity.query AS blocking_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Table bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
       pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
       n_dead_tup, n_live_tup,
       round(n_dead_tup::numeric / nullif(n_live_tup,0) * 100, 2) as dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY dead_pct DESC;

-- Cache hit ratio
SELECT sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio
FROM pg_statio_user_tables;
```

### MySQL Monitoring
```sql
-- Process list
SHOW FULL PROCESSLIST;

-- InnoDB status
SHOW ENGINE INNODB STATUS\G

-- Table statistics
SHOW TABLE STATUS LIKE 'users'\G

-- Index usage
SELECT * FROM sys.schema_unused_indexes;

-- Slow queries
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
```

## Partitioning

### PostgreSQL Declarative Partitioning
```sql
-- Range partitioning
CREATE TABLE orders (
    id bigserial,
    user_id int,
    total numeric,
    created_at timestamptz NOT NULL
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2 PARTITION OF orders
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- List partitioning
CREATE TABLE users (
    id bigserial,
    country char(2),
    ...
) PARTITION BY LIST (country);

CREATE TABLE users_us PARTITION OF users FOR VALUES IN ('US');
CREATE TABLE users_eu PARTITION OF users FOR VALUES IN ('DE','FR','IT','ES');

-- Hash partitioning
CREATE TABLE sessions (
    id uuid,
    user_id int,
    data jsonb
) PARTITION BY HASH (id);

CREATE TABLE sessions_1 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE sessions_2 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 1);
```

### Partition Pruning
```sql
-- Good: partition key in WHERE
SELECT * FROM orders WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01';

-- Bad: function on partition key
SELECT * FROM orders WHERE DATE(created_at) = '2024-01-15';

-- Good: join on partition key
SELECT * FROM orders o JOIN users u ON o.user_id = u.id 
WHERE o.created_at >= '2024-01-01';
```

## Connection Pooling

### PgBouncer (PostgreSQL)
```ini
# pgbouncer.ini
[databases]
mydb = host=localhost port=5432 dbname=mydb

[pgbouncer]
pool_mode = transaction      # session, transaction, statement
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
max_db_connections = 100
max_user_connections = 100

# Authentication
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
stats_period = 60
```

### ProxySQL (MySQL)
```sql
-- Configure servers
INSERT INTO mysql_servers (hostgroup_id, hostname, port, max_replication_lag) 
VALUES (0, 'master', 3306, 0), (1, 'replica1', 3306, 10), (1, 'replica2', 3306, 10);

-- Query rules (read/write split)
INSERT INTO mysql_query_rules (rule_id, active, match_pattern, destination_hostgroup, apply) 
VALUES 
(1, 1, '^SELECT.*FOR UPDATE', 0, 1),
(2, 1, '^SELECT', 1, 1),
(3, 1, '^INSERT|^UPDATE|^DELETE|^REPLACE', 0, 1);

LOAD MYSQL VARIABLES TO RUNTIME;
SAVE MYSQL VARIABLES TO DISK;
```

## Tools

| Tool | Purpose |
|------|---------|
| **pg_stat_statements** | Query statistics (PostgreSQL) |
| **pgBadger** | Log analyzer |
| **pganalyze** | SaaS monitoring |
| **pgAdmin** | GUI administration |
| **DataGrip** | IDE |
| **EXPLAIN.depesz.com** | Visualize plans |
| **MySQL Workbench** | MySQL GUI |
| **pt-query-digest** | Analyze slow logs |
| **sys schema** | MySQL diagnostics |
| **pg_top / pg_activity** | Top-like monitoring |

## Resources
- [PostgreSQL Wiki - Performance Optimization](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Use The Index, Luke](https://use-the-index-luke.com/)
- [MySQL Performance Blog](https://www.percona.com/blog/)
- [PostgreSQL Documentation - Planner Statistics](https://www.postgresql.org/docs/current/planner-stats.html)
- [PGConf Talks](https://www.youtube.com/@PostgreSQLConferences)