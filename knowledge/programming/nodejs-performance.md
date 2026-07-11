# Node.js Performance & Best Practices

## Event Loop & Concurrency

### Understanding the Event Loop

```
   ┌───────────────────────────┐
┌─>│           timers          │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │
│  └─────────────┬─────────────┘      ┌───────────────┐
│  ┌─────────────┴─────────────┐      │   incoming:   │
│  │           poll            │<─────┤  connections, │
│  └─────────────┬─────────────┘      │  data, etc.   │
│  ┌─────────────┴─────────────┐      └───────────────┘
│  │           check           │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │      close callbacks      │
│  └───────────────────────────┘
```

### Phases

| Phase | Description |
|-------|-------------|
| **timers** | `setTimeout`, `setInterval` callbacks |
| **pending callbacks** | I/O callbacks deferred to next loop |
| **idle/prepare** | Internal use |
| **poll** | Retrieve new I/O events; execute I/O callbacks |
| **check** | `setImmediate` callbacks |
| **close callbacks** | `socket.on('close', ...)` |

### Microtasks vs Macrotasks

```javascript
// Execution order:
// 1. Sync code
// 2. Microtasks (Promise, process.nextTick, queueMicrotask)
// 3. Macrotasks (setTimeout, setImmediate, I/O)

console.log('1. Sync');

setTimeout(() => console.log('2. setTimeout (macrotask)'), 0);
setImmediate(() => console.log('3. setImmediate (macrotask)'));

Promise.resolve().then(() => console.log('4. Promise (microtask)'));
process.nextTick(() => console.log('5. nextTick (microtask)'));
queueMicrotask(() => console.log('6. queueMicrotask (microtask)'));

// Output:
// 1. Sync
// 5. nextTick
// 4. Promise
// 6. queueMicrotask
// 2. setTimeout
// 3. setImmediate
```

## Worker Threads

### CPU-Intensive Tasks

```javascript
// worker.js
const { parentPort, workerData } = require('worker_threads');

function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(workerData.n);
parentPort.postMessage({ result, id: workerData.id });

// main.js
const { Worker } = require('worker_threads');

function runWorker(n, id) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./worker.js', { workerData: { n, id } });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', code => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
}

// Run multiple workers
async function parallelFibonacci(numbers) {
    const workers = numbers.map((n, i) => runWorker(n, i));
    return Promise.all(workers);
}

// Usage
const results = await parallelFibonacci([40, 41, 42, 43]);
```

### Worker Pool

```javascript
// worker-pool.js
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

class WorkerPool {
    constructor(workerPath, size = require('os').cpus().length) {
        this.workerPath = workerPath;
        this.size = size;
        this.workers = [];
        this.freeWorkers = [];
        this.taskQueue = [];
        
        for (let i = 0; i < size; i++) {
            this.createWorker();
        }
    }
    
    createWorker() {
        const worker = new Worker(this.workerPath);
        worker.on('message', (result) => {
            const { taskId, ...data } = result;
            const { resolve } = this.pendingTasks.get(taskId);
            this.pendingTasks.delete(taskId);
            resolve(data);
            this.freeWorkers.push(worker);
            this.processQueue();
        });
        worker.on('error', (err) => {
            const { reject } = this.pendingTasks.get(worker.currentTaskId);
            this.pendingTasks.delete(worker.currentTaskId);
            reject(err);
            this.freeWorkers.push(worker);
            this.processQueue();
        });
        this.workers.push(worker);
        this.freeWorkers.push(worker);
    }
    
    async execute(taskData) {
        return new Promise((resolve, reject) => {
            const taskId = this.generateId();
            this.pendingTasks.set(taskId, { resolve, reject });
            
            if (this.freeWorkers.length > 0) {
                this.assignTask(taskId, taskData);
            } else {
                this.taskQueue.push({ taskId, taskData });
            }
        });
    }
    
    assignTask(taskId, taskData) {
        const worker = this.freeWorkers.pop();
        worker.currentTaskId = taskId;
        worker.postMessage({ taskId, ...taskData });
    }
    
    processQueue() {
        if (this.taskQueue.length > 0 && this.freeWorkers.length > 0) {
            const { taskId, taskData } = this.taskQueue.shift();
            this.assignTask(taskId, taskData);
        }
    }
}

// Usage
const pool = new WorkerPool('./worker.js', 4);
const results = await Promise.all([
    pool.execute({ n: 40 }),
    pool.execute({ n: 41 }),
    pool.execute({ n: 42 }),
]);
```

