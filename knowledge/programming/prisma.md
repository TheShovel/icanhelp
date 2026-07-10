# Prisma ORM

## Overview

Prisma is a Node.js/TypeScript ORM with auto-generated queries, a declarative schema DSL, and a dedicated migration engine. Three layers: **Prisma Schema** (data model), **Prisma Client** (type-safe query builder), **Prisma Migrate** (schema migration).

## Schema Definition

Single source of truth in `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql" // "mysql" | "sqlite" | "sqlserver" | "mongodb" | "cockroachdb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    String  @id @default(cuid())
  email String  @unique
  name  String?
  posts Post[]
}
```

- `@id`, `@default`, `@unique`, `@relation`, `@updatedAt`
- `@map` / `@@map`: rename table/column in DB
- `@@index`: composite index
- `@@unique([field1, field2])`: compound unique

## Relations

- **1:1**: `User @relation(fields: [profileId], references: [id])` on one side
- **1:m**: `User posts Post[]`, `Post author User @relation(fields: [authorId], references: [id])`
- **m:n**: implicit join table — both sides declare `OtherModel[]`; explicit via `@@id([aId, bId])`
- **Self-referencing**: `Category { parent Category? @relation(...) children Category[] }`

Use `references: [id]`, `fields: [userId]`. Optional: `?` for nullable FK.

## Migrations

```bash
npx prisma migrate dev --name add_user       # create + apply migration
npx prisma migrate deploy                     # apply pending migrations (CI/prod)
npx prisma migrate reset                      # drop + recreate + seed
npx prisma db push                            # sync schema (dev only, no migration)
npx prisma db seed                            # run seed script
```

- Migrations are SQL files in `prisma/migrations/`. Diffs are computed by Prisma Engine.
- `prisma migrate dev` auto-generates the client.
- `prisma generate` re-builds client from current schema (no migration).

## Prisma Client CRUD

```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Create
await prisma.user.create({ data: { email: "a@b.com", name: "Alice" } });
// Read
const user = await prisma.user.findUnique({ where: { email: "a@b.com" } });
const users = await prisma.user.findMany({ skip: 10, take: 5, orderBy: { name: "asc" } });
// Update
await prisma.user.update({ where: { id: "x" }, data: { name: "Bob" } });
// Upsert
await prisma.user.upsert({ where: { email: "x" }, update: { name: "Bob" }, create: { ... } });
// Delete
await prisma.user.delete({ where: { id: "x" } });
```

- `findUnique`: must use unique field(s). `findFirst`: with non-unique filter.
- `createMany`, `deleteMany`, `updateMany` — bulk operations.
- `count({ where })`, `aggregate({ _avg, _sum, _min, _max })`

## Filtering & Pagination

```ts
prisma.user.findMany({
  where: {
    name: { contains: "Ali", mode: "insensitive" }, // or: startsWith, endsWith
    email: { endsWith: "@example.com" },
    age: { gte: 18, lt: 65 },
    role: { in: ["ADMIN", "MOD"] },
    NOT: { name: null },
  },
  orderBy: { createdAt: "desc" },
  take: 10,
  skip: 20,   // offset-based
  cursor: { id: lastCursor }, // cursor-based (keyset) pagination
});
```

## Include & Select

```ts
// Eager load relations
await prisma.user.findMany({ include: { posts: true } });

// Pick specific fields
await prisma.user.findMany({ select: { id: true, email: true } });

// Nested selects
await prisma.user.findMany({
  select: { id: true, posts: { select: { title: true } } },
});
```

Use `select` over `include` for performance — only fetches requested columns.

## Transactions

```ts
// Sequential (interactive) transaction
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique(...);
  await tx.post.create(...);
});

// Batch — if one fails, all roll back
await prisma.$transaction([
  prisma.user.update(...),
  prisma.post.create(...),
]);

// Isolation level
await prisma.$transaction([...], { isolationLevel: "Serializable" });
```

## Raw Queries

```ts
// Tagged template — safe from injection
await prisma.$queryRaw`SELECT * FROM "User" WHERE email = ${email}`;
await prisma.$executeRaw`UPDATE "User" SET name = ${name} WHERE id = ${id}`;
```

- Returns raw records (not typed as model).
- For Mongo, raw queries go via `mongo-run-command`.

## Middleware (Soft Delete Example)

```ts
prisma.$use(async (params, next) => {
  if (params.model === "User" && params.action === "findMany") {
    params.args.where = { ...params.args.where, deletedAt: null };
  }
  return next(params);
});
```

- Middleware runs on every operation. Filter by `params.model`, `params.action`.
- Actions: `findUnique`, `findMany`, `create`, `update`, `updateMany`, `delete`, `deleteMany`, etc.

## Logging & Events

```ts
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});
prisma.$on("query", (e) => console.log(e.query, e.duration));
```

## Connection Management

- Default pool size: `pool_timeout` / `pool_checkout_timeout`
- In serverless (Lambda, Vercel): use `prisma` singleton + `PrismaClient` with `connection_limit: 2`
- DataProxy for edge (Prisma Accelerator)

## vs TypeORM

| Prisma | TypeORM |
|--------|---------|
| Schema-first | Code-first (decorators) |
| Auto-generated type-safe client | Manual entity + repository |
| No lazy loading; eager via include | Lazy/eager via decorators |
| Migration engine in Rust/Go | Migration from entity diff |
| Subscriptions: use `$on` + triggers | Subscribers, listeners |
| No `QueryBuilder` (fluent builder interface) | Active QueryBuilder |

## vs Drizzle

| Prisma | Drizzle |
|--------|---------|
| Object-based API | SQL-like composable API |
| Thick client, auto-generated | Thin client, no generation step |
| Heavy bundle (~15 MB node_modules) | Tiny (< 1 MB) |
| Supports MongoDB (limited) | SQL-only |
| Migration file per change | Single `drizzle-kit` push |
| Better DX for CRUD apps | Better for complex SQL / raw control |

## Known Gotchas

- Prisma client must be re-generated after schema changes (`prisma generate`)
- Many-to-many implicit relations auto-delete via cascade; add `@relation("name")` to disambiguate
- `findUnique` on composite unique requires a `where` object with all fields
- N+1: Prisma batches `include` queries but still sends per-row subqueries without relation load strategy
- Use `RelationLoadStrategy::join` (Postgres) with `@prisma/client` extension or raw join to reduce queries
