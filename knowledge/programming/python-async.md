# Python Async Programming

## Overview
Async programming in Python enables concurrent execution of I/O-bound tasks using `async/await` syntax and the `asyncio` event loop. It's essential for high-performance network services, web scrapers, and any application with significant I/O wait time.

## Core Concepts

### The Event Loop
```python
import asyncio

async def main():
    print("Hello")
    await asyncio.sleep(1)  # Yield control
    print("World")

asyncio.run(main())  # Creates and runs event loop
```

### Coroutines vs Functions
| Aspect | Regular Function | Coroutine (async def) |
|--------|------------------|----------------------|
| **Definition** | `def func():` | `async def func():` |
| **Call** | `func()` | `await func()` or `asyncio.create_task()` |
| **Execution** | Immediate | Returns coroutine object |
| **Suspension** | Cannot yield | Can `await` other coroutines |
| **Return** | Direct value | Returns value when awaited |

### Awaitables
- **Coroutines**: `async def` functions
- **Tasks**: `asyncio.create_task(coro)` - schedules on loop
- **Futures**: Low-level awaitable representing result
- **Awaitable objects**: Objects with `__await__()` method

## Basic Patterns

### Sequential vs Concurrent
```python
# Sequential (slow)
async def sequential():
    await fetch_user(1)
    await fetch_user(2)
    await fetch_user(3)

# Concurrent (fast) - gather
async def concurrent_gather():
    await asyncio.gather(
        fetch_user(1),
        fetch_user(2),
        fetch_user(3)
    )

# Concurrent - create_task (fire and forget)
async def concurrent_tasks():
    task1 = asyncio.create_task(fetch_user(1))
    task2 = asyncio.create_task(fetch_user(2))
    task3 = asyncio.create_task(fetch_user(3))
    await task1
    await task2
    await task3
```

### Task Groups (Python 3.11+)
```python
async def with_task_group():
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(fetch_user(1))
        task2 = tg.create_task(fetch_user(2))
        task3 = tg.create_task(fetch_user(3))
    # All completed or exception raised
    results = [task1.result(), task2.result(), task3.result()]
```

## Synchronization Primitives

### Locks
```python
lock = asyncio.Lock()

async def safe_increment():
    async with lock:
        # Critical section
        shared_counter += 1
```

### Semaphores (Limit Concurrency)
```python
semaphore = asyncio.Semaphore(10)  # Max 10 concurrent

async def limited_fetch(url):
    async with semaphore:
        return await fetch(url)
```

### Events
```python
event = asyncio.Event()

async def waiter():
    await event.wait()
    print("Event triggered!")

async def setter():
    await asyncio.sleep(1)
    event.set()
```

### Conditions
```python
condition = asyncio.Condition()

async def consumer():
    async with condition:
        await condition.wait()
        # Process item

async def producer():
    async with condition:
        # Add item
        condition.notify()
```

### Queues
```python
queue = asyncio.Queue(maxsize=100)

async def producer():
    for i in range(100):
        await queue.put(i)

async def consumer():
    while True:
        item = await queue.get()
        await process(item)
        queue.task_done()

async def main():
    await asyncio.gather(producer(), consumer())
    await queue.join()  # Wait for all tasks done
```

## Timeouts & Cancellation

### wait_for (Timeout)
```python
try:
    result = await asyncio.wait_for(slow_operation(), timeout=5.0)
except asyncio.TimeoutError:
    print("Operation timed out")
```

### wait (Multiple with Timeout)
```python
done, pending = await asyncio.wait(
    [task1, task2, task3],
    timeout=5.0,
    return_when=asyncio.FIRST_COMPLETED
)
for task in pending:
    task.cancel()
```

### Shield (Protect from Cancellation)
```python
# This won't be cancelled even if parent is
result = await asyncio.shield(critical_operation())
```

