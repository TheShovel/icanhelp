# Database Design & Modeling

## Overview
Good database design is the foundation of performant, maintainable applications. This guide covers relational modeling, normalization, indexing strategies, and modern patterns.

## Conceptual Design

### Entity-Relationship Modeling
```
Entities (nouns) → Tables
Attributes → Columns
Relationships (verbs) → Foreign Keys
```

### Cardinality Types
| Relationship | Notation | Implementation |
|--------------|----------|----------------|
| One-to-One | 1:1 | Shared PK or FK with UNIQUE |
| One-to-Many | 1:N | FK on "many" side |
| Many-to-Many | M:N | Junction/associative table |

### Example Schema
```sql
-- Users (1) ────< (N) Orders
-- Orders (N) >──< (M) Products (via OrderItems)

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    inventory_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    total_cents INTEGER NOT NULL DEFAULT 0,
    shipping_address JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    UNIQUE (order_id, product_id)
);

-- Indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

## Normalization

### Normal Forms
| Form | Rule | Violation Example |
|------|------|-------------------|
| **1NF** | Atomic values, no repeating groups | Column with comma-separated values |
| **2NF** | 1NF + no partial dependencies | Non-key depends on part of composite PK |
| **3NF** | 2NF + no transitive dependencies | Non-key depends on another non-key |
| **BCNF** | 3NF + every determinant is candidate key | Overlapping candidate keys |
| **4NF** | BCNF + no multi-valued dependencies | Independent multi-valued attributes |
| **5NF** | 4NF + join dependencies | Complex ternary relationships |

### Practical Approach
```sql
-- ❌ Bad: Unnormalized (1NF violation)
CREATE TABLE orders_bad (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100),
    product_names TEXT,  -- "Widget A, Gadget B, Tool C"
    product_prices TEXT, -- "10.00, 25.00, 15.00"
    quantities TEXT      -- "2, 1, 3"
);

-- ✅ Good: Normalized (3NF)
-- orders, order_items, products tables as shown above
```

### Denormalization (When to Break Rules)
```sql
-- Read-heavy analytics: Materialized view
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT 
    DATE_TRUNC('month', o.created_at) AS month,
    p.category,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.quantity * oi.unit_price_cents) / 100.0 AS revenue
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.status IN ('paid', 'shipped', 'delivered')
GROUP BY 1, 2;

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;

-- Counter caches (denormalized for performance)
ALTER TABLE products ADD COLUMN order_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN revenue_cents BIGINT DEFAULT 0;

-- Trigger to maintain
CREATE OR REPLACE FUNCTION update_product_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE products SET 
            order_count = order_count + 1,
            revenue_cents = revenue_cents + NEW.quantity * NEW.unit_price_cents
        WHERE id = NEW.product_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE products SET 
            order_count = order_count - 1,
            revenue_cents = revenue_cents - OLD.quantity * OLD.unit_price_cents
        WHERE id = OLD.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Data Types & Constraints

### PostgreSQL Type Selection
| Use Case | Recommended Type |
|----------|------------------|
| Primary Keys | `BIGSERIAL` (or `UUID` with `gen_random_uuid()`) |
| Money | `INTEGER` (cents) or `NUMERIC(19,4)` |
| Percentages/Rates | `NUMERIC(5,4)` |
| URLs/Long Text | `TEXT` (no length limit) |
| Short Strings | `VARCHAR(n)` with realistic limit |
| Booleans | `BOOLEAN` |
| Timestamps | `TIMESTAMPTZ` (always!) |
| Dates Only | `DATE` |
| Time Only | `TIME` |
| Enum-like | `VARCHAR` + CHECK or `ENUM` type |
| JSON Documents | `JSONB` (indexable) |
| Binary/Files | `BYTEA` or external storage (S3) + URL |
| IP Addresses | `INET` / `CIDR` |
| Geospatial | `POSTGIS` geometry/geography |