## Clustering

```javascript
// cluster.js
const cluster = require('cluster');
const os = require('os');
const express = require('express');

if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    
    console.log(`Master ${process.pid} is running`);
    console.log(`Forking ${numCPUs} workers`);
    
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
        cluster.fork();
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down gracefully...');
        for (const id in cluster.workers) {
            cluster.workers[id].kill('SIGTERM');
        }
    });
} else {
    // Worker process
    const app = express();
    
    app.get('/', (req, res) => {
        res.send(`Hello from worker ${process.pid}`);
    });
    
    app.get('/heavy', (req, res) => {
        // CPU intensive work
        let result = 0;
        for (let i = 0; i < 1e8; i++) result += i;
        res.send(`Result: ${result}`);
    });
    
    const server = app.listen(3000, () => {
        console.log(`Worker ${process.pid} started`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log(`Worker ${process.pid} shutting down`);
        server.close(() => process.exit(0));
    });
}
```

```bash
# PM2 alternative (production)
pm2 start app.js -i max --name myapp
pm2 startup
pm2 save
```

## Memory Management

### V8 Memory Model

```
┌─────────────────────────────────────┐
│            Heap                     │
│  ┌──────────────┐ ┌──────────────┐  │
│  │ Young Gen    │ │ Old Gen      │  │
│  │ (Nursery)    │ │ (Tenured)    │  │
│  │ ~1-8 MB      │ │ ~1.4 GB      │  │
│  │ Scavenge GC  │ │ Mark-Sweep   │  │
│  │ Fast, freq   │ │ Slow, rare   │  │
│  └──────────────┘ └──────────────┘  │
└─────────────────────────────────────┘
```

### Memory Profiling

```bash
# CLI flags
node --inspect app.js
node --inspect-brk app.js

# Heap snapshots
node --heapsnapshot-near-heap-limit=100 app.js

# Flags for debugging
node --max-old-space-size=4096 app.js  # Increase heap limit
node --trace-gc app.js                 # Trace GC events
node --trace-gc-verbose app.js         # Verbose GC tracing

# Tools
# - Chrome DevTools (chrome://inspect)
# - clinic.js: npm install -g clinic
#   clinic doctor -- node app.js
#   clinic flame -- node app.js
#   clinic bubbleprof -- node app.js
# - 0x: npm install -g 0x
#   0x app.js
```

### Memory Leaks Prevention

```javascript
// Bad: Growing array
const requests = [];
app.use((req, res, next) => {
    requests.push({ time: Date.now(), url: req.url, ip: req.ip });
    next();
});

// Good: Circular buffer or external store
const { LRUCache } = require('lru-cache');
const requestLog = new LRUCache({ max: 10000 });

app.use((req, res, next) => {
    requestLog.set(`${req.ip}:${Date.now()}`, { url: req.url });
    next();
});

// Event listener leaks
// Bad
process.on('data', handler);
process.on('data', handler); // Duplicate!

// Good
const handler = (data) => { ... };
process.on('data', handler);
// Remove when done
process.off('data', handler);

// Or use once
process.once('data', handler);

// Timer leaks
// Bad
setInterval(() => { ... }, 1000); // Never cleared!

// Good
const interval = setInterval(() => { ... }, 1000);
// Later
clearInterval(interval);

// Or use setTimeout recursively
function schedule() {
    doWork().then(() => setTimeout(schedule, 1000));
}
schedule();

// Closure leaks
// Bad: Large object in closure
function createHandler(largeData) {
    return () => {
        console.log(largeData.smallProperty); // Keeps largeData alive!
    };
}

// Good: Extract only needed data
function createHandler(largeData) {
    const needed = largeData.smallProperty;
    return () => console.log(needed);
}

// Or use WeakMap/WeakRef
const cache = new WeakMap();
function process(obj) {
    if (!cache.has(obj)) {
        cache.set(obj, computeExpensive(obj));
    }
    return cache.get(obj);
}
```