### Cancellation Handling
```python
async def long_running():
    try:
        while True:
            await do_work()
    except asyncio.CancelledError:
        await cleanup()  # Always cleanup!
        raise  # Re-raise to properly cancel
```

## Async I/O Patterns

### HTTP Clients
```python
import aiohttp

async def fetch_all(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        return await asyncio.gather(*tasks)

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.json()

# Connection pooling, retries, timeouts built-in
```

### Database (asyncpg, aiomysql, motor)
```python
import asyncpg

pool = await asyncpg.create_pool(
    host='localhost',
    database='mydb',
    user='user',
    password='pass',
    min_size=10,
    max_size=20
)

async def get_user(user_id):
    async with pool.acquire() as conn:
        return await conn.fetchrow(
            "SELECT * FROM users WHERE id = $1", user_id
        )
```

### File I/O (aiofiles)
```python
import aiofiles

async def read_config():
    async with aiofiles.open('config.json') as f:
        content = await f.read()
    return json.loads(content)

async def write_log(entry):
    async with aiofiles.open('app.log', 'a') as f:
        await f.write(json.dumps(entry) + '\n')
```

## Advanced Patterns

### Rate Limiting
```python
class RateLimiter:
    def __init__(self, rate: float, per: float):
        self.rate = rate
        self.per = per
        self.tokens = rate
        self.last = time.monotonic()
        self.lock = asyncio.Lock()
    
    async def acquire(self):
        async with self.lock:
            now = time.monotonic()
            since_last = now - self.last
            self.tokens = min(self.rate, self.tokens + since_last * self.rate / self.per)
            if self.tokens < 1:
                wait = (1 - self.tokens) * self.per / self.rate
                await asyncio.sleep(wait)
                self.tokens = 0
            else:
                self.tokens -= 1
            self.last = time.monotonic()
```

### Retry with Exponential Backoff
```python
async def retry_with_backoff(
    func, 
    max_attempts=3, 
    base_delay=1.0, 
    max_delay=60.0,
    exceptions=(Exception,)
):
    for attempt in range(max_attempts):
        try:
            return await func()
        except exceptions as e:
            if attempt == max_attempts - 1:
                raise
            delay = min(base_delay * (2 ** attempt), max_delay)
            delay += random.uniform(0, 0.1 * delay)  # Jitter
            await asyncio.sleep(delay)
```

### Circuit Breaker
```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failures = 0
        self.last_failure = None
        self.state = "closed"  # closed, open, half-open
    
    async def call(self, func, *args, **kwargs):
        if self.state == "open":
            if time.time() - self.last_failure > self.timeout:
                self.state = "half-open"
            else:
                raise CircuitOpenError()
        
        try:
            result = await func(*args, **kwargs)
            if self.state == "half-open":
                self.state = "closed"
                self.failures = 0
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure = time.time()
            if self.failures >= self.failure_threshold:
                self.state = "open"
            raise
```

### Batch Processing
```python
async def process_in_batches(items, batch_size=100, processor=None):
    results = []
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        if processor:
            batch_results = await asyncio.gather(*[
                processor(item) for item in batch
            ]
            results.extend(batch_results)
        else:
            results.extend(batch)
    return results
```

## Testing Async Code

### pytest-asyncio
```python
import pytest

@pytest.mark.asyncio
async def test_fetch_user():
    user = await fetch_user(1)
    assert user["id"] == 1

@pytest.mark.asyncio
async def test_concurrent_fetches():
    users = await asyncio.gather(fetch_user(1), fetch_user(2))
    assert len(users) == 2
```

### Mocking Async
```python
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_with_mock():
    with patch('module.fetch_user', new_callable=AsyncMock) as mock:
        mock.return_value = {"id": 1, "name": "Test"}
        user = await fetch_user(1)
        assert user["name"] == "Test"
```

### Testing Timeouts
```python
@pytest.mark.asyncio
async def test_timeout():
    async def slow():
        await asyncio.sleep(10)
    
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(slow(), timeout=0.1)
```

## Integration with Sync Code

