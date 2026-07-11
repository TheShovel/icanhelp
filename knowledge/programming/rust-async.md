# Rust Async Programming

## Futures

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

struct MyFuture {
    count: u32,
}

impl Future for MyFuture {
    type Output = u32;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        if self.count < 3 {
            self.count += 1;
            cx.waker().wake_by_ref();
            Poll::Pending
        } else {
            Poll::Ready(self.count)
        }
    }
}

async fn example() {
    let fut = MyFuture { count: 0 };
    let result = fut.await;
    println!("Result: {}", result);
}
```

## Async/Await Basics

```rust
async fn fetch_data() -> Result<String, reqwest::Error> {
    let response = reqwest::get("https://api.example.com/data").await?;
    let text = response.text().await?;
    Ok(text)
}

async fn process() {
    match fetch_data().await {
        Ok(data) => println!("Data: {}", data),
        Err(e) => eprintln!("Error: {}", e),
    }
}

#[tokio::main]
async fn main() {
    process().await;
}
```

## Tokio Runtime

### Basic Setup

```toml
# Cargo.toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let handle = tokio::spawn(async {
        sleep(Duration::from_secs(1)).await;
        println!("Task completed");
    });

    handle.await.unwrap();
}
```

### Runtime Configuration

```rust
// Multi-threaded (default)
#[tokio::main]
async fn main() { }

// Current-thread (single-threaded)
#[tokio::main(flavor = "current_thread")]
async fn main() { }

// Custom runtime
fn main() {
    let rt = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(4)
        .enable_all()
        .build()
        .unwrap();

    rt.block_on(async {
        // async code
    });
}
```

## Spawning Tasks

```rust
use tokio::task;

async fn background_work() {
    task::spawn(async {
        // Fire and forget
        println!("Background task");
    });

    // With handle
    let handle = task::spawn(async {
        42
    });
    let result = handle.await.unwrap();
    println!("Result: {}", result);
}
```

### Blocking Operations

```rust
use tokio::task;

async fn run_blocking() {
    // Run blocking code on separate thread pool
    let result = task::spawn_blocking(|| {
        // CPU-intensive or blocking I/O
        std::thread::sleep(std::time::Duration::from_secs(1));
        42
    }).await.unwrap();

    println!("Blocking result: {}", result);
}
```

## Channels

### mpsc (Multi-Producer, Single-Consumer)

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel(32);

    tokio::spawn(async move {
        for i in 0..10 {
            tx.send(i).await.unwrap();
        }
    });

    while let Some(value) = rx.recv().await {
        println!("Received: {}", value);
    }
}
```

### oneshot (Single Producer, Single Consumer)

```rust
use tokio::sync::oneshot;

async fn compute() -> i32 {
    42
}

#[tokio::main]
async fn main() {
    let (tx, rx) = oneshot::channel();

    tokio::spawn(async move {
        let result = compute().await;
        tx.send(result).unwrap();
    });

    let result = rx.await.unwrap();
    println!("Result: {}", result);
}
```

### broadcast (Multi-Producer, Multi-Consumer)

```rust
use tokio::sync::broadcast;

#[tokio::main]
async fn main() {
    let (tx, mut rx1) = broadcast::channel(16);
    let mut rx2 = tx.subscribe();

    tokio::spawn(async move {
        for i in 0..5 {
            tx.send(i).unwrap();
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
    });

    tokio::spawn(async move {
        while let Ok(msg) = rx1.recv().await {
            println!("Rx1: {}", msg);
        }
    });

    tokio::spawn(async move {
        while let Ok(msg) = rx2.recv().await {
            println!("Rx2: {}", msg);
        }
    });

    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
}
```

### watch (Single Producer, Multi-Consumer - Latest Value)

```rust
use tokio::sync::watch;

#[tokio::main]
async fn main() {
    let (tx, mut rx) = watch::channel(0);

    tokio::spawn(async move {
        for i in 1..=5 {
            tx.send(i).unwrap();
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
    });

    tokio::spawn(async move {
        while rx.changed().await.is_ok() {
            println!("Value: {}", *rx.borrow());
        }
    });

    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
}
```

## Synchronization Primitives

### Mutex

```rust
use tokio::sync::Mutex;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    let data = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let data = Arc::clone(&data);
        handles.push(tokio::spawn(async move {
            let mut guard = data.lock().await;
            *guard += 1;
        }));
    }

    for handle in handles {
        handle.await.unwrap();
    }

    println!("Final: {}", *data.lock().await);
}
```

### RwLock

```rust
use tokio::sync::RwLock;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    let data = Arc::new(RwLock::new(vec![]));
    let mut handles = vec![];

    // Writers
    for i in 0..5 {
        let data = Arc::clone(&data);
        handles.push(tokio::spawn(async move {
            let mut guard = data.write().await;
            guard.push(i);
        }));
    }

    // Readers
    for _ in 0..5 {
        let data = Arc::clone(&data);
        handles.push(tokio::spawn(async move {
            let guard = data.read().await;
            println!("Read: {:?}", *guard);
        }));
    }

    for handle in handles {
        handle.await.unwrap();
    }
}
```