### Streams for Memory Efficiency

```javascript
// Bad: Buffer entire file
app.get('/download', async (req, res) => {
    const data = await fs.readFile('huge-file.zip');
    res.send(data);
});

// Good: Stream
app.get('/download', (req, res) => {
    const stream = fs.createReadStream('huge-file.zip');
    stream.pipe(res);
    
    stream.on('error', (err) => {
        res.status(500).send('File error');
    });
});

// Transform stream
const { Transform } = require('stream');
const zlib = require('zlib');

app.get('/compressed', (req, res) => {
    res.setHeader('Content-Encoding', 'gzip');
    
    fs.createReadStream('large-file.txt')
        .pipe(zlib.createGzip())
        .pipe(res);
});

// Pipeline (handles errors automatically)
const { pipeline } = require('stream/promises');

async function processFile(input, output) {
    await pipeline(
        fs.createReadStream(input),
        zlib.createGzip(),
        crypto.createCipheriv('aes-256-gcm', key, iv),
        fs.createWriteStream(output)
    );
}
```

## Caching Strategies

### In-Memory Cache

```javascript
// Simple TTL cache
class TTLCache {
    constructor(defaultTTL = 60000) {
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
    }
    
    set(key, value, ttl = this.defaultTTL) {
        const expiresAt = Date.now() + ttl;
        this.cache.set(key, { value, expiresAt });
    }
    
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return undefined;
        
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }
        
        return entry.value;
    }
    
    delete(key) {
        this.cache.delete(key);
    }
    
    clear() {
        this.cache.clear();
    }
    
    // Cleanup expired entries periodically
    startCleanup(interval = 60000) {
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.cache.entries()) {
                if (now > entry.expiresAt) this.cache.delete(key);
            }
        }, interval);
    }
    
    stopCleanup() {
        clearInterval(this.cleanupInterval);
    }
}

// Usage
const cache = new TTLCache(300000); // 5 min TTL

app.get('/users/:id', async (req, res) => {
    const cached = cache.get(`user:${req.params.id}`);
    if (cached) return res.json(cached);
    
    const user = await db.getUser(req.params.id);
    cache.set(`user:${req.params.id}`, user);
    res.json(user);
});
```

### Redis Cache

```javascript
const Redis = require('ioredis');
const redis = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    enableReadyCheck: true,
    lazyConnect: true,
});

class RedisCache {
    constructor(redis, defaultTTL = 300) {
        this.redis = redis;
        this.defaultTTL = defaultTTL;
    }
    
    async get(key) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
    }
    
    async set(key, value, ttl = this.defaultTTL) {
        await this.redis.setex(key, ttl, JSON.stringify(value));
    }
    
    async del(key) {
        await this.redis.del(key);
    }
    
    async invalidatePattern(pattern) {
        const keys = await this.redis.keys(pattern);
        if (keys.length) await this.redis.del(...keys);
    }
    
    // Cache-aside pattern
    async getOrSet(key, factory, ttl) {
        const cached = await this.get(key);
        if (cached !== null) return cached;
        
        const value = await factory();
        await this.set(key, value, ttl);
        return value;
    }
}

// Usage with cache-aside
const userCache = new RedisCache(redis);

app.get('/users/:id', async (req, res) => {
    const user = await userCache.getOrSet(
        `user:${req.params.id}`,
        () => db.getUser(req.params.id),
        300 // 5 min
    );
    res.json(user);
});

// Invalidate on update
app.put('/users/:id', async (req, res) => {
    await db.updateUser(req.params.id, req.body);
    await userCache.del(`user:${req.params.id}`);
    // Or update cache
    await userCache.set(`user:${req.params.id}`, req.body);
    res.json({ success: true });
});
```

