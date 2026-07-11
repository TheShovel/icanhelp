# PostgreSQL Administration & Performance

## Installation & Setup

```bash
# Ubuntu/Debian
apt install postgresql-16 postgresql-client-16 postgresql-contrib-16

# RHEL/Fedora
dnf install postgresql16-server postgresql16-contrib
/usr/pgsql-16/bin/postgresql-16-setup initdb

# Arch
pacman -S postgresql
initdb -D /var/lib/postgres/data
```

## Configuration

### postgresql.conf - Memory

```conf
# Connection & Memory
max_connections = 200
superuser_reserved_connections = 3

# Shared Buffers (25-40% of RAM)
shared_buffers = 4GB

# Effective Cache Size (50-75% of RAM)
effective_cache_size = 12GB

# Work Memory (per operation, per connection)
work_mem = 64MB
maintenance_work_mem = 1GB

# Huge Pages
huge_pages = try

# Temp Buffers
temp_buffers = 64MB
```

### postgresql.conf - WAL & Checkpoint

```conf
# WAL
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB
wal_compression = on

# Checkpoint
checkpoint_timeout = 15min
max_wal_size = 4GB
min_wal_size = 1GB
checkpoint_completion_target = 0.9

# Archive
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'
```

### postgresql.conf - Query Planner

```conf
# Planner costs
random_page_cost = 1.1          # SSD
seq_page_cost = 1.0
cpu_tuple_cost = 0.01
cpu_index_tuple_cost = 0.005
cpu_operator_cost = 0.0025
effective_io_concurrency = 200  # NVMe

# Parallelism
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
parallel_leader_participation = on
parallel_setup_cost = 1000
parallel_tuple_cost = 0.1

# Statistics
default_statistics_target = 500
```

### postgresql.conf - Logging

```conf
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000  # Log slow queries > 1s
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0
log_statement = 'ddl'
```

### postgresql.conf - Autovacuum

```conf
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 30s
autovacuum_vacuum_threshold = 50
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_threshold = 50
autovacuum_analyze_scale_factor = 0.05
autovacuum_vacuum_cost_limit = 2000
autovacuum_vacuum_cost_delay = 2ms
autovacuum_freeze_max_age = 200000000
```

## Connection Pooling

### PgBouncer

```ini
# /etc/pgbouncer/pgbouncer.ini
[databases]
mydb = host=localhost port=5432 dbname=mydb

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 50
min_pool_size = 10
reserve_pool_size = 10
reserve_pool_timeout = 5
max_db_connections = 100
max_user_connections = 100

# Auth
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Logs
logfile = /var/log/pgbouncer/pgbouncer.log
pidfile = /var/run/pgbouncer/pgbouncer.pid
admin_users = postgres
stats_users = postgres
```

### PgPool-II

```conf
# /etc/pgpool2/pgpool.conf
backend_hostname0 = 'localhost'
backend_port0 = 5432
backend_weight0 = 1
backend_data_directory0 = '/var/lib/postgresql/16/main'
backend_flag0 = 'ALWAYS_PRIMARY'

enable_pool_hba = on
pool_mode = 'transaction'
num_init_children = 100
max_pool = 10
child_life_time = 3600
child_max_connections = 0
connection_life_time = 0
client_idle_limit = 0
```

## Monitoring & Maintenance

### Key Queries

```sql
-- Database sizes
SELECT pg_size_pretty(pg_database_size('mydb'));

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT 
    schemaname, tablename, indexname,
    idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;

-- Missing indexes
SELECT * FROM pg_stat_user_tables 
WHERE seq_scan > 1000 
AND idx_scan < seq_scan / 10;

-- Cache hit ratio
SELECT 
    'index hit rate' as name,
    (sum(idx_blks_hit)) / (sum(idx_blks_hit + idx_blks_read)) as ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT 
    'table hit rate',
    (sum(heap_blks_hit)) / (sum(heap_blks_hit + heap_blks_read))
FROM pg_statio_user_tables;

-- Long running queries
SELECT 
    pid, now() - pg_stat_activity.query_start as duration,
    query, state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
AND state != 'idle';

-- Locks
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
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
WHERE NOT blocked_locks.GRANTED;
```

### Vacuum & Analyze

```bash
# Manual vacuum
psql -c "VACUUM (ANALYZE, VERBOSE) mydb;"
psql -c "VACUUM FULL ANALYZE mydb;"  # Locks tables!

# Autovacuum monitoring
psql -c "SELECT * FROM pg_stat_progress_vacuum;"

# Freeze
psql -c "VACUUM FREEZE;"
```

### Reindex

```sql
-- Concurrent (no lock)
REINDEX CONCURRENTLY INDEX my_index;

-- Table
REINDEX TABLE my_table;

-- Database
REINDEX DATABASE mydb;
```

## Replication

### Streaming Replication

```conf
# Primary (postgresql.conf)
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB
hot_standby = on

# Standby (postgresql.conf)
hot_standby = on
primary_conninfo = 'host=primary port=5432 user=replicator password=secret'
promote_trigger_file = '/tmp/promote'

# pg_hba.conf (primary)
host replication replicator 192.168.1.0/24 md5
```

### Logical Replication

```sql
-- Publisher
CREATE PUBLICATION mypub FOR TABLE users, orders;

-- Subscriber
CREATE SUBSCRIPTION mysub
CONNECTION 'host=primary port=5432 dbname=mydb user=replicator password=secret'
PUBLICATION mypub;
```

## Backup & Restore

### pg_dump