### Semaphore

```rust
use tokio::sync::Semaphore;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    let semaphore = Arc::new(Semaphore::new(3)); // Max 3 concurrent
    let mut handles = vec![];

    for i in 0..10 {
        let sem = Arc::clone(&semaphore);
        handles.push(tokio::spawn(async move {
            let _permit = sem.acquire().await.unwrap();
            println!("Task {} running", i);
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            println!("Task {} done", i);
        }));
    }

    for handle in handles {
        handle.await.unwrap();
    }
}
```

### Barrier

```rust
use tokio::sync::Barrier;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    let barrier = Arc::new(Barrier::new(3));
    let mut handles = vec![];

    for i in 0..3 {
        let b = Arc::clone(&barrier);
        handles.push(tokio::spawn(async move {
            println!("Task {} waiting at barrier", i);
            b.wait().await;
            println!("Task {} passed barrier", i);
        }));
    }

    for handle in handles {
        handle.await.unwrap();
    }
}
```

### Notify

```rust
use tokio::sync::Notify;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    let notify = Arc::new(Notify::new());
    let notify2 = Arc::clone(&notify);

    tokio::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        println!("Notifying...");
        notify2.notify_one();
    });

    println!("Waiting for notification...");
    notify.notified().await;
    println!("Notified!");
}
```

## Time & Timers

```rust
use tokio::time::{sleep, timeout, Duration, Instant};

#[tokio::main]
async fn main() {
    // Sleep
    sleep(Duration::from_secs(1)).await;

    // Timeout
    match timeout(Duration::from_secs(1), long_operation()).await {
        Ok(result) => println!("Result: {}", result),
        Err(_) => println!("Timed out"),
    }

    // Interval
    let mut interval = tokio::time::interval(Duration::from_millis(500));
    for _ in 0..5 {
        interval.tick().await;
        println!("Tick");
    }

    // Sleep until
    let deadline = Instant::now() + Duration::from_secs(2);
    sleep_until(deadline).await;
}
```

## Select! Macro

```rust
use tokio::select;
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx1, mut rx1) = mpsc::channel(1);
    let (tx2, mut rx2) = mpsc::channel(1);

    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_millis(100)).await;
        tx1.send("from 1").await.unwrap();
    });

    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_millis(200)).await
        tx2.send("from 2").await.unwrap();
    });

    for _ in 0..2 {
        select! {
            msg = rx1.recv() => println!("Got: {:?}", msg),
            msg = rx2.recv() => println!("Got: {:?}", msg),
        }
    }
}
```

### Select with Default

```rust
loop {
    select! {
        msg = rx.recv() => {
            if let Some(msg) = msg {
                println!("Received: {}", msg);
            } else {
                break; // Channel closed
            }
        }
        _ = tokio::time::sleep(Duration::from_secs(1)) => {
            println!("Tick");
        }
    }
}
```

### Select with Timeout

```rust
select! {
    result = long_operation() => println!("Done: {}", result),
    _ = sleep(Duration::from_secs(5)) => println!("Timeout"),
}
```

## Stream Processing

```rust
use tokio_stream::{Stream, StreamExt};
use futures::stream;

async fn process_stream() {
    let stream = stream::iter(1..=10)
        .map(|x| x * 2)
        .filter(|x| *x > 10)
        .take(3);

    // Collect
    let vec: Vec<i32> = stream.collect().await;
    println!("{:?}", vec); // [12, 14, 16]

    // For each
    stream::iter(1..=5).for_each(|x| async move {
        println!("{}", x);
    }).await;
}
```

## Async Traits

```rust
use async_trait::async_trait;

#[async_trait]
trait Database {
    async fn get_user(&self, id: u64) -> Result<User, Error>;
    async fn save_user(&self, user: User) -> Result<(), Error>;
}

struct PostgresDb {
    pool: sqlx::PgPool,
}

#[async_trait]
impl Database for PostgresDb {
    async fn get_user(&self, id: u64) -> Result<User, Error> {
        sqlx::query_as("SELECT * FROM users WHERE id = $1")
            .bind(id)
            .fetch_one(&self.pool)
            .await
            .map_err(Into::into)
    }

    async fn save_user(&self, user: User) -> Result<(), Error> {
        sqlx::query("INSERT INTO users (name) VALUES ($1)")
            .bind(user.name)
            .execute(&self.pool)
            .await
            .map_err(Into::into)?;
        Ok(())
    }
}
```

## Error Handling

```rust
use thiserror::Error;

#[derive(Error, Debug)]
enum MyError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Request error: {0}")]
    Reqwest(#[from] reqwest::Error),

    #[error("Custom error: {message}")]
    Custom { message: String },
}

async fn fetch() -> Result<String, MyError> {
    let response = reqwest::get("https://api.example.com").await?;
    let text = response.text().await?;
    Ok(text)
}
```

## Cancellation

