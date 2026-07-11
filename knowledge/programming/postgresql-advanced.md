# PostgreSQL Advanced Features

## Overview
PostgreSQL is an advanced open-source relational database with powerful features for complex applications, analytics, and scaling.

## Advanced Data Types

### JSON/JSONB
```sql
-- JSONB (binary, indexed, preferred)
CREATE TABLE events (
    id serial PRIMARY KEY,
    data jsonb NOT NULL
);

-- Insert
INSERT INTO events (data) VALUES 
('{"user": "john", "action": "login", "metadata": {"ip": "1.2.3.4", "device": "mobile"}}');

-- Query
SELECT data->>'user' as username FROM events WHERE data->>'action' = 'login';
SELECT data->'metadata'->>'ip' as ip FROM events;

-- Indexing (GIN)
CREATE INDEX idx_events_data ON events USING GIN (data);

-- JSONB functions
SELECT jsonb_object_keys(data) FROM events;
SELECT jsonb_each_text(data) FROM events;
SELECT data || '{"new": "field"}' FROM events;  -- merge
SELECT data - 'action' FROM events;  -- delete key
```

### Arrays
```sql
CREATE TABLE products (
    id serial PRIMARY KEY,
    name text,
    tags text[],
    prices numeric[]
);

INSERT INTO products (name, tags, prices) VALUES 
('Widget', ARRAY['sale', 'popular', 'electronics'], ARRAY[19.99, 24.99, 29.99]);

-- Query
SELECT * FROM products WHERE 'sale' = ANY(tags);
SELECT * FROM products WHERE tags @> ARRAY['sale'];
SELECT tags[1], tags[2:3] FROM products;  -- slicing (1-indexed)
SELECT array_length(tags, 1) FROM products;

-- Unnest
SELECT name, unnest(tags) as tag FROM products;

-- Array functions
array_append(tags, 'new_tag')
array_remove(tags, 'sale')
array_cat(tags, ARRAY['extra'])
```

### Range Types
```sql
-- Built-in: int4range, int8range, numrange, tsrange, tstzrange, daterange
CREATE TABLE reservations (
    room_id int,
    during tsrange,
    EXCLUDE USING GIST (room_id WITH =, during WITH &&)
);

INSERT INTO reservations VALUES (1, '[2024-01-15 14:00, 2024-01-15 16:00)');

-- Query overlaps
SELECT * FROM reservations WHERE during && '[2024-01-15 15:00, 2024-01-15 17:00)';
```

### Hstore (Key-Value)
```sql
CREATE EXTENSION hstore;

CREATE TABLE settings (
    user_id int PRIMARY KEY,
    data hstore
);

INSERT INTO settings VALUES (1, 'theme=>dark, lang=>en, notifications=>on');

SELECT data->'theme' FROM settings WHERE user_id = 1;
SELECT * FROM settings WHERE data ? 'lang';  -- has key
SELECT * FROM settings WHERE data @> 'lang=>en';  -- contains pair
```

### UUID
```sql
CREATE EXTENSION "uuid-ossp";

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE
);
```

## Partitioning

### Declarative Partitioning (PG 10+)
```sql
-- Range partitioning by date
CREATE TABLE measurements (
    id bigserial,
    sensor_id int,
    logged_at timestamptz NOT NULL,
    value numeric
) PARTITION BY RANGE (logged_at);

CREATE TABLE measurements_2024_q1 PARTITION OF measurements
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE measurements_2024_q2 PARTITION OF measurements
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- List partitioning
CREATE TABLE users (
    id bigserial,
    country_code char(2),
    ...
) PARTITION BY LIST (country_code);

CREATE TABLE users_us PARTITION OF users FOR VALUES IN ('US');
CREATE TABLE users_eu PARTITION OF users FOR VALUES IN ('DE','FR','IT','ES');
CREATE TABLE users_other PARTITION OF users DEFAULT;

-- Hash partitioning
CREATE TABLE events (
    id bigserial,
    user_id bigint,
    ...
) PARTITION BY HASH (user_id);

CREATE TABLE events_1 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE events_2 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 1);
```