### Constraints Checklist
```sql
CREATE TABLE example (
    id BIGSERIAL PRIMARY KEY,
    
    -- NOT NULL by default for required fields
    email VARCHAR(255) NOT NULL,
    
    -- UNIQUE for business keys
    username VARCHAR(50) NOT NULL UNIQUE,
    
    -- CHECK for data integrity
    age INTEGER CHECK (age >= 0 AND age <= 150),
    price_cents INTEGER CHECK (price_cents >= 0),
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'pending')),
    
    -- Foreign keys with explicit actions
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Composite unique
    UNIQUE (order_id, product_id),
    
    -- Exclusion constraints (advanced)
    EXCLUDE USING GIST (daterange WITH &&),
    
    -- Generated columns (computed)
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    
    -- Defaults
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1  -- Optimistic locking
);
```

## Indexing Strategy

### Index Types (PostgreSQL)
| Type | Use Case | Example |
|------|----------|---------|
| **B-Tree** | Default, equality, range, sorting | `CREATE INDEX ON users(email)` |
| **Hash** | Equality only (faster, no ordering) | `CREATE INDEX USING HASH ON users(email)` |
| **GiST** | Geometric, full-text, exclusion | `CREATE INDEX USING GIST ON locations(geom)` |
| **GIN** | Arrays, JSONB, full-text search | `CREATE INDEX USING GIN ON docs(content)` |
| **BRIN** | Large tables, natural ordering | `CREATE INDEX USING BRIN ON logs(created_at)` |

### When to Index
```sql
-- ✅ Good candidates
WHERE status = 'active'           -- Equality filter
WHERE created_at > '2024-01-01'   -- Range query
ORDER BY created_at DESC          -- Sort
JOIN ON users.id = orders.user_id -- Join condition
WHERE email LIKE 'john%'          -- Prefix search

-- ❌ Avoid indexing
-- Low cardinality (boolean, status with few values)
-- Frequently updated columns
-- Small tables (< 1000 rows)
-- Columns never queried
```

### Composite Indexes
```sql
-- Order matters! Leftmost prefix rule
CREATE INDEX idx_orders_user_status_created 
    ON orders (user_id, status, created_at DESC);

-- Supports these queries:
WHERE user_id = 123
WHERE user_id = 123 AND status = 'paid'
WHERE user_id = 123 AND status = 'paid' AND created_at > '2024-01-01'
ORDER BY created_at DESC  -- If user_id/status filtered

-- Does NOT support:
WHERE status = 'paid'                    -- Missing leftmost
WHERE created_at > '2024-01-01'          -- Missing leftmost
```

### Partial Indexes
```sql
-- Only index active users (smaller, faster)
CREATE INDEX idx_users_active_email 
    ON users(email) WHERE is_active = TRUE;

-- Only index recent orders
CREATE INDEX idx_orders_recent 
    ON orders(created_at) WHERE created_at > NOW() - INTERVAL '1 year';

-- Only index unpaid orders
CREATE INDEX idx_orders_unpaid 
    ON orders(user_id) WHERE status IN ('pending', 'paid');
```

### Covering Indexes (Index-Only Scans)
```sql
-- Include non-key columns to avoid heap fetch
CREATE INDEX idx_orders_covering 
    ON orders (user_id, status) 
    INCLUDE (total_cents, created_at);

-- Query can be satisfied entirely from index
SELECT total_cents, created_at 
FROM orders 
WHERE user_id = 123 AND status = 'paid';
```

### Index Maintenance
```sql
-- Monitor index usage
SELECT 
    schemaname, tablename, indexname,
    idx_scan, idx_tup_read, idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY idx_scan;

-- Find unused indexes (candidates for dropping)
SELECT * FROM pg_stat_user_indexes 
WHERE idx_scan = 0 AND schemaname = 'public';

-- Find missing indexes (sequential scans on large tables)
SELECT * FROM pg_stat_user_tables 
WHERE seq_scan > 1000 AND n_tup_ins > 10000;
```

## Query Optimization