```bash
# Single database (custom format)
pg_dump -Fc -Z 6 -j 4 -f mydb.dump mydb

# Schema only
pg_dump -s -f schema.sql mydb

# Data only
pg_dump -a -f data.sql mydb

# Specific tables
pg_dump -t users -t orders -f tables.dump mydb

# Globals (roles, tablespaces)
pg_dumpall -g -f globals.sql
```

### pg_restore

```bash
# Restore
pg_restore -j 4 -d mydb mydb.dump

# Clean + restore
pg_restore -c -j 4 -d mydb mydb.dump

# Specific table
pg_restore -t users -d mydb mydb.dump

# Schema only
pg_restore -s -d mydb mydb.dump
```

### pg_basebackup (Physical)

```bash
# Base backup
pg_basebackup -h localhost -D /backup/base -Ft -z -P -X stream

# With replication slot
pg_basebackup -h primary -D /backup/base -Ft -z -P -X stream --slot=backup_slot
```

### WAL Archiving

```bash
# Configure archive_command
archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'

# Or use pg_receivewal
pg_receivewal -h primary -D /archive/wal --slot=archive_slot --create-slot
```

## Performance Tuning

### Partitioning

```sql
-- Range partitioning
CREATE TABLE orders (
    id BIGSERIAL,
    created_at TIMESTAMPTZ NOT NULL,
    customer_id INT,
    total NUMERIC
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE orders_2024_q2 PARTITION OF orders
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- List partitioning
CREATE TABLE events (
    id BIGSERIAL,
    type VARCHAR(50),
    data JSONB
) PARTITION BY LIST (type);

CREATE TABLE events_user PARTITION OF events FOR VALUES IN ('login', 'logout');
CREATE TABLE events_order PARTITION OF events FOR VALUES IN ('order_created', 'order_cancelled');
```

### Partial Indexes

```sql
-- Only index active users
CREATE INDEX idx_users_active_email ON users(email) WHERE is_active = true;

-- Only recent orders
CREATE INDEX idx_orders_recent ON orders(created_at) WHERE created_at > NOW() - INTERVAL '6 months';
```

### Covering Indexes

```sql
-- Include columns to avoid heap lookup
CREATE INDEX idx_orders_customer_total ON orders(customer_id) INCLUDE (total, status);
```

### BRIN Indexes (for time-series)

```sql
-- Very small, for naturally ordered data
CREATE INDEX idx_events_time_brin ON events USING BRIN (created_at);
```

### Materialized Views

```sql
-- Refresh concurrently (no lock)
CREATE MATERIALIZED VIEW daily_sales AS
SELECT date(created_at) as day, sum(total) as revenue, count(*) as orders
FROM orders
GROUP BY 1;

REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales;
```

## Extensions

```sql
-- UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- pg_stat_statements (query stats)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- pg_cron (scheduled jobs)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- hypopg (hypothetical indexes)
CREATE EXTENSION IF NOT EXISTS hypopg;

-- pg_partman (partition management)
CREATE EXTENSION IF NOT EXISTS pg_partman;

-- pg_repack (online table reorganization)
CREATE EXTENSION IF NOT EXISTS pg_repack;
```

## Connection Limits & Pooling

```sql
-- Per-user limits
ALTER USER app_user CONNECTION LIMIT 50;

-- Per-database limits
ALTER DATABASE mydb CONNECTION LIMIT 200;

-- View active connections
SELECT * FROM pg_stat_activity WHERE datname = 'mydb';

-- Kill long queries
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'active' 
AND now() - query_start > interval '5 minutes'
AND pid != pg_backend_pid();
```

## Security

```sql
-- SSL
-- postgresql.conf: ssl = on
-- ssl_cert_file = 'server.crt'
-- ssl_key_file = 'server.key'

-- Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_policy ON orders
    USING (customer_id = current_setting('app.current_user_id')::int);

-- Column encryption
SELECT pgp_sym_encrypt('secret', 'key');

-- Audit
CREATE EXTENSION pgaudit;
```

## Troubleshooting

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| High CPU | `pg_stat_activity`, `EXPLAIN ANALYZE` | Add indexes, tune work_mem |
| High memory | `shared_buffers`, `work_mem` × connections | Reduce work_mem, use pooler |
| Slow queries | `log_min_duration_statement` | Analyze, add indexes, partition |
| Lock waits | `pg_locks`, `pg_stat_activity` | Shorter transactions, better ordering |
| Bloat | `pgstattuple`, `pg_freespacemap` | VACUUM FULL, pg_repack |
| Replication lag | `pg_stat_replication` | Check network, increase wal_sender_timeout |
| Checkpoint spikes | `checkpoint_completion_target` | Increase max_wal_size, spread checkpoints |

## Upgrading

```bash
# pg_upgrade (in-place)
# 1. Install new version
# 2. initdb new cluster
# 3. pg_upgrade -b old_bin -B new_bin -d old_data -D new_data
# 4. Swap ports, start new

# pg_dump/pg_restore (logical)
pg_dumpall -U postgres > dump.sql
# Stop old, start new
psql -U postgres -f dump.sql
```

## Key Metrics to Alert On

| Metric | Warning | Critical |
|--------|---------|----------|
| Connections used | > 80% | > 95% |
| Cache hit ratio | < 99% | < 95% |
| Replication lag | > 1s | > 10s |
| Long transactions | > 5 min | > 30 min |
| Deadlocks/min | > 1 | > 10 |
| Sequential scans | > 10/sec | > 100/sec |
| Temp files | > 100MB | > 1GB |
| Autovacuum lag | > 10k dead tuples | > 100k dead tuples |