### Partition Maintenance
```sql
-- Attach/detach partitions
ALTER TABLE measurements DETACH PARTITION measurements_2023_q1;
ALTER TABLE measurements ATTACH PARTITION measurements_2023_q1
    FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

-- Partition pruning (automatic in queries)
EXPLAIN SELECT * FROM measurements WHERE logged_at > '2024-06-01';
-- Only scans relevant partitions
```

## Advanced Indexing

### Partial Indexes
```sql
-- Only index active users
CREATE INDEX idx_users_active_email ON users(email) WHERE active = true;

-- Only index recent orders
CREATE INDEX idx_orders_recent ON orders(created_at) 
WHERE created_at > NOW() - INTERVAL '6 months';
```

### Expression Indexes
```sql
-- Case-insensitive search
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- JSONB path
CREATE INDEX idx_events_user ON events((data->>'user'));

-- Function result
CREATE INDEX idx_full_name ON users((first_name || ' ' || last_name));
```

### BRIN Indexes (Block Range INdex)
```sql
-- For large, naturally ordered tables (time-series, append-only)
CREATE INDEX idx_measurements_time_brin ON measurements USING BRIN (logged_at);

-- pages_per_range (default 128)
CREATE INDEX idx_brin_custom ON measurements USING BRIN (logged_at) 
WITH (pages_per_range = 32);
```

### Covering Indexes (INCLUDE)
```sql
-- Index-only scans for additional columns
CREATE INDEX idx_orders_user_status ON orders(user_id, status) INCLUDE (total, created_at);

-- Query can be satisfied from index without heap fetch
SELECT total, created_at FROM orders WHERE user_id = 123 AND status = 'shipped';
```

### GIN/GiST for Special Types
```sql
-- Full-text search
CREATE INDEX idx_documents_fts ON documents USING GIN (to_tsvector('english', content));

-- JSONB
CREATE INDEX idx_data_gin ON events USING GIN (data);

-- Array
CREATE INDEX idx_products_tags ON products USING GIN (tags);

-- PostGIS geometry
CREATE INDEX idx_locations_geo ON locations USING GIST (geom);
```

## Concurrency & Locking

### Lock Modes
```sql
-- Explicit locking
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;           -- Row lock
SELECT * FROM accounts WHERE id = 1 FOR NO KEY UPDATE;    -- Weaker
SELECT * FROM accounts WHERE id = 1 FOR SHARE;            -- Shared
SELECT * FROM accounts WHERE id = 1 FOR KEY SHARE;        -- Weakest

-- NOWAIT / SKIP LOCKED
SELECT * FROM queue WHERE status = 'pending' FOR UPDATE SKIP LOCKED;
-- Returns only unlocked rows (great for job queues)
```

### Advisory Locks (Application-Level)
```sql
-- Session-level (released on disconnect)
SELECT pg_advisory_lock(12345);
SELECT pg_advisory_unlock(12345);

-- Transaction-level (released on commit/rollback)
SELECT pg_advisory_xact_lock(12345);

-- Try lock (non-blocking)
SELECT pg_try_advisory_lock(12345);  -- returns boolean

-- Use case: distributed mutex, schema migrations, leader election
```

### Deadlock Detection
```sql
-- View locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Cancel blocking query
SELECT pg_cancel_backend(pid);

-- Terminate session
SELECT pg_terminate_backend(pid);

-- Deadlock timeout (default 1s)
SET deadlock_timeout = '5s';
```

## Performance Tuning

### Configuration (postgresql.conf)
```conf
# Memory
shared_buffers = 256MB          # 25% RAM
effective_cache_size = 1GB      # 75% RAM
work_mem = 16MB                 # Per operation (sort/hash)
maintenance_work_mem = 512MB    # VACUUM, CREATE INDEX
huge_pages = try                # Reduce page table overhead

# Parallelism
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
parallel_tuple_cost = 0.1
parallel_setup_cost = 1000.0

# WAL
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9
wal_writer_delay = 10ms

# Planner
random_page_cost = 1.1          # SSD
seq_page_cost = 1.0
cpu_tuple_cost = 0.01
cpu_index_tuple_cost = 0.005
cpu_operator_cost = 0.0025
effective_io_concurrency = 200  # SSD

# Statistics
default_statistics_target = 100
track_activities = on
track_counts = on
track_io_timing = on
track_functions = pl

# Logging
log_min_duration_statement = 1000  # Log slow queries >1s
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
```