### EXPLAIN ANALYZE
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM orders 
WHERE user_id = 123 AND status = 'paid';
```

### Key Metrics to Watch
| Metric | Good | Bad |
|--------|------|-----|
| **Seq Scan** | Small tables | Large tables without index |
| **Index Scan** | ✅ | N/A |
| **Index Only Scan** | ✅ (covering index) | N/A |
| **Bitmap Heap Scan** | Medium selectivity | N/A |
| **Nested Loop** | Small outer table | Large outer table |
| **Hash Join** | ✅ Large tables | N/A |
| **Merge Join** | ✅ Sorted inputs | N/A |
| **Rows Removed by Filter** | Low | High (wrong index) |
| **Buffers** | Shared hit high | Shared read high |

### Common Fixes
```sql
-- Problem: Seq Scan on large table
-- Fix: Add appropriate index

-- Problem: Index Scan but high "Rows Removed by Filter"
-- Fix: Add column to index (composite) or partial index

-- Problem: Slow ORDER BY ... LIMIT
-- Fix: Index matching ORDER BY (include WHERE columns first)

-- Problem: Slow COUNT(*)
-- Fix: Use triggers to maintain counter, or pg_class.reltuples estimate

-- Problem: Slow LIKE '%term%'
-- Fix: Use pg_trgm extension + GIN index
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
```

## Partitioning

### Range Partitioning (Time-series)
```sql
CREATE TABLE measurements (
    id BIGSERIAL,
    sensor_id BIGINT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL
) PARTITION BY RANGE (recorded_at);

-- Monthly partitions
CREATE TABLE measurements_2024_01 PARTITION OF measurements
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE measurements_2024_02 PARTITION OF measurements
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Auto-create with pg_partman extension
```

### List Partitioning (Multi-tenant)
```sql
CREATE TABLE tenant_data (
    id BIGSERIAL,
    tenant_id INTEGER NOT NULL,
    data JSONB NOT NULL
) PARTITION BY LIST (tenant_id);

CREATE TABLE tenant_data_1 PARTITION OF tenant_data FOR VALUES IN (1);
CREATE TABLE tenant_data_2 PARTITION OF tenant_data FOR VALUES IN (2);
-- Default partition for new tenants
CREATE TABLE tenant_data_default PARTITION OF tenant_data DEFAULT;
```

## Concurrency & Locking

### Lock Types
| Lock Mode | Conflicts With | Use Case |
|-----------|----------------|----------|
| `ACCESS SHARE` | `ACCESS EXCLUSIVE` | SELECT |
| `ROW SHARE` | `EXCLUSIVE`, `ACCESS EXCLUSIVE` | SELECT FOR SHARE |
| `ROW EXCLUSIVE` | `SHARE`, `SHARE ROW EXCLUSIVE`, `EXCLUSIVE`, `ACCESS EXCLUSIVE` | INSERT/UPDATE/DELETE |
| `SHARE UPDATE EXCLUSIVE` | `SHARE UPDATE EXCLUSIVE`, `SHARE`, `SHARE ROW EXCLUSIVE`, `EXCLUSIVE`, `ACCESS EXCLUSIVE` | VACUUM, ANALYZE |
| `SHARE` | `ROW EXCLUSIVE`, `SHARE UPDATE EXCLUSIVE`, `SHARE ROW EXCLUSIVE`, `EXCLUSIVE`, `ACCESS EXCLUSIVE` | CREATE INDEX |
| `EXCLUSIVE` | Most | REFRESH MATERIALIZED VIEW |
| `ACCESS EXCLUSIVE` | All | ALTER TABLE, DROP TABLE, TRUNCATE |

### Deadlock Prevention
```sql
-- ✅ Consistent ordering
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- ❌ Deadlock risk (different order)
BEGIN;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;

-- Explicit locking (when needed)
SELECT * FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE;
-- Now safe to update in any order
```

### Advisory Locks (Application-level)
```sql
-- Session lock (released on disconnect)
SELECT pg_advisory_lock(12345);
-- Do work...
SELECT pg_advisory_unlock(12345);

-- Transaction lock (released on commit/rollback)
SELECT pg_advisory_xact_lock(12345);
-- Do work...
COMMIT; -- Auto-released

-- Try lock (non-blocking)
SELECT pg_try_advisory_lock(12345); -- Returns true/false
```

## Migrations

### Best Practices
```sql
-- ✅ Add column with default (PostgreSQL 11+ fast)
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- ✅ Add column, then backfill, then add NOT NULL
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
UPDATE users SET phone = '' WHERE phone IS NULL; -- Batched for large tables
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- ✅ Create index CONCURRENTLY (no lock)
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- ❌ Avoid: DROP COLUMN (locks table)
-- ✅ Instead: Mark unused, drop later
ALTER TABLE users RENAME COLUMN phone TO phone_deprecated;

-- ❌ Avoid: Change column type (rewrites table)
-- ✅ Instead: Add new column, backfill, switch
ALTER TABLE users ADD COLUMN phone_new VARCHAR(20);
UPDATE users SET phone_new = phone; -- Batched
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users RENAME COLUMN phone_new TO phone;

-- ✅ Safe enum changes
ALTER TYPE order_status ADD VALUE 'refunded' AFTER 'cancelled';
-- Cannot remove enum values safely
```

### Migration Tooling
```bash
# golang-migrate
migrate create -ext sql -dir migrations create_users_table

# SQL files:
-- migrations/000001_create_users_table.up.sql
CREATE TABLE users (...);

-- migrations/000001_create_users_table.down.sql
DROP TABLE users;

# Run
migrate -path migrations -database "postgres://..." up
migrate -path migrations -database "postgres://..." down 1
```

## Performance Tuning

### Configuration (postgresql.conf)
```ini
# Memory
shared_buffers = 256MB              # 25% of RAM
effective_cache_size = 1GB          # 75% of RAM
work_mem = 16MB                     # Per operation
maintenance_work_mem = 512MB        # VACUUM, CREATE INDEX

# Parallelism
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8

# WAL
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9

# Planner
random_page_cost = 1.1              # SSD
seq_page_cost = 1.0
cpu_tuple_cost = 0.01
cpu_index_tuple_cost = 0.005
cpu_operator_cost = 0.0025

# Logging
log_min_duration_statement = 1000   # Log slow queries >1s
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
```

### Connection Pooling (PgBouncer)
```ini
# pgbouncer.ini
[databases]
myapp = host=db port=5432 dbname=myapp

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
max_db_connections = 100
```

### Vacuum & Statistics
```sql
-- Monitor bloat
SELECT 
    schemaname, tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS external_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Manual vacuum (if autovacuum lagging)
VACUUM (VERBOSE, ANALYZE) large_table;

-- Aggressive (requires exclusive lock)
VACUUM FULL large_table;
```

## Security

### Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users see only their orders
CREATE POLICY user_orders ON orders
    FOR ALL TO app_user
    USING (user_id = current_setting('app.current_user_id')::bigint);

-- Policy: Admins see all
CREATE POLICY admin_orders ON orders
    FOR ALL TO admin_role
    USING (true);

-- Set context in application
SET LOCAL app.current_user_id = '123';
```

### Column-Level Encryption
```sql
-- pgcrypto extension
CREATE EXTENSION pgcrypto;

-- Encrypt sensitive column
UPDATE users SET ssn_encrypted = pgp_sym_encrypt(ssn, 'secret_key');
ALTER TABLE users DROP COLUMN ssn;

-- Decrypt
SELECT pgp_sym_decrypt(ssn_encrypted, 'secret_key') FROM users;
```

## Tools & Resources

### GUI Tools
- **pgAdmin** - Official, feature-rich
- **DBeaver** - Universal, free
- **DataGrip** - JetBrains, paid
- **Postico** - Mac native
- **TablePlus** - Cross-platform, modern

### CLI Tools
- **psql** - Built-in, powerful
- **pgcli** - Autocomplete, syntax highlighting
- **pg_dump/pg_restore** - Backup/restore
- **pgbench** - Benchmarking

### Monitoring
- **pg_stat_statements** - Query statistics
- **pgBadger** - Log analyzer
- **pganalyze** / **pgMustard** - SaaS monitoring
- **Prometheus + postgres_exporter** - Metrics

### Resources
- **Documentation**: postgresql.org/docs/
- **Wiki**: wiki.postgresql.org/
- **Performance**: wiki.postgresql.org/wiki/Performance_Optimization
- **Weekly**: postgresweekly.com