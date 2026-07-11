# Database Indexing & Query Optimization

## Index Types

### B-Tree (Default)
```sql
CREATE INDEX idx_users_email ON users(email);
-- Best for: =, >, <, >=, <=, BETWEEN, LIKE 'prefix%', ORDER BY
-- Supports: UNIQUE, PRIMARY KEY
```

### Hash Index
```sql
CREATE INDEX idx_users_email_hash ON users USING HASH (email);
-- Best for: = only
-- Not WAL-logged (not crash-safe in older PG), no ORDER BY
```

### GiST / GIN (PostgreSQL)
```sql
-- GIN: Generalized Inverted Index (array, jsonb, full-text)
CREATE INDEX idx_docs_content ON documents USING GIN (content_tsvector);
CREATE INDEX idx_tags ON posts USING GIN (tags);  -- array column

-- GiST: Generalized Search Tree (geometric, range)
CREATE INDEX idx_loc ON places USING GIST (location);
```

### BRIN (Block Range Index)
```sql
-- For very large tables with correlated data (timestamps, sequences)
CREATE INDEX idx_logs_created ON logs USING BRIN (created_at);
-- Small index size, good for time-series, append-only tables
```

### Partial Index
```sql
-- Index only active users
CREATE INDEX idx_users_active_email ON users(email) WHERE active = true;

-- Index only recent orders
CREATE INDEX idx_orders_recent ON orders(created_at) WHERE created_at > '2024-01-01';
```

### Covering Index (INCLUDE)
```sql
-- Index-only scan: all columns in index, no heap fetch
CREATE INDEX idx_orders_user_status ON orders(user_id, status) INCLUDE (total, created_at);

-- Query uses index only:
SELECT total, created_at FROM orders WHERE user_id = 1 AND status = 'paid';
```

### Expression Index
```sql
-- Index on function result
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
-- Query: SELECT * FROM users WHERE LOWER(email) = 'test@example.com';
```

## Index Design Principles

### Column Order (Composite Indexes)
```sql
-- Equality first, then range
CREATE INDEX idx_orders_user_status_date ON orders(user_id, status, created_at);

-- Good for:
-- WHERE user_id = 1 AND status = 'paid'
-- WHERE user_id = 1 AND status = 'paid' AND created_at > '2024-01-01'
-- ORDER BY created_at WHERE user_id = 1 AND status = 'paid'

-- Bad for:
-- WHERE status = 'paid'           -- user_id not in condition
-- WHERE created_at > '2024-01-01' -- leading columns missing
```

### Selectivity
```sql
-- High selectivity (unique-ish): good index candidates
-- email, uuid, id, social_security

-- Low selectivity (boolean, status): poor standalone, good in composite
-- active, status, gender, is_deleted

-- Check selectivity:
SELECT COUNT(DISTINCT column) * 1.0 / COUNT(*) FROM table;
-- > 0.1 = good, > 0.01 = okay, < 0.01 = poor
```

## Query Analysis (PostgreSQL)

### EXPLAIN ANALYZE
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders WHERE user_id = 1 AND status = 'paid';

-- Key output:
-- Seq Scan                    -- Full table scan (bad for large tables)
-- Index Scan                  -- Index lookup + heap fetch
-- Index Only Scan             -- Index only, no heap fetch (best)
-- Bitmap Index Scan           -- Multiple indexes combined
-- Bitmap Heap Scan            -- Bitmap index + heap fetch
-- Nested Loop                 -- Join: outer loop + inner index scan
-- Hash Join                   -- Join: build hash table + probe
-- Merge Join                  -- Join: sorted inputs merged
```

### Reading Plans
```
Seq Scan on orders  (cost=0.00..1000.00 rows=1 width=200)
  Filter: (user_id = 1 AND status = 'paid')
  Rows Removed by Filter: 999999

Index Scan using idx_orders_user on orders  (cost=0.29..8.31 rows=1 width=200)
  Index Cond: (user_id = 1)
  Filter: (status = 'paid')

Index Only Scan using idx_orders_user_status on orders  (cost=0.29..4.31 rows=1 width=200)
  Index Cond: (user_id = 1 AND status = 'paid')
  Heap Fetches: 0
```

### Cost Parameters
```sql
-- Show current settings
SHOW ALL;
-- Key params:
seq_page_cost = 1.0        -- Sequential page read
random_page_cost = 4.0     -- Random page read (SSD: 1.1, HDD: 4.0)
cpu_tuple_cost = 0.01      -- CPU per tuple
cpu_index_tuple_cost = 0.005
effective_cache_size = 4GB -- Planner's estimate of OS cache
work_mem = 4MB             -- Memory for sorts/hashes per operation
maintenance_work_mem = 64MB -- For CREATE INDEX, VACUUM
```

## Common Optimization Patterns

### Avoid SELECT *
```sql
-- Bad: fetches all columns, prevents index-only scan
SELECT * FROM orders WHERE user_id = 1;