### Running Sync in Executor
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

def blocking_cpu_work(data):
    return heavy_computation(data)

async def main():
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, blocking_cpu_work, data)
```

### Sync to Async Bridge
```python
from asgiref.sync import sync_to_async, async_to_sync

# Django ORM example
user = await sync_to_async(User.objects.get)(id=1)

# Call async from sync
result = async_to_sync(async_function)()
```

## Performance Tips

### 1. Reuse Connections
```python
# BAD: New session per request
async def bad():
    async with aiohttp.ClientSession() as session:
        await fetch(session, url)

# GOOD: Reuse session
session = aiohttp.ClientSession()
async def good():
    await fetch(session, url)
```

### 2. Limit Concurrency
```python
# Prevent overwhelming services
semaphore = asyncio.Semaphore(50)

async def fetch_all(urls):
    async def limited_fetch(url):
        async with semaphore:
            return await fetch(url)
    return await asyncio.gather(*[limited_fetch(u) for u in urls])
```

### 3. Use Connection Pools
```python
# Database
pool = await asyncpg.create_pool(min_size=10, max_size=20)

# HTTP
connector = aiohttp.TCPConnector(limit=100, limit_per_host=30)
session = aiohttp.ClientSession(connector=connector)
```

### 4. Avoid Blocking Calls
```python
# BAD
await asyncio.sleep(1)  # OK
time.sleep(1)           # BLOCKS EVENT LOOP!

# BAD
requests.get(url)       # BLOCKS!
# GOOD
await aiohttp.get(url)
```

## Debugging

### Enable Debug Mode
```python
asyncio.run(main(), debug=True)
# Or
loop = asyncio.get_event_loop()
loop.set_debug(True)
```

### Slow Callback Detection
```python
loop.slow_callback_duration = 0.1  # Log callbacks > 100ms
```

### Task Inspection
```python
# Print all running tasks
for task in asyncio.all_tasks():
    print(task.get_name(), task.get_coro())

# Current task
task = asyncio.current_task()
print(task.get_name())
```

### Profiling
```python
import cProfile
import asyncio

async def profiled_main():
    profiler = cProfile.Profile()
    profiler.enable()
    await main()
    profiler.disable()
    profiler.print_stats(sort='cumulative')

asyncio.run(profiled_main())
```

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Forgetting `await` | Coroutine never runs, warning issued |
| Blocking the loop | Use `run_in_executor` for CPU/blocking I/O |
| Not handling exceptions | Use `try/except` in each task, `TaskGroup` |
| Creating too many tasks | Use `Semaphore` or batch processing |
| Mixing sync/async incorrectly | Use `sync_to_async` / `async_to_sync` |
| Not closing resources | Use `async with` context managers |
| Cancellation not propagated | Re-raise `CancelledError` after cleanup |

## Modern Async Libraries (2024)

| Category | Library | Use Case |
|----------|---------|----------|
| **HTTP** | `httpx`, `aiohttp` | Client/server |
| **Web Framework** | `FastAPI`, `Starlette`, `Quart` | APIs |
| **Database** | `asyncpg`, `aiomysql`, `motor`, `Tortoise ORM` | PostgreSQL, MySQL, MongoDB |
| **Redis** | `redis-py` (async), `fakeredis` | Caching, pub/sub |
| **Message Queue** | `aio-pika`, `aiokafka` | RabbitMQ, Kafka |
| **Testing** | `pytest-asyncio`, `anyio` | Async testing |
| **Structured Concurrency** | `asyncio.TaskGroup` (3.11+), `anyio` | Task management |

## Resources
- **Official**: docs.python.org/3/library/asyncio.html
- **AsyncIO Best Practices**: github.com/timofonic/asyncio-best-practices
- **Real Python**: realpython.com/async-io-python/
- **FastAPI Docs**: fastapi.tiangolo.com/async/
- **AnyIO**: anyio.readthedocs.io/ (structured concurrency)