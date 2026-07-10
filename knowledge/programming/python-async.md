# Python Async

## Overview

`asyncio` is Python's built-in library for **concurrent** (not parallel) execution using cooperative multitasking via an **event loop**. Uses `async/await` syntax (Python 3.5+). Best for I/O-bound work: network requests, file I/O, database queries, web servers. Not for CPU-bound tasks (use `multiprocessing` or threads with GIL release).

## Coroutines

The core async building block. Defined with `async def`, executed via `await`.

```python
import asyncio

async def fetch_data(url: str) -> dict:
    # simulated async work
    await asyncio.sleep(1)
    return {"url": url, "status": 200}

# Calling a coroutine returns a coroutine object — does NOT execute
coro = fetch_data("https://example.com")

# Run in event loop
result = asyncio.run(fetch_data("https://example.com"))
```

- `asyncio.run(coro)` — creates event loop, runs coroutine to completion, closes loop. Python 3.7+. Should be called once per script entry point.
- `await coro` — suspend current coroutine until coro completes, then resume.
- A coroutine is an **awaitable**. Other awaitables: Tasks, Futures.

## Awaitables

### Coroutines

```python
async def say_hello():
    return "hello"

result = await say_hello()  # "hello"
```

### Tasks

Schedule coroutines for **concurrent execution**:

```python
async def main():
    task1 = asyncio.create_task(fetch_data("/a"))  # starts immediately
    task2 = asyncio.create_task(fetch_data("/b"))
    r1 = await task1   # wait for task1
    r2 = await task2   # already running concurrently
    return [r1, r2]
```

- `asyncio.create_task(coro)` — wrap coroutine in a Task, schedule it on the event loop. Python 3.7+.
- Task runs as soon as event loop gets control (after `await`/`return` in current coroutine).
- `task.cancel()` — raises `CancelledError` inside the task.
- `task.done()`, `task.result()`, `task.exception()`

### Futures

Lower-level awaitable representing a future result. Usually not used directly — Tasks are Futures. `loop.create_future()` for manual resolution.

## Event Loop

```python
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)
loop.run_until_complete(main())
loop.close()
```

- `asyncio.get_running_loop()` — get current loop (from within coroutine). Python 3.7+.
- `loop.run_in_executor(None, sync_fn, *args)` — run blocking code in thread pool
- `loop.call_later(1, callback)`, `loop.call_soon(callback)` — schedule callbacks
- Python 3.10+: `asyncio.Runner` — context manager for running async code

## asyncio.gather — Running Tasks Concurrently

```python
async def main():
    results = await asyncio.gather(
        fetch_data("/a"),
        fetch_data("/b"),
        fetch_data("/c"),
        return_exceptions=True,  # return exceptions as values instead of raising
    )
    return results
```

- Runs all awaitables **concurrently** (not in parallel). Order of results matches input order.
- If one raises and `return_exceptions=False` (default), others are **cancelled** immediately.
- Nested gathers work. For dynamic lists: `asyncio.gather(*[task(i) for i in range(10)])`

## asyncio.wait & asyncio.as_completed

### asyncio.wait

```python
done, pending = await asyncio.wait(
    [task1, task2, task3],
    timeout=5.0,
    return_when=asyncio.FIRST_COMPLETED,  # or ALL_COMPLETED, FIRST_EXCEPTION
)
for t in done:
    result = t.result()
```

### asyncio.as_completed

Yields completed futures as they finish (like iterator):

```python
for coro in asyncio.as_completed([fetch("/a"), fetch("/b"), fetch("/c")]):
    result = await coro
    print(result)
```

## Semaphores & Rate Limiting

Limit concurrency to N simultaneous tasks:

```python
sem = asyncio.Semaphore(5)

async def fetch_with_limit(url: str) -> dict:
    async with sem:
        return await fetch_data(url)

async def main():
    tasks = [fetch_with_limit(url) for url in urls]
    return await asyncio.gather(*tasks)
```

- `Semaphore(value)` — max N concurrent acquisitions
- `BoundedSemaphore(value)` — raises ValueError if released too many times
- Use for: API rate limits, DB connection pools, file descriptor limits

## Async Context Managers

For resources that need async setup/teardown:

```python
class AsyncSession:
    async def __aenter__(self):
        print("opening connection")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("closing connection")

async def use():
    async with AsyncSession() as session:
        pass  # use session

# Built-in: aiohttp.ClientSession
async with aiohttp.ClientSession() as session:
    async with session.get("https://api.example.com") as resp:
        data = await resp.json()
```

## Async Generators

Yield values asynchronously (Python 3.6+):

```python
async def ticker(delay: float, count: int):
    for i in range(count):
        await asyncio.sleep(delay)
        yield i

async def main():
    async for tick in ticker(0.5, 10):
        print(tick)
```

- Use `async for` to iterate. Generator can use `await`, `async for`, `async with`.
- Must implement `__aiter__` and `__anext__`.
- Cleanup via `aclose()`, `asend()`, `athrow()` — mirror sync generators.

## Async Comprehensions

```python
results = [await fetch(url) for url in urls]        # sequential
results = await asyncio.gather(*[fetch(url) for url in urls])  # concurrent
```

No special syntax — careful to not accidentally sequentialize with list comprehensions.

## aiohttp (HTTP Client)

```python
import aiohttp

async def fetch_json(session: aiohttp.ClientSession, url: str) -> dict:
    async with session.get(url) as resp:
        resp.raise_for_status()
        return await resp.json()

async def main():
    async with aiohttp.ClientSession() as session:
        results = await asyncio.gather(*[
            fetch_json(session, f"https://api.example.com/page/{i}")
            for i in range(100)
        ])
        return results
```

- Connection pooling: `ClientSession` reuses connections internally (default limit: 100)
- `session.get()`, `.post()`, `.put()`, `.delete()` — return `ClientResponse`
- `resp.text()`, `.json()`, `.read()`, `.content` (streaming)
- Timeouts: `timeout=aiohttp.ClientTimeout(total=10)`
- Session reuse essential — do not create new session per request
- Alternative HTTP libs: `httpx.AsyncClient`, `aiofiles` (file I/O), `aiosqlite` (SQLite)

## asyncio in Web Frameworks

Popular async web frameworks built on asyncio:

- **FastAPI**: `async def` endpoints, Pydantic validation, auto OpenAPI docs
- **Starlette**: low-level async framework (FastAPI is built on it)
- **Sanic**: Flask-like, async-first
- **aiohttp server**: `web.Application`, `web.RouteTableDef`

```python
# FastAPI
from fastapi import FastAPI
import httpx

app = FastAPI()

@app.get("/users")
async def get_users():
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://jsonplaceholder.typicode.com/users")
        return resp.json()
```

## asyncio vs Threading vs Multiprocessing

| Aspect | asyncio | threading | multiprocessing |
|--------|---------|-----------|-----------------|
| Concurrency type | Cooperative (single thread) | Preemptive (OS threads) | True parallelism (processes) |
| GIL | Not an issue (no parallelism) | Limited by GIL (CPU-bound) | No GIL (separate processes) |
| CPU-bound | ❌ Bad | ❌ Bad (GIL contention) | ✅ Good |
| I/O-bound | ✅ Excellent | ✅ Good | ⚠️ Overkill (IPC cost) |
| Memory | Single process (low) | Shared memory | Separate memory per process |
| Number of tasks | 100k+ (lightweight) | ~1k (stack per thread) | CPU cores only |
| Race conditions | Rare (cooperative) | Common (preemptive) | IPC complexity |
| Debugging | Easy (deterministic) | Hard (race conditions) | Moderate |
| Syntax | `async/await` | Standard Python | Standard Python |
| Libraries needed | Async-specific (aiohttp) | Standard lib fine | Standard lib fine |

## Common Patterns & Pitfalls

### Blocking the Event Loop

```python
# BAD — blocks the event loop
async def bad():
    time.sleep(5)  # blocks ALL coroutines
    result = requests.get("https://example.com")  # also blocking

# GOOD — use async sleep & HTTP
async def good():
    await asyncio.sleep(5)
    async with aiohttp.ClientSession() as s:
        async with s.get("https://example.com") as r:
            return await r.text()

# For unavoidable blocking code:
loop = asyncio.get_running_loop()
result = await loop.run_in_executor(None, requests.get, url)
```

### Timeouts

```python
try:
    result = await asyncio.wait_for(fetch_data(url), timeout=5.0)
except asyncio.TimeoutError:
    print("Request timed out")

# Alternative via asyncio.timeout (Python 3.11+)
async with asyncio.timeout(5.0):
    result = await fetch_data(url)
```

### Task Cancellation

```python
async def worker():
    try:
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        await cleanup()
        raise  # must re-raise to propagate cancellation

async def main():
    task = asyncio.create_task(worker())
    await asyncio.sleep(3)
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("cancelled")
```

### Error Handling in Gather

```python
# Catch individual failures
async def safe_fetch(url: str):
    try:
        return await fetch_data(url)
    except Exception as e:
        return {"error": str(e), "url": url}

results = await asyncio.gather(*[safe_fetch(u) for u in urls])
```

### Queue (Consumer/Producer)

```python
queue = asyncio.Queue(maxsize=100)

async def producer():
    for i in range(1000):
        await queue.put(i)
    await queue.put(None)  # sentinel

async def consumer():
    while True:
        item = await queue.get()
        if item is None:
            break
        await process(item)
```

## Python Version Differences

| Feature | Min Python | Notes |
|---------|-----------|-------|
| `async/await` | 3.5 | `@asyncio.coroutine` deprecated |
| `asyncio.run()` | 3.7 | Preferred entry point |
| `asyncio.create_task()` | 3.7 | Replaces `ensure_future` |
| `asyncio.CancelledError` subclass of `BaseException` | 3.8 | Won't be caught by bare `except Exception` |
| `asyncio.Runner` | 3.11 | Context manager for loop |
| `TaskGroup` | 3.11 | Structured concurrency |
| `asyncio.timeout()` | 3.11 | Context manager timeout |
| `TaskGroup` / `ExceptionGroup` | 3.11 | `except*` syntax for groups |
| `Barrier` | 3.11 | Synchronization primitive |
| Optimized asyncio performance | 3.12 | Lower overhead, faster loop |

## Structured Concurrency (Python 3.11+)

```python
async def main():
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(fetch("/a"))
        t2 = tg.create_task(fetch("/b"))
        t3 = tg.create_task(fetch("/c"))
    # All tasks complete here. Any failure cancels others + raises ExceptionGroup.
```

- `TaskGroup`: if any child task fails, others are cancelled. Ensures no orphaned tasks.
- `ExceptionGroup`: collects multiple exceptions (native in 3.11+)