### HTTP Caching

```javascript
// ETag & Last-Modified
app.get('/posts/:id', async (req, res) => {
    const post = await db.getPost(req.params.id);
    
    // Generate ETag
    const etag = crypto.createHash('md5').update(JSON.stringify(post)).digest('hex');
    res.set('ETag', etag);
    res.set('Last-Modified', post.updatedAt.toUTCString());
    
    // Check If-None-Match / If-Modified-Since
    if (req.get('If-None-Match') === etag || 
        new Date(req.get('If-Modified-Since')).getTime() >= post.updatedAt.getTime()) {
        return res.status(304).end();
    }
    
    res.json(post);
});

// Cache-Control
app.get('/static/*', (req, res) => {
    res.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
    // serve file
});

app.get('/api/users', (req, res) => {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
    // serve data
});
```

## Database Optimization

### Connection Pooling

```javascript
// pg (PostgreSQL)
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    user: 'user',
    password: 'pass',
    max: 20,           // Max connections
    min: 2,            // Min connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // For production: use PgBouncer
});

pool.on('error', (err) => {
    console.error('Unexpected pool error', err);
});

// Query with pool
async function getUser(id) {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    } finally {
        client.release();
    }
}

// mysql2
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'user',
    password: 'pass',
    database: 'myapp',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
});

// Query
const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
```

### Query Optimization

```javascript
// Bad: N+1 queries
async function getUsersWithPosts() {
    const users = await db.query('SELECT * FROM users');
    for (const user of users) {
        user.posts = await db.query('SELECT * FROM posts WHERE user_id = $1', [user.id]);
    }
    return users;
}

// Good: Single query with JOIN
async function getUsersWithPosts() {
    return db.query(`
        SELECT u.*, json_agg(p.*) as posts
        FROM users u
        LEFT JOIN posts p ON u.id = p.user_id
        GROUP BY u.id
    `);
}

// Or use batch loading (DataLoader pattern)
const DataLoader = require('dataloader');

const postLoader = new DataLoader(async (userIds) => {
    const posts = await db.query(
        'SELECT * FROM posts WHERE user_id = ANY($1)', 
        [userIds]
    );
    
    // Group by user_id
    const postsByUser = posts.reduce((acc, post) => {
        (acc[post.user_id] = acc[post.user_id] || []).push(post);
        return acc;
    }, {});
    
    return userIds.map(id => postsByUser[id] || []);
});

// Usage
const user = await getUser(1);
const posts = await postLoader.load(1);
```

### Indexing Strategy

```sql
-- Analyze query patterns first
EXPLAIN ANALYZE SELECT * FROM orders 
WHERE user_id = 123 AND created_at > '2024-01-01'
ORDER BY created_at DESC LIMIT 20;

-- Composite index for the above query
CREATE INDEX idx_orders_user_created 
ON orders (user_id, created_at DESC);

-- Partial index for common filters
CREATE INDEX idx_orders_pending 
ON orders (created_at DESC) 
WHERE status = 'pending';

-- Covering index (include columns)
CREATE INDEX idx_users_email_covering 
ON users (email) 
INCLUDE (name, created_at);

-- JSONB indexing
CREATE INDEX idx_products_attributes 
ON products USING GIN (attributes);

-- Monitor index usage
SELECT * FROM pg_stat_user_indexes 
WHERE idx_scan = 0 AND schemaname = 'public';

-- Drop unused indexes
DROP INDEX IF EXISTS idx_unused;
```

## Monitoring & Observability

### Metrics Collection

```javascript
// prom-client
const promClient = require('prom-client');
const register = new promClient.Registry();

promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new promClient.Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
});

// Middleware
app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    
    res.on('finish', () => {
        const duration = Number(process.hrtime.bigint() - start) / 1e9;
        const route = req.route?.path || req.path;
        
        httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
        httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
    });
    
    next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
```

### Health Checks