### Vacuum & Analyze
```sql
-- Manual vacuum (run during low traffic)
VACUUM (VERBOSE, ANALYZE) users;
VACUUM FULL users;  -- Rewrites table, exclusive lock

-- Autovacuum tuning (per table)
ALTER TABLE large_table SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02,
    autovacuum_vacuum_cost_limit = 1000,
    autovacuum_vacuum_cost_delay = 10ms
);

-- Monitor
SELECT * FROM pg_stat_user_tables WHERE n_dead_tup > 1000;
SELECT relname, last_vacuum, last_autovacuum, last_analyze, last_autoanalyze 
FROM pg_stat_user_tables;
```

### Query Analysis
```sql
-- EXPLAIN ANALYZE
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT * FROM orders WHERE user_id = 123 AND status = 'shipped';

-- Key things to look for:
-- - Seq Scan on large table → missing index
-- - High "rows removed by filter" → partial index needed
-- - Nested Loop with high rows → consider Hash Join
-- - Sort spilling to disk → increase work_mem
-- - Buffers: shared hit vs read (cache efficiency)

-- pg_stat_statements (enable extension)
SELECT query, calls, total_time, mean_time, rows 
FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 20;
```

## Replication & High Availability

### Streaming Replication
```conf
# Primary (postgresql.conf)
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB
hot_standby = on

# Standby (postgresql.auto.conf or recovery.signal)
primary_conninfo = 'host=primary port=5432 user=repl password=xxx'
restore_command = 'cp /archive/%f %p'
```

### Logical Replication (PG 10+)
```sql
-- Publisher
CREATE PUBLICATION mypub FOR TABLE users, orders;

-- Subscriber
CREATE SUBSCRIPTION mysub 
CONNECTION 'host=primary port=5432 dbname=main user=repl password=xxx'
PUBLICATION mypub;

-- Selective replication
CREATE PUBLICATION pub_users FOR TABLE users 
WITH (publish = 'insert,update');
```

### Failover Tools
- **Patroni** - HA with etcd/consul
- **repmgr** - PostgreSQL replication manager
- **pg_auto_failover** - Automated failover
- **PgBouncer** - Connection pooling (required for HA)

## Extensions

### Essential Extensions
```sql
-- UUID generation
CREATE EXTENSION "uuid-ossp";
CREATE EXTENSION pgcrypto;  -- gen_random_uuid()

-- Full-text search
CREATE EXTENSION pg_trgm;  -- Trigram similarity
CREATE EXTENSION fuzzystrmatch;  -- Levenshtein, etc.

-- JSONB helpers
CREATE EXTENSION jsonb_plpython3u;  -- Python in JSONB

-- Time-series
CREATE EXTENSION timescaledb;  -- Automatic partitioning, compression

-- Analytics
CREATE EXTENSION cstore_fdw;  -- Columnar store (foreign data wrapper)
CREATE EXTENSION hypopg;  -- Hypothetical indexes

-- Monitoring
CREATE EXTENSION pg_stat_statements;
CREATE EXTENSION pg_stat_kcache;  -- Per-query cache stats
CREATE EXTENSION pg_wait_sampling;  -- Wait event profiling

-- Foreign data wrappers
CREATE EXTENSION postgres_fdw;  -- Query remote Postgres
CREATE EXTENSION file_fdw;      -- Query CSV files
CREATE EXTENSION mysql_fdw;     -- Query MySQL
```

### PostGIS (Geospatial)
```sql
CREATE EXTENSION postgis;

CREATE TABLE locations (
    id serial PRIMARY KEY,
    name text,
    geom geography(POINT, 4326)
);

INSERT INTO locations (name, geom) VALUES 
('NYC', ST_MakePoint(-74.0060, 40.7128)),
('LA', ST_MakePoint(-118.2437, 34.0522));

-- Distance query
SELECT name, ST_Distance(geom, ST_MakePoint(-73.9857, 40.7484)) as dist_m
FROM locations 
ORDER BY geom <-> ST_MakePoint(-73.9857, 40.7484)
LIMIT 5;

-- Index
CREATE INDEX idx_locations_geo ON locations USING GIST (geom);
```

## Security

