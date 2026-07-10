# Bun

## Overview

Bun is a fast JavaScript runtime, package manager, bundler, and test runner — all-in-one. Written in **Zig**, powered by **JavaScriptCore** (WebKit) engine instead of V8. Key focus: Node.js API compatibility, native TypeScript/JSX support, fast startup, and Bun-native APIs (SQLite, file I/O, HTTP server, crypto, compression). Install: `curl -fsSL https://bun.sh/install | bash`.

## Runtime & Compatibility

```bash
bun run server.ts            # run TS/JS/JSX directly — no tsconfig needed
bun run --watch server.ts    # file watching
bun --bun run app            # force Bun runtime (instead of Node)
```

- **Node.js API compatibility**: `fs`, `path`, `http`, `crypto`, `stream`, `child_process`, `Buffer`, `process.env` — all work. Over 90% of Node.js APIs supported.
- **Not 100% compatible**: no `node:sqlite` (Bun uses `bun:sqlite`), no `node:module` extensions fully, some `node:worker_threads` differences. Check `compat` table at bun.sh/docs.
- **CommonJS / ESM interop**: Bun handles both `.require()` and `import` seamlessly.
- **TypeScript**: built-in transpiler — runs `.ts` directly. `tsconfig.json` respected (`paths`, `baseUrl`, `compilerOptions`). Strict mode enabled by default.
- **JSX/TSX**: `jsxImportSource` auto-detected (React, Preact, Solid). Works without config.

## Bun.serve() — HTTP Server

```ts
Bun.serve({
  port: 3000,
  hostname: "0.0.0.0", // default "localhost"
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/") return new Response("Hello World");
    if (url.pathname === "/api/data") return Response.json({ ok: true });
    return new Response("Not Found", { status: 404 });
  },
  // TLS
  tls: { key: Bun.file("key.pem"), cert: Bun.file("cert.pem") },
  // WebSocket
  websocket: {
    open(ws) { ws.subscribe("chat"); },
    message(ws, msg) { ws.publish("chat", msg); },
  },
});
```

- Returns `BunServer` with `.stop()`, `.pendingRequests`, `.pendingWebSockets`
- Request/Response follow Web API `Request` / `Response` standards
- Streaming: `new Response(stream)` accepts `ReadableStream`
- WebSocket: built-in, no `ws` package needed. `ws.publish()` for pub/sub per server.
- Performance: ~300k req/s (hello world, M1) vs Node ~70k — approximately 4x throughput for simple JSON

## File I/O

```ts
const file = Bun.file("data.json");   // lazy file reference
await file.exists();
const text = await file.text();       // full content as string
const json = await file.json();       // parse JSON
const buf = await file.arrayBuffer(); // bytes
const stream = file.stream();         // ReadableStream

// Write
await Bun.write("output.txt", "hello world");
await Bun.write("out.json", JSON.stringify({ a: 1 }));

// Bun.write(source, destination) — auto-detects type
await Bun.write(stdout, response);    // pipe response to stdout
await Bun.write(Bun.file("out"), Bun.file("in")); // copy file
```

- `Bun.file()` supports `.slice()` for range reads (no extra memory)
- `Bun.write()` is optimized for zero-copy where possible (splice / sendfile)
- File I/O uses internal thread pool (not libuv)

## SQLite (bun:sqlite)

Built-in SQLite — no `better-sqlite3` or `sql.js` needed.

```ts
import { Database } from "bun:sqlite";

const db = new Database("app.db");
db.exec("PRAGMA journal_mode = WAL;");
db.exec("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)");

// Prepared statements (cached)
const insert = db.prepare("INSERT INTO users (name) VALUES (?1)");
insert.run("Alice");

// Query
const users = db.query("SELECT * FROM users WHERE name = ?1").all("Alice");
// -> [{ id: 1, name: "Alice" }]

const user = db.query("SELECT * FROM users WHERE id = ?1").get(1);

// Transaction
const tx = db.transaction(() => {
  insert.run("Bob");
  insert.run("Charlie");
});
tx();
```

- Prepared statements compile once, run many times — faster than raw exec
- `.all()`, `.get()`, `.run()` — return type depends on method
- `Database` constructor options: `{ create: true, readwrite: true, strict: true }`
- No separate DB driver installation. No native binding compilation.
- Performance: 2-5x faster than `better-sqlite3` for typical workloads.

## Package Manager (bun install)

```bash
bun init                         # create package.json + tsconfig
bun add react                    # install dependency
bun add -d typescript            # dev dependency
bun remove lodash                # uninstall
bun update                       # update all deps (respects semver ranges)
bun install                      # install from lockfile (bun.lock)
bun install --production         # skip devDependencies
bun add react@18                 # specific version
bun add react@next               # tag
```

