# Go Concurrency Patterns

## Goroutines
```go
// Start goroutine
go func() {
    // work
}()

// With parameters
go process(data)

// Anonymous with capture
for i := 0; i < 10; i++ {
    i := i  // Capture loop variable
    go func() {
        fmt.Println(i)
    }()
}
```

## Channels
```go
// Unbuffered (synchronous)
ch := make(chan int)

// Buffered (asynchronous up to capacity)
ch := make(chan int, 100)

// Send
ch <- value

// Receive
value := <-ch

// Close (only sender should close)
close(ch)

// Range over channel
for v := range ch {
    // process v
}

// Non-blocking send/receive
select {
case ch <- value:
    // sent
default:
    // would block
}

select {
case value := <-ch:
    // received
default:
    // would block
}
```

## Worker Pool
```go
func worker(id int, jobs <-chan Job, results chan<- Result) {
    for job := range jobs {
        result := process(job)
        results <- result
    }
}

func main() {
    jobs := make(chan Job, 100)
    results := make(chan Result, 100)
    
    // Start workers
    for w := 1; w <= 3; w++ {
        go worker(w, jobs, results)
    }
    
    // Send jobs
    for j := 1; j <= 9; j++ {
        jobs <- Job{j}
    }
    close(jobs)
    
    // Collect results
    for a := 1; a <= 9; a++ {
        <-results
    }
}
```

## Fan-out / Fan-in
```go
// Fan-out: distribute work to multiple workers
func fanOut(in <-chan int, workers int) []<-chan int {
    outs := make([]<-chan int, workers)
    for i := 0; i < workers; i++ {
        out := make(chan int)
        outs[i] = out
        go func() {
            defer close(out)
            for v := range in {
                out <- process(v)
            }
        }()
    }
    return outs
}

// Fan-in: merge multiple channels
func fanIn(channels ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup
    wg.Add(len(channels))
    for _, ch := range channels {
        go func(c <-chan int) {
            defer wg.Done()
            for v := range c {
                out <- v
            }
        }(ch)
    }
    go func() {
        wg.Wait()
        close(out)
    }()
    return out
}
```

## Pipeline
```go
// Stage 1: Generate
func gen(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

// Stage 2: Square
func sq(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

// Stage 3: Filter
func filter(in <-chan int, predicate func(int) bool) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            if predicate(n) {
                out <- n
            }
        }
        close(out)
    }()
    return out
}

// Usage
ch := gen(1, 2, 3, 4, 5)
ch = sq(ch)
ch = filter(ch, func(n int) bool { return n > 10 })
for n := range ch {
    fmt.Println(n)
}
```

## Context (Cancellation & Timeouts)
```go
// With timeout
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

// With cancel
ctx, cancel := context.WithCancel(context.Background())
defer cancel()

// With deadline
ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(5*time.Second))
defer cancel()

// With value
ctx = context.WithValue(ctx, "requestID", "123")

// Usage in goroutine
func doWork(ctx context.Context) {
    select {
    case <-ctx.Done():
        return // ctx.Err() = context.DeadlineExceeded or context.Canceled
    case result := <-work():
        // process
    }
}

// HTTP request with context
req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
resp, err := client.Do(req)
```

## sync Package

### WaitGroup
```go
var wg sync.WaitGroup

wg.Add(1)
go func() {
    defer wg.Done()
    // work
}()

wg.Wait()  // Block until all done
```

### Mutex
```go
var mu sync.Mutex
var counter int

func increment() {
    mu.Lock()
    defer mu.Unlock()
    counter++
}

// RWMutex (multiple readers, single writer)
var rwmu sync.RWMutex
var data map[string]string

func read(key string) string {
    rwmu.RLock()
    defer rwmu.RUnlock()
    return data[key]
}

func write(key, value string) {
    rwmu.Lock()
    defer rwmu.Unlock()
    data[key] = value
}
```

### Once
```go
var once sync.Once
var instance *Singleton

func GetInstance() *Singleton {
    once.Do(func() {
        instance = &Singleton{}
    })
    return instance
}
```

### Cond (Condition Variable)
```go
var mu sync.Mutex
var cond = sync.NewCond(&mu)
var ready bool

func wait() {
    mu.Lock()
    for !ready {
        cond.Wait()
    }
    mu.Unlock()
}

func signal() {
    mu.Lock()
    ready = true
    cond.Broadcast()
    mu.Unlock()
}
```