### Row Level Security (RLS)
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: users see only their orders
CREATE POLICY user_orders ON orders
    FOR ALL TO app_user
    USING (user_id = current_setting('app.current_user_id')::int);

-- Set session variable
SET app.current_user_id = '123';
SELECT * FROM orders;  -- Automatically filtered
```

### Column-Level Encryption
```sql
CREATE EXTENSION pgcrypto;

-- Encrypt
UPDATE users SET ssn_encrypted = pgp_sym_encrypt(ssn, 'secret_key');

-- Decrypt
SELECT pgp_sym_decrypt(ssn_encrypted, 'secret_key') FROM users;
```

### Auditing
```sql
CREATE EXTENSION pgaudit;

-- Config
pgaudit.log = 'ddl, write'
pgaudit.log_level = notice
pgaudit.log_parameter = on
```

## Backup & Recovery

### pg_dump / pg_restore
```bash
# Custom format (parallel, compressed)
pg_dump -Fc -j 4 -Z 6 -f backup.dump dbname

# Restore
pg_restore -j 4 -d dbname backup.dump

# Schema only
pg_dump -s -f schema.sql dbname

# Data only
pg_dump -a -t tablename -f data.sql dbname
```

### Point-in-Time Recovery (PITR)
```bash
# Base backup
pg_basebackup -D /backup/base -Ft -z -P -R

# WAL archiving (postgresql.conf)
archive_mode = on
archive_command = 'cp %p /archive/%f'

# Recovery (recovery.signal + restore_command)
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2024-01-15 10:30:00'
```

### Logical Backup (pg_dump) vs Physical (pg_basebackup)
| Aspect | pg_dump | pg_basebackup |
|--------|---------|---------------|
| Consistency | MVCC snapshot | Physical files |
| Parallelism | -j jobs | Single stream |
| Selective | Tables/schemas | Whole cluster |
| Restore time | Slow (replay SQL) | Fast (file copy) |
| PITR | No | Yes |
| Cross-version | Yes | Same major version |

## Monitoring Queries

### Health Checks
```sql
-- Connections
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

-- Long-running queries
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' AND now() - query_start > INTERVAL '30s';

-- Blocking
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.query AS blocked_query,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.query AS blocking_query
FROM pg_locks blocked_locks
JOIN pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_locks blocking_locks 
  ON blocking_locks.locktype = blocked_locks.locktype
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
JOIN pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Table bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
       n_dead_tup, n_live_tup
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname NOT IN ('pg_catalog', 'information_schema');
```

## Common Patterns

### Upsert (INSERT ... ON CONFLICT)
```sql
INSERT INTO users (email, name, last_login) 
VALUES ('john@example.com', 'John', NOW())
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    last_login = EXCLUDED.last_login,
    updated_at = NOW()
RETURNING id;
```

### Window Functions
```sql
-- Running total
SELECT date, amount,
       SUM(amount) OVER (ORDER BY date) as running_total
FROM transactions;

-- Rank within partition
SELECT user_id, amount,
       ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY amount DESC) as rank
FROM orders;

-- Lag/Lead
SELECT date, value,
       LAG(value) OVER (ORDER BY date) as prev_value,
       LEAD(value) OVER (ORDER BY date) as next_value
FROM metrics;
```

### CTEs (Common Table Expressions)
```sql
WITH RECURSIVE category_tree AS (
    -- Base case
    SELECT id, name, parent_id, 1 as level
    FROM categories WHERE parent_id IS NULL
    UNION ALL
    -- Recursive case
    SELECT c.id, c.name, c.parent_id, ct.level + 1
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY level, name;
```

### Materialized Views
```sql
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT date_trunc('month', created_at) as month,
       SUM(total) as revenue,
       COUNT(*) as orders
FROM orders
GROUP BY 1;

-- Refresh (concurrently in PG 9.4+)
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;

-- Auto-refresh trigger
CREATE FUNCTION refresh_monthly_sales() RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## Resources
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PG Conf Talks](https://www.youtube.com/@PostgreSQLConf)
- [PostgreSQL Wiki](https://wiki.postgresql.org/)
- [PG Stats](https://pgstats.dev/)
- [Use The Index, Luke](https://use-the-index-luke.com/) (PostgreSQL section)