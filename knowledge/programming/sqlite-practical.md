# SQLite Practical Guide

## When SQLite Fits
SQLite is ideal for local apps, prototypes, embedded devices, CLI tools, tests, small websites, desktop apps, and single-node services. It has no separate server process and stores data in one file.

## When to Use a Server Database
Choose PostgreSQL or another server database when many writers need concurrent access, the database is shared across machines, strict role-based access is needed, or operational tooling requires replication and centralized backups.

## CLI Basics
```bash
sqlite3 app.db
.tables
.schema users
.headers on
.mode column
.read seed.sql
.dump > backup.sql
```
Use `.schema` to inspect tables and `.dump` for logical backups. SQLite shell commands start with a dot and are not SQL.

## Useful Pragmas
```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA optimize;
```
Enable foreign keys for each connection. WAL mode improves read/write concurrency. A busy timeout prevents immediate failures when another process briefly holds a lock.

## Table Design
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
`INTEGER PRIMARY KEY` aliases the rowid and auto-assigns values. Store timestamps as ISO-8601 text, Unix seconds, or Julian days; be consistent.

## Transactions
```sql
BEGIN;
INSERT INTO accounts(name) VALUES ('checking');
INSERT INTO ledger(account_id, amount) VALUES (1, 2500);
COMMIT;
```
Wrap related writes in transactions. Transactions improve correctness and performance by avoiding partial updates and reducing repeated disk syncs.

## Indexes
```sql
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 7;
```
Index columns used in joins, filters, and ordering. Avoid indexing every column; indexes speed reads but slow writes and consume space.

## Backups
```sql
VACUUM INTO 'backup.db';
```
For live databases, use the backup API or `VACUUM INTO` instead of copying the file while writes are active. If using WAL mode, the `-wal` file can contain recent data.

## Common Pitfalls
- Forgetting `PRAGMA foreign_keys = ON`.
- Treating SQLite like a high-concurrency client/server database.
- Copying only the `.db` file while WAL files exist.
- Building SQL strings with user input instead of prepared statements.
- Assuming types are enforced exactly like PostgreSQL; SQLite uses dynamic typing unless strict tables are used.