-- Good: only needed columns
SELECT id, total, created_at FROM orders WHERE user_id = 1;
```

### LIMIT with ORDER BY
```sql
-- Bad: sorts entire table then limits
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Good: index supports ORDER BY
CREATE INDEX idx_orders_created_desc ON orders(created_at DESC);
SELECT id, total FROM orders ORDER BY created_at DESC LIMIT 10;
```

### Pagination (Keyset / Seek Method)
```sql
-- OFFSET pagination (slow for deep pages)
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 10000;

-- Keyset pagination (fast, consistent)
SELECT * FROM orders WHERE id > 10000 ORDER BY id LIMIT 20;
-- Next page: WHERE id > 10020
```

### IN vs EXISTS vs JOIN
```sql
-- IN: can be slow for large subqueries
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);

-- EXISTS: often better, stops at first match
SELECT * FROM users WHERE EXISTS (SELECT 1 FROM orders WHERE orders.user_id = users.id);

-- JOIN: usually best for large datasets
SELECT DISTINCT u.* FROM users u JOIN orders o ON o.user_id = u.id;
```

### OR Conditions
```sql
-- Bad: cannot use composite index effectively
SELECT * FROM orders WHERE user_id = 1 OR status = 'paid';

-- Better: UNION ALL (if disjoint) or UNION
SELECT * FROM orders WHERE user_id = 1
UNION ALL
SELECT * FROM orders WHERE status = 'paid' AND user_id != 1;
```

### LIKE Optimization
```sql
-- Prefix: uses index
WHERE email LIKE 'john%'

-- Suffix: no index (unless reverse index)
WHERE email LIKE '%@example.com'

-- Contains: no B-tree index (use pg_trgm GIN)
WHERE email LIKE '%john%'

-- pg_trgm for fuzzy search
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_email_trgm ON users USING GIN (email gin_trgm_ops);
WHERE email ILIKE '%john%';
```

## Statistics & Maintenance

### ANALYZE / VACUUM
```sql
-- Update planner statistics
ANALYZE users;
ANALYZE;  -- All tables

-- Reclaim space, update visibility map (for index-only scans)
VACUUM (ANALYZE) users;
VACUUM FULL users;  -- Locks table, rewrites - avoid in production

-- Autovacuum settings (postgresql.conf)
autovacuum = on
autovacuum_vacuum_scale_factor = 0.1    -- 10% dead tuples
autovacuum_analyze_scale_factor = 0.05  -- 5% changes
autovacuum_vacuum_cost_limit = 2000     -- Throttle
```

### Monitor Index Usage
```sql
-- Unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Index size
SELECT indexname, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
WHERE schemaname = 'public';

-- Table bloat
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as bloat
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY bloat DESC;
```

## Join Optimization

### Join Order
```sql
-- Planner chooses join order based on statistics
-- Force order with CTEs (materialization)
WITH filtered_users AS (
    SELECT * FROM users WHERE active = true
)
SELECT * FROM filtered_users u
JOIN orders o ON o.user_id = u.id;
```

### Join Types
| Type | When Used | Optimization |
|------|-----------|--------------|
| Nested Loop | Small outer, indexed inner | Index on inner join column |
| Hash Join | Large tables, no sort order | Increase `work_mem` |
| Merge Join | Both inputs sorted | Index on join columns + ORDER BY |

## Partitioning (Large Tables)

### Range Partitioning
```sql
CREATE TABLE orders (
    id BIGSERIAL,
    user_id BIGINT,
    total NUMERIC,
    created_at TIMESTAMPTZ NOT NULL
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE orders_2024_q2 PARTITION OF orders
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
-- Indexes created on each partition automatically
```

### Partition Pruning
```sql
-- Only scans relevant partition
EXPLAIN SELECT * FROM orders WHERE created_at >= '2024-03-01';
-- Result: Seq Scan on orders_2024_q1, orders_2024_q2
```

## Query Rewriting Examples

### Correlated Subquery → JOIN
```sql
-- Slow: executes per row
SELECT u.*, (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count
FROM users u;

-- Fast: single aggregation
SELECT u.*, COALESCE(o.order_count, 0)
FROM users u
LEFT JOIN (
    SELECT user_id, COUNT(*) as order_count FROM orders GROUP BY user_id
) o ON o.user_id = u.id;
```

### DISTINCT ON (Top-N per Group)
```sql
-- Latest order per user
SELECT DISTINCT ON (user_id) id, user_id, total, created_at
FROM orders
ORDER BY user_id, created_at DESC;
```

### Window Functions vs Self-Join
```sql
-- Running total (window function, single scan)
SELECT id, user_id, total,
       SUM(total) OVER (PARTITION BY user_id ORDER BY created_at) as running_total
FROM orders;

-- Previous/next row
SELECT id, user_id, total,
       LAG(total) OVER (PARTITION BY user_id ORDER BY created_at) as prev_total
FROM orders;
```

## Checklist for Slow Queries

1. `EXPLAIN (ANALYZE, BUFFERS)` - identify actual vs estimated rows
2. Check for Seq Scan on large tables
3. Verify indexes used (Index Scan / Index Only Scan)
4. Check row estimates - if wrong, `ANALYZE` table
5. Look for "Rows Removed by Filter" - missing index or partial index
6. Check `work_mem` - spilling to disk (Hash, Sort)
7. Consider partitioning for time-series
8. Review index count - too many slows writes