- **Lockfile**: `bun.lock` (binary) — not human-readable. Can generate `yarn.lock` via `bun install --yarn`.
- **Resolution**: uses `bun install` resolution algorithm — stricter peer dependency handling than npm.
- **Speed**: 10–30x faster than `npm install`. Cold install: ~0.5s vs npm ~5s for a typical project.
- **Workspaces**: `"workspaces": ["packages/*"]` — monorepo support.
- **Overrides**: `"overrides": { "lodash": "^4.17.21" }` — force versions.

## Test Runner

```ts
// test/example.test.ts
import { describe, test, expect, beforeAll, afterAll, mock } from "bun:test";

describe("math", () => {
  test("addition", () => {
    expect(1 + 1).toBe(2);
    expect({ a: 1 }).toEqual({ a: 1 });
    expect("hello").toContain("ell");
  });

  test("async", async () => {
    const val = await Promise.resolve(42);
    expect(val).toBe(42);
  });
});

// Mock
const fn = mock(() => 42);
fn(1, 2);
expect(fn).toHaveBeenCalledTimes(1);
expect(fn).toHaveBeenCalledWith(1, 2);
```

```bash
bun test                      # run all tests in project
bun test --watch              # watch mode
bun test --coverage           # code coverage (built-in)
bun test --timeout 10000      # per-test timeout ms
```

- `bun:test` is Jest-compatible API — most Jest matchers supported
- `mock` restores automatically between tests
- Built-in code coverage (uses V8/JSC) — no `c8` or `nyc` needed
- DOM-like assertions via `happy-dom` or `jsdom` (configurable)
- Tests run in parallel per file by default. Snapshot support built-in.

## Env Variables

```ts
// Reads .env, .env.local, .env.production automatically
console.log(process.env.API_KEY);

// Type-safe env
import { env } from "bun";
// For validation, use dotenv + zod or Bun.env directly
```

- No `dotenv` package needed — Bun auto-loads `.env` files
- Precedence: `.env.local` > `.env.production` > `.env`
- `process.env` — populated from shell + `.env` files

## Bun.file & Blob

```ts
const file = Bun.file("image.png");
file.type;           // "image/png" (MIME from extension)
file.size;           // bytes
file.lastModified;   // Date timestamp

// Response from file
new Response(Bun.file("index.html"));

// Write from response
await Bun.write("output.html", await fetch("https://example.com"));
```

## Bundler

```bash
bun build ./src/index.ts --outdir ./dist  # bundle for browser
bun build ./src/index.ts --target bun     # bundle for bun runtime
bun build ./src/index.ts --target node    # bundle for node
```

- Built-in bundler (esbuild-compatible API)
- Supports code splitting, tree shaking, minification, source maps
- TypeScript/JSX compilation included — no separate tsc step
- `--target` controls module format and externals

## Bun Shell (bun v1.2+)

```ts
import { $ } from "bun";
await $`echo hello`;               // runs in shell
await $`ls ${__dirname}`;          // interpolation (auto-escaped)
const { stdout } = await $`echo hi`.quiet();
// -> "hi"

// Pipe
await $`cat package.json | grep name`;
```

- Cross-platform shell replacement. No `sh` needed on Windows.
- Template strings auto-escape. Safer than `child_process.exec`.

## Performance Benchmarks

| Task | Bun | Node.js |
|------|-----|---------|
| `bun install` (empty lock) | ~400ms | ~5s |
| HTTP hello world (req/s) | ~300k | ~70k |
| File read 10k 1KB files | ~200ms | ~900ms |
| SQLite insert 10k rows | ~50ms | ~250ms (better-sqlite3) |
| Test run (100 tests) | ~0.3s | ~1.2s (Jest) |
| Startup time | ~8ms | ~50ms |

## Known Limitations

- **Windows support**: stable but some APIs missing (WebSocket/streaming edge cases)
- **ECMAScript compatibility**: JSC may trail V8 by a few months on bleeding-edge proposals
- **Node.js native addons (N-API)**: partial support — `node-gyp` based addons often fail
- **Prisma**: requires `@prisma/client` with `bun` for now; full native support in progress
- **Electron**: incompatible (uses V8)
- **Debugging**: `--inspect` works with Chrome DevTools; `bun:debug` for breakpoints; lacks some Node inspector features
- **Large ecosystem packages**: most work, but some rely on V8 internals (e.g., `v8` module, heap snapshots)

## Best Practices

- Use `Bun.write()` over `fs.writeFileSync` for speed
- Prefer `bun:sqlite` over external DB packages when SQLite is sufficient
- Use `Bun.serve()` for high-throughput APIs or WebSocket servers
- Set `--bun` flag in Docker/CI to force Bun runtime (e.g., `bun --bun run vite`)
- Use `bun build` for production bundles — smaller/faster than esbuild alone
- Cache `bun install` in CI: `~/.bun/install/cache`