```javascript
// health.js
class HealthCheck {
    constructor() {
        this.checks = new Map();
    }
    
    addCheck(name, checkFn) {
        this.checks.set(name, checkFn);
    }
    
    async run() {
        const results = {};
        let overall = 'healthy';
        
        for (const [name, check] of this.checks) {
            try {
                const start = Date.now();
                await check();
                results[name] = { status: 'healthy', latency: Date.now() - start };
            } catch (error) {
                results[name] = { status: 'unhealthy', error: error.message };
                overall = 'unhealthy';
            }
        }
        
        return { status: overall, checks: results, timestamp: new Date().toISOString() };
    }
}

const health = new HealthCheck();

health.addCheck('database', async () => {
    await db.query('SELECT 1');
});

health.addCheck('redis', async () => {
    await redis.ping();
});

health.addCheck('disk', async () => {
    const { free } = await fs.statfs('/');
    const freeGB = free / 1e9;
    if (freeGB < 1) throw new Error(`Low disk space: ${freeGB}GB`);
});

app.get('/health', async (req, res) => {
    const result = await health.run();
    res.status(result.status === 'healthy' ? 200 : 503).json(result);
});

app.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'alive' });
});

app.get('/health/ready', async (req, res) => {
    const result = await health.run();
    res.status(result.status === 'healthy' ? 200 : 503).json(result);
});
```

### Distributed Tracing

```javascript
// OpenTelemetry
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');

const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({ endpoint: 'http://jaeger:14268/api/traces' });
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

registerInstrumentations({
    instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new PgInstrumentation(),
    ],
});

// Manual tracing
const tracer = require('@opentelemetry/api').trace.getTracer('my-service');

async function handleOrder(orderId) {
    return tracer.startActiveSpan('handle-order', async (span) => {
        try {
            span.setAttribute('order.id', orderId);
            
            const order = await getOrder(orderId);
            span.setAttribute('order.value', order.total);
            
            await processPayment(order);
            span.addEvent('payment_processed');
            
            await sendConfirmation(order);
            span.addEvent('confirmation_sent');
            
            span.setStatus({ code: SpanStatusCode.OK });
            return order;
        } catch (error) {
            span.recordException(error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            throw error;
        } finally {
            span.end();
        }
    });
}
```

## Performance Testing

```bash
# Autocannon (HTTP benchmarking)
npx autocannon -c 100 -d 30 -p 10 http://localhost:3000/api/users

# wrk
wrk -t4 -c100 -d30s http://localhost:3000/api/users

# k6 (scriptable)
k6 run script.js
```

```javascript
// k6 script
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.01'],
    },
};

export default function() {
    const res = http.get('http://localhost:3000/api/users');
    check(res, { 'status is 200': (r) => r.status === 200 });
    sleep(1);
}
```

## Node.js 20+ Features

```javascript
// --experimental-vm-modules for top-level await
// --experimental-import-meta-resolve

// Built-in test runner (Node 18+)
--test
--test-reporter=spec
--test-concurrency=4

// Watch mode
node --watch app.js

// Single executable applications
node --experimental-sea-config sea-config.json

// Permission model (Node 20+)
node --allow-fs-read=/data --allow-net=localhost:3000 app.js

// Snapshot for fast startup
node --build-snapshot=snapshot.blob app.js
node --snapshot-blob=snapshot.blob
```

## Performance Checklist

- [ ] Use connection pooling for databases
- [ ] Enable HTTP/2
- [ ] Use compression (gzip/brotli)
- [ ] Implement caching (Redis, in-memory, HTTP)
- [ ] Use streams for large data
- [ ] Profile with clinic.js / 0x
- [ ] Monitor event loop lag
- [ ] Set appropriate heap limits
- [ ] Use worker threads for CPU-intensive tasks
- [ ] Cluster for multi-core utilization
- [ ] Implement graceful shutdown
- [ ] Monitor GC frequency and duration
- [ ] Use DataLoader for batching
- [ ] Add database indexes
- [ ] Use prepared statements
- [ ] Implement circuit breakers
- [ ] Add request timeouts
- [ ] Use CDN for static assets
- [ ] Enable keep-alive connections
- [ ] Monitor memory for leaks
- [ ] Load test before release