# SQL Performance & Query Optimization

## Indexing
- **Index types**: B-tree (default, general purpose — equality and range queries). Hash (equality only, faster than B-tree for specific point lookups). GiST (full-text search, geometric data). GIN (inverted index — arrays, full-text search, JSONB). BRIN (block-level, for huge tables with ordered data — scanning only relevant blocks). Covering index: includes ALL columns needed by query → no need to read table at all
- **Composite indexes**: order matters! Index on (a, b) — good for WHERE a=1, WHERE a=1 AND b=2, but NOT for WHERE b=2 alone (can't use index). Most selective column first (highest cardinality) — that column filters rows the most
- **Index scan types**: index scan (read index entries, then fetch rows from heap table — two reads per row). Index-only scan (data from index only — no heap fetch, for covering indexes + visibility map). Bitmap scan (multiple index scans → sort → merge → fetch pages in order — efficient when many rows returned, random I/O arranged). Sequential scan (read entire table — fast for large tables when >10% rows returned, or small tables)
- **EXPLAIN ANALYZE**: run query plan. Look for: seq scan (sequential scan) on large tables, high estimated vs actual row counts (bad statistics), large "rows removed by filter" (many rows scanned but filtered out → index needed). Index scans with high filter = maybe missing composite index. Nested loops that scan many rows (need index on inner table). Sort (without index = high cost for large result set)

## Query Optimization
- **SELECT only needed columns** (avoid `SELECT *` — unnecessary I/O, especially with text/BLOB columns)
- **WHERE clause sargability**: avoid functions on indexed columns: `WHERE DATE(created_at) = '2024-01-01'` → should use `WHERE created_at >= '2024-01-01' AND created_at < '2024-01-02'`. Also: `WHERE UPPER(name) = 'JOHN'` instead of `WHERE name = 'John'` if case-insensitive needed. OR: can't use composite index well; use UNION instead
- **JOINs**: ensure foreign key columns are indexed. Join on indexed columns. Avoid joining on expression (cast, function). Use INNER JOIN where possible (left/semi/anti join different)
- **Subqueries**: EXISTS vs IN (EXISTS stops at first match, better for large subquery results). CTEs (WITH clauses) materialize separately in PostgreSQL (v12+ optimization fences). LATERAL joins: for correlated subquery, call a function per row (can be powerful for top-N-per-group)
- **Limit/pagination**: OFFSET + LIMIT = scan all rows up to offset. Cursor-based pagination (WHERE id > last_seen_id ORDER BY id LIMIT 10) = fast, stable, no offsets. OFFSET based: each page scans all previous rows — performance degrades with page number. Cursor based: constant time per page

## PostgreSQL-Specific
- **VACUUM**: reclaim space from dead rows (auto-vacuum runs normally, don't VACUUM manually unless needed). `autovacuum = on` default. Without enough autovacuum: bloat + transaction ID wraparound (dangerous). Monitor: `pg_stat_user_tables.n_dead_tup`. If dead tuples >20% of live: autovacuum is falling behind. Increase autovacuum_scale_factor or autovacuum_vacuum_threshold
  - VACUUM FREEZE: mark old tuples as frozen (prevent XID wraparound). Autovacuum handles this automatically but if disabled: panicked database after 1B transactions. Freeze age: `SELECT datname, age(datfrozenxid) FROM pg_database`
- **ANALYZE**: update statistics for query planner. Run after significant data changes. Autovacuum also analyzes automatically
- **GIN indexes**: for JSONB columns (`data @> '{"key": "value"}'`), full-text search (`to_tsvector`), arrays. GIN: good for queries that check presence of key/value within storage, can be slower to update
- **Partial indexes**: `CREATE INDEX ON users (email) WHERE active = true;` — smaller, faster for filtered queries
- **Expression indexes**: `CREATE INDEX ON users (lower(email));` — for queries using functions on indexed columns. Use matching expression (`WHERE lower(email) = 'user@example.com'`)
- **Partitioning**: range partition by date (month). Declarative partitioning (PostgreSQL 10+). Partition pruning: query planner knows which partition to scan based on WHERE clause — huge performance gain for time-series data (logs, events, time-series)
- **Connection pooling**: PgBouncer (lightweight, transaction pooling mode most efficient). Each connection consumes RAM (~2-10 MB). Pooling reduces overhead. Transaction mode: connection released back to pool after transaction commit

## MySQL-Specific
- **Storage engines**: InnoDB (default — transactions, row-level locking, ACID, clustering index on PRIMARY). MyISAM (no transactions, table locks, full-text search but InnoDB now supports it — read-only, smaller, faster lookups). MEMORY (temporary tables, data lost on restart)
  - InnoDB buffer pool: size = 70-80% of available RAM. `innodb_buffer_pool_size`. Check `SHOW ENGINE INNODB STATUS` for free pages
- **Query cache**: removed in MySQL 8.0 (w/ deprecation). Historically a bottleneck on multi-writer single-server setups
- **EXPLAIN format**: `EXPLAIN FORMAT=JSON` or `EXPLAIN ANALYZE` (MySQL 8.0.18+)
- **Slow query log**: enable + analyze (mysqldumpslow, pt-query-digest). Long_query_time = 0.5 sec

## General Performance
- **N+1 queries**: avoid loading related data row-by-row (ORM anti-pattern). Eager load: JOIN or batch loading. Detect: watch for many similar queries in logs, looks like 1000 queries instead of 1
- **Connection pool size**: typical optimal = (2 × CPU cores) + I/O wait. Too many connections = context switching overhead, resource contention
- **Read replicas**: offload read traffic from primary. Asynchronous replication = stale reads (for reporting, dashboards, read-only API). Synchronous: group replication, Galera
- **Caching**: query result cache (Redis: cache frequently accessed, slow queries). Application-level caching (cache DB query results in Redis/Memcached). For: 80% reads + 20% writes. Cache-aside: read from cache, miss → DB → write to cache
- **Configuration**: work_mem (PostgreSQL, per sort operation — limit to 4-32MB, too high = memory hog per connection). innodb_buffer_pool_size (MySQL — 70-80% of RAM). shared_buffers (PostgreSQL — 25% of RAM, no more than 8GB). effective_cache_size (PostgreSQL: estimate of available OS cache = total RAM minus shared_buffers, OS overhead)