### Pool (Object Reuse)
```go
var pool = sync.Pool{
    New: func() interface{} {
        return &bytes.Buffer{}
    },
}

func process() {
    buf := pool.Get().(*bytes.Buffer)
    defer pool.Put(buf)
    buf.Reset()
    // use buf
}
```

## Errgroup (Goroutine Group with Error Handling)
```go
import "golang.org/x/sync/errgroup"

func fetchAll(urls []string) error {
    g, ctx := errgroup.WithContext(context.Background())
    
    for _, url := range urls {
        url := url // capture
        g.Go(func() error {
            req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
            resp, err := http.DefaultClient.Do(req)
            if err != nil {
                return err
            }
            defer resp.Body.Close()
            return nil
        })
    }
    
    return g.Wait() // Returns first error, cancels others
}
```

## Semaphore (Limited Concurrency)
```go
// Buffered channel as semaphore
sem := make(chan struct{}, 10) // Max 10 concurrent

func doWork() {
    sem <- struct{}{}        // Acquire
    defer func() { <-sem }() // Release
    // work
}

// Or with context
func doWorkCtx(ctx context.Context) error {
    select {
    case sem <- struct{}{}:
        defer func() { <-sem }()
        // work
        return nil
    case <-ctx.Done():
        return ctx.Err()
    }
}
```

## Rate Limiting
```go
// Token bucket
limiter := rate.NewLimiter(rate.Every(time.Second), 10) // 10/sec, burst 10

func handle() {
    if !limiter.Allow() {
        // rate limited
        return
    }
    // process
}

// Wait for token
func handleWait(ctx context.Context) error {
    return limiter.Wait(ctx)
}

// Burst with reserve
func handleReserve() {
    r := limiter.Reserve()
    if !r.OK() {
        return
    }
    time.Sleep(r.Delay())
    // process
}
```

## Atomic Operations
```go
import "sync/atomic"

var counter int64

atomic.AddInt64(&counter, 1)
atomic.LoadInt64(&counter)
atomic.StoreInt64(&counter, 0)
atomic.CompareAndSwapInt64(&counter, old, new)

// For bool
var flag int32
atomic.StoreInt32(&flag, 1)
if atomic.LoadInt32(&flag) == 1 { ... }
```

## Select Statement
```go
select {
case msg := <-ch1:
    // handle ch1
case ch2 <- val:
    // sent to ch2
case <-time.After(5 * time.Second):
    // timeout
case <-ctx.Done():
    // cancelled
default:
    // non-blocking
}
```

## Common Patterns

### Generator (returns channel)
```go
func generate(ctx context.Context, nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums {
            select {
            case out <- n:
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}
```

### Bridge (merge channels)
```go
func bridge(ctx context.Context, channels ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup
    wg.Add(len(channels))
    for _, ch := range channels {
        go func(c <-chan int) {
            defer wg.Done()
            for v := range c {
                select {
                case out <- v:
                case <-ctx.Done():
                    return
                }
            }
        }(ch)
    }
    go func() {
        wg.Wait()
        close(out)
    }()
    return out
}
```

### Tee (duplicate channel)
```go
func tee(ctx context.Context, in <-chan int) (_, _ <-chan int) {
    out1 := make(chan int)
    out2 := make(chan int)
    go func() {
        defer close(out1)
        defer close(out2)
        for v := range in {
            var wg sync.WaitGroup
            wg.Add(2)
            go func() {
                defer wg.Done()
                select { case out1 <- v: case <-ctx.Done(): }
            }()
            go func() {
                defer wg.Done()
                select { case out2 <- v: case <-ctx.Done(): }
            }()
            wg.Wait()
        }
    }()
    return out1, out2
}
```

## Best Practices

1. **Don't communicate by sharing memory; share memory by communicating**
2. **Always close channels from sender side**
3. **Use context for cancellation**
4. **Avoid goroutine leaks** - ensure goroutines can exit
5. **Use buffered channels for throughput, unbuffered for synchronization**
6. **Prefer sync.Once for initialization**
7. **Use errgroup for parallel tasks with error handling**
8. **Limit concurrency with semaphores**
9. **Profile with `go tool pprof` and `go test -race`**

## Debugging
```bash
# Race detector
go test -race ./...
go run -race main.go

# Profiler
import _ "net/http/pprof"
go func() { log.Println(http.ListenAndServe("localhost:6060", nil)) }()

# Then: go tool pprof http://localhost:6060/debug/pprof/goroutine
# Or: go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
```