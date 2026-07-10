# SQL & Databases

## SQL Basics
```sql
-- Query
SELECT column1, column2 FROM table WHERE condition ORDER BY col LIMIT n;

-- Filtering
WHERE col = value            -- exact match
WHERE col LIKE '%pattern%'   -- pattern (case depends on collation)
WHERE col IN (1, 2, 3)       -- set membership
WHERE col BETWEEN 10 AND 20  -- range
WHERE col IS NULL            -- null check
WHERE col IS NOT NULL

-- Aggregation
COUNT(*), SUM(col), AVG(col), MIN(col), MAX(col)
SELECT dept, COUNT(*) FROM employees GROUP BY dept HAVING COUNT(*) > 5;

-- Joins
SELECT * FROM a JOIN b ON a.id = b.a_id;         -- inner
SELECT * FROM a LEFT JOIN b ON a.id = b.a_id;    -- left outer
SELECT * FROM a RIGHT JOIN b ON a.id = b.a_id;   -- right outer
SELECT * FROM a FULL JOIN b ON a.id = b.a_id;    -- full outer
SELECT * FROM a CROSS JOIN b;                     -- cartesian

-- Set operations
SELECT ... UNION SELECT ...;           -- deduplicated union
SELECT ... UNION ALL SELECT ...;       -- union with duplicates
SELECT ... INTERSECT SELECT ...;
SELECT ... EXCEPT SELECT ...;

-- Subqueries
SELECT * FROM a WHERE id IN (SELECT a_id FROM b WHERE active = true);

-- CTE (Common Table Expression)
WITH recent AS (
  SELECT * FROM orders WHERE created_at > now() - interval '7 days'
)
SELECT * FROM recent WHERE total > 100;
```

## DDL (Data Definition Language)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN age INTEGER;
ALTER TABLE users DROP COLUMN age;
ALTER TABLE users RENAME COLUMN name TO full_name;
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

DROP TABLE users;
TRUNCATE TABLE users;  -- remove all rows, faster than DELETE

CREATE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);
DROP INDEX idx_users_email;

-- Constraints
PRIMARY KEY (col)
FOREIGN KEY (col) REFERENCES other(id) ON DELETE CASCADE
UNIQUE (col)
CHECK (col > 0)
NOT NULL
DEFAULT value
```

## DML (Data Manipulation Language)
```sql
INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');
INSERT INTO users (name, email) VALUES ('Bob', 'bob@e.com'), ('Carol', 'carol@e.com');
UPDATE users SET name = 'Alice Smith' WHERE id = 1;
DELETE FROM users WHERE id = 1;
```

## PostgreSQL Specific
```sql
-- JSON/JSONB
SELECT data->>'name' FROM users WHERE data @> '{"city": "NYC"}';
UPDATE users SET data = jsonb_set(data, '{age}', '30');

-- Arrays
SELECT * FROM articles WHERE tags @> ARRAY['postgresql'];

-- Full text search
SELECT * FROM articles WHERE to_tsvector('english', body) @@ to_tsquery('database & performance');

-- Window functions
SELECT name, dept, salary,
  RANK() OVER (PARTITION BY dept ORDER BY salary DESC) as rank_in_dept,
  AVG(salary) OVER (PARTITION BY dept) as avg_salary_dept
FROM employees;

-- Date/time
NOW(), CURRENT_DATE, CURRENT_TIME
date_trunc('month', created_at)  -- truncate to month
EXTRACT(YEAR FROM created_at)
created_at + INTERVAL '7 days'
AGE(created_at)  -- time since
```

## SQLite Specific
```sql
-- Dynamic typing (affinity-based)
CREATE TABLE t (a TEXT, b INTEGER, c REAL, d BLOB);
-- Can store any type in any column despite declarations

-- Useful built-in
.load /usr/lib/sqlite3/password.so  -- load extensions
ATTACH DATABASE 'other.db' AS other;
SELECT * FROM other.table;
```

## Performance
- `EXPLAIN ANALYZE SELECT ...` — see query plan
- Index columns used in WHERE, JOIN, ORDER BY
- Avoid `SELECT *` (fetch only needed columns)
- Use `LIMIT` for pagination (with `OFFSET` or keyset pagination)
- Keyset pagination: `WHERE id > last_seen_id ORDER BY id LIMIT 20` (faster than OFFSET)
- For count on large tables, use approximate counts (pg_class.reltuples in PostgreSQL)
- Connection pooling: use PgBouncer/pgpool for Postgres, `better-sqlite3` for SQLite (synchronous)

## PostgreSQL Administration
```bash
psql -U user -d dbname       # connect
psql -h host -p port -U user -d dbname

# Meta-commands
\l                          -- list databases
\c dbname                   -- connect to database
\dt                         -- list tables
\d table                    -- describe table
\di                         -- list indexes
\du                         -- list users
\df                         -- list functions
\x                          -- expanded display
\q                          -- quit
\copy table TO 'file.csv' CSV HEADER  -- export
\copy table FROM 'file.csv' CSV HEADER  -- import

# Database management
CREATE DATABASE dbname;
DROP DATABASE dbname;
CREATE USER user WITH PASSWORD 'pass';
GRANT ALL PRIVILEGES ON DATABASE dbname TO user;
pg_dump dbname > dump.sql   -- backup
psql dbname < dump.sql      -- restore
```

## Common SQL Gotchas
- `NULL != NULL` (use `IS NULL` instead of `= NULL`)
- `WHERE col NOT IN (1, 2, NULL)` returns empty (NULL poison)
- String comparison collation can be case-sensitive or insensitive
- `GROUP BY` requires all non-aggregate SELECT columns in GROUP BY
- `HAVING` filters after aggregation; `WHERE` filters before
- Pagination with `OFFSET` gets slower as offset grows (scan all skipped rows)
