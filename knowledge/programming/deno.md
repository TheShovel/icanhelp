# Deno

Deno is a JavaScript/TypeScript runtime built on V8 and Rust, designed as a modern alternative to Node.js.

## Key Differences from Node.js
- **Secure by default**: No filesystem, network, env access without explicit `--allow-read`, `--allow-net`, `--allow-env` flags
- **ES modules only**: No CommonJS (`require`) — uses native `import`/`export`, URLs for dependencies
- **Built-in TypeScript**: Compiles TS out of the box — no `tsconfig.json` or Babel needed
- **Single executable**: No `node_modules`, no `package.json` required — deps fetched via URL-based imports
- **Standard library**: Curated, audited Deno std library — no npm required for common tasks
- **Top-level await**: Works without async wrapper — `const data = await fetch(url)`

## URL-Based Imports
- **Import from URL**: `import { serve } from "https://deno.land/std@0.208.0/http/server.ts"`
- **npm compatibility**: `import { express } from "npm:express@5"` — bridge to npm ecosystem (since Deno 1.28)
- **JSR**: JavaScript Registry — `import { oak } from "jsr:@oak/oak"` — TypeScript-first, works with Deno, Node, Bun, browser
- **Import maps**: `deno.json` — `{ "imports": { "oak": "https://deno.land/x/oak@v12.6.1/mod.ts" } }` — alias long URLs

## Permission System
- **CLI flags**: `--allow-read=/data`, `--allow-write=./output`, `--allow-net=example.com`, `--allow-env`, `--allow-run`
- **--allow-all / -A**: Grants all permissions (reduces security to Node.js level)
- **Deno.permissions API**: `Deno.permissions.request({ name: "net", host: "api.com" })` — runtime permission prompts
- **Permission levels**: `granted` (yes), `denied` (no), `prompt` (ask user on first use)

## Built-in Tooling
- **`deno fmt`**: Auto-formats code (based on dprint) — no Prettier needed
- **`deno lint`**: Built-in linter with recommended rules — extensible via plugins
- **`deno doc`**: Generates documentation from JSDoc comments — supports HTML and JSON output
- **`deno test`**: Built-in test runner — `Deno.test("name", async (t) => { ... })` with sub-tests, coverage
- **`deno bench`**: Benchmark runner — `Deno.bench("name", () => { ... })` — precise timing
- **`deno compile`**: Compile to standalone binary — includes V8 + runtime, ~60MB output
- **`deno task`**: Run commands from `deno.json` — `{ "tasks": { "start": "deno run main.ts" } }`

## HTTP Servers
- **Standard library**: `serve()` from `std/http` — handles HTTP/1.1 and HTTP/2
- **Oak**: Express/Koa-like middleware framework — `router.get("/", ctx => ctx.response.body = "Hello")`
- **Hono**: Lightweight framework — works on Deno, Node, Bun, Cloudflare Workers; supports middleware, validation
- **Fresh**: Full-stack Deno web framework — island architecture, zero JS shipped by default, edge-rendered

## Runtime APIs
- **Web APIs**: `fetch`, `Request`, `Response`, `WebSocket`, `URL`, `Blob`, `File`, `EventTarget`, `AbortController` — all standard
- **Deno namespace**: `Deno.readTextFile(path)`, `Deno.writeTextFile(path, data)`, `Deno.env.get("KEY")`
- **File system**: `Deno.readDir`, `Deno.stat`, `Deno.chmod`, `Deno.copyFile`, `Deno.rename` — Promise-based
- **FFI**: `Deno.dlopen("lib.so", { ... })` — call C libraries from TypeScript without N-API
- **Workers**: Web Workers API for parallelism — `new Worker("worker.ts", { type: "module" })`
- **KV**: Built-in key-value store — `Deno.openKv()` — persistent, ACID, runs on local filesystem or Deno Deploy

## Node.js Compatibility
- **`npm:` specifier**: `import * as fs from "npm:fs"` — runs Node.js packages via polyfilled Node API layer
- **node: prefix**: `import process from "node:process"` — Node built-in modules accessible
- **Compatibility mode**: `deno run --compat main.js` — legacy mode (deprecated, prefer npm specifier)