```rust
use tokio::select;
use tokio::sync::oneshot;

async fn cancellable_work(cancel: oneshot::Receiver<()>) {
    loop {
        select! {
            _ = cancel => {
                println!("Cancelled");
                return;
            }
            _ = do_work() => {}
        }
    }
}

#[tokio::main]
async fn main() {
    let (tx, rx) = oneshot::channel();
    
    let handle = tokio::spawn(cancellable_work(rx));
    
    tokio::time::sleep(Duration::from_secs(1)).await;
    tx.send(()).unwrap();
    
    handle.await.unwrap();
}
```

## Graceful Shutdown

```rust
use tokio::signal;
use tokio::sync::broadcast;

#[tokio::main]
async fn main() {
    let (shutdown_tx, _) = broadcast::channel(1);
    
    // Spawn workers
    let mut handles = vec![];
    for i in 0..3 {
        let mut shutdown_rx = shutdown_tx.subscribe();
        handles.push(tokio::spawn(async move {
            loop {
                select! {
                    _ = shutdown_rx.recv() => {
                        println!("Worker {} shutting down", i);
                        break;
                    }
                    _ = do_work() => {}
                }
            }
        }));
    }

    // Wait for Ctrl+C
    signal::ctrl_c().await.unwrap();
    println!("Shutting down...");

    shutdown_tx.send(()).unwrap();

    for handle in handles {
        handle.await.unwrap();
    }
}
```

## Testing Async Code

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_async_function() {
        let result = fetch_data().await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_with_mock() {
        let (tx, rx) = tokio::sync::oneshot::channel();
        
        tokio::spawn(async move {
            tx.send(42).unwrap();
        });
        
        assert_eq!(rx.await.unwrap(), 42);
    }

    #[tokio::test]
    async fn test_timeout() {
        let result = tokio::time::timeout(
            Duration::from_millis(100),
            slow_operation()
        ).await;
        
        assert!(result.is_err());
    }
}
```

## Common Patterns

### Retry with Backoff

```rust
async fn retry_with_backoff<F, Fut, T, E>(
    mut operation: F,
    max_retries: u32,
) -> Result<T, E>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = Result<T, E>>,
    E: std::fmt::Debug,
{
    let mut delay = Duration::from_millis(100);
    
    for attempt in 0..=max_retries {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) if attempt == max_retries => return Err(e),
            Err(e) => {
                eprintln!("Attempt {} failed: {:?}, retrying in {:?}", attempt + 1, e, delay);
                tokio::time::sleep(delay).await;
                delay *= 2;
            }
        }
    }
    unreachable!()
}
```

### Connection Pool

```rust
use tokio::sync::Mutex;
use std::sync::Arc;

struct Pool<T> {
    items: Arc<Mutex<Vec<T>>>,
    factory: fn() -> T,
}

impl<T> Pool<T> {
    fn new(factory: fn() -> T, size: usize) -> Self {
        let mut items = Vec::with_capacity(size);
        for _ in 0..size {
            items.push(factory());
        }
        Self {
            items: Arc::new(Mutex::new(items)),
            factory,
        }
    }

    async fn get(&self) -> PoolItem<T> {
        let mut items = self.items.lock().await;
        let item = items.pop().unwrap_or_else(|| (self.factory)());
        PoolItem {
            item: Some(item),
            pool: Arc::clone(&self.items),
        }
    }
}

struct PoolItem<T> {
    item: Option<T>,
    pool: Arc<Mutex<Vec<T>>>,
}

impl<T> Drop for PoolItem<T> {
    fn drop(&mut self) {
        if let Some(item) = self.item.take() {
            let mut pool = self.pool.blocking_lock();
            pool.push(item);
        }
    }
}

impl<T> std::ops::Deref for PoolItem<T> {
    type Target = T;
    fn deref(&self) -> &Self::Target {
        self.item.as_ref().unwrap()
    }
}
```

## Performance Tips

1. **Use `tokio::spawn` for CPU-bound tasks** (not `spawn_blocking`)
2. **Avoid holding locks across `.await` points**
3. **Use `Arc<Mutex<_>>` for shared state**
4. **Prefer channels over shared state**
5. **Use `select!` for concurrent operations**
6. **Batch operations when possible**
7. **Use `tokio::task::yield_now()` for cooperative yielding**
8. **Profile with `tokio-console`**

```bash
# Install tokio-console
cargo install tokio-console

# Run with console
RUSTFLAGS="--cfg tokio_unstable" cargo run
```

## Debugging

```rust
// Trace async operations
use tracing::{info, instrument};

#[instrument]
async fn my_function(arg: i32) -> Result<String, Error> {
    info!("Starting with arg={}", arg);
    // ...
}
```

```bash
# Enable tracing
RUST_LOG=trace cargo run

# Console subscriber
use tracing_subscriber::fmt;
use tracing_subscriber::prelude::*;

fn main() {
    tracing_subscriber::registry()
        .with(fmt::layer())
        .init();
}
```

## Resources

- [Async Book](https://rust-lang.github.io/async-book/)
- [Tokio Tutorial](https://tokio.rs/tokio/tutorial)
- [Async Std](https://async.rs/)
- [Futures crate](https://docs.rs/futures/)