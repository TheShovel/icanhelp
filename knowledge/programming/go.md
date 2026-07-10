# Go (Golang) Basics

## Setup
- `go mod init <module>` — create module
- `go run main.go` — compile + run
- `go build` — compile to binary
- `go test` — run tests
- `go fmt` — format code
- `go vet` — static analysis
- `go mod tidy` — add/remove deps
- `go install <package>@latest` — install tool globally
- Strongly typed, compiled, garbage collected, built-in concurrency

## Syntax
```go
package main

import "fmt"

func main() {
    fmt.Println("Hello")
}

// Variables
var name string = "Alice"
age := 30  // type inference (short declaration)
var x, y int = 1, 2

// Constants
const Pi = 3.14159

// Basic types: bool, string, int/uint (32/64), float32/64, byte, rune, complex64/128
// Zero values: 0 for numbers, false for bool, "" for string, nil for pointers/slices/maps/channels
```

## Collections
```go
// Array (fixed size)
var arr [5]int
arr := [3]int{1, 2, 3}

// Slice (dynamic, pointer to underlying array)
slice := []int{1, 2, 3}
slice = append(slice, 4)
make([]int, 5, 10)  // len=5, cap=10
copy(dst, src)

// Map
m := map[string]int{"a": 1}
m["b"] = 2
val, exists := m["a"]
delete(m, "a")

// Range
for i, v := range slice { }
for k, v := range m { }
for i := range 10 { }  // Go 1.22+
```

## Control Flow
```go
if x > 0 { } else { }
switch x {
case 1: ...
default: ...
}
for i := 0; i < 10; i++ { }
for condition { }  // while
for { }  // infinite
```

## Functions
```go
func add(a, b int) int { return a + b }
func div(a, b int) (int, error) {  // multiple return values
    if b == 0 { return 0, errors.New("div by zero") }
    return a / b, nil
}

// Named return values
func foo() (result int, err error) {
    result = 42
    return  // naked return (use sparingly)
}

// Variadic
func sum(nums ...int) int { }

// Defer (cleanup, runs on function exit)
defer file.Close()

// Function as value
fn := func(s string) { fmt.Println(s) }
```

## Structs & Methods
```go
type User struct {
    ID   int
    Name string
}

u := User{ID: 1, Name: "Alice"}
u.Name = "Bob"

// Method (value receiver — doesn't modify)
func (u User) Greet() string { return "Hi, " + u.Name }

// Method (pointer receiver — can modify)
func (u *User) SetName(name string) { u.Name = name }

// Composition (instead of inheritance)
type Admin struct {
    User          // embedded (promoted fields)
    Role string
}
```

## Interfaces
```go
type Stringer interface {
    String() string
}

// Implicit implementation — no "implements" keyword
func (u User) String() string { return u.Name }

// Any type satisfies empty interface (avoid, use `any` alias)
var x any = "anything"

// Type assertion
val, ok := x.(string)

// Type switch
switch v := x.(type) {
case string: ...
case int: ...
default: ...
}
```

## Error Handling
```go
// Errors are values, not exceptions
result, err := doSomething()
if err != nil {
    return fmt.Errorf("doSomething failed: %w", err)  // wrap with %w
}

// Sentinel errors
var ErrNotFound = errors.New("not found")
if errors.Is(err, ErrNotFound) { }

// Custom error type
type MyError struct { Code int; Msg string }
func (e *MyError) Error() string { return fmt.Sprintf("%d: %s", e.Code, e.Msg) }
var e *MyError
if errors.As(err, &e) { }
```

## Concurrency
```go
// Goroutine (lightweight thread)
go func() { fmt.Println("async") }()

// Channel (communication between goroutines)
ch := make(chan int)
go func() { ch <- 42 }()
val := <-ch

// Buffered channel
ch := make(chan int, 10)

// Select (wait on multiple channels)
select {
case v := <-ch1: ...
case ch2 <- 5: ...
case <-time.After(1 * time.Second): ...  // timeout
default: ...  // non-blocking
}

// WaitGroup
var wg sync.WaitGroup
wg.Add(1)
go func() { defer wg.Done(); ... }()
wg.Wait()

// Mutex
var mu sync.Mutex
mu.Lock()
// critical section
mu.Unlock()

// Once (run exactly once)
var once sync.Once
once.Do(func() { ... })

// Context (cancellation, deadlines)
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
```

## Concurrency Pattern (Fan-Out)
```go
func main() {
    jobs := []int{1, 2, 3, 4, 5}
    results := make(chan int, len(jobs))
    
    var wg sync.WaitGroup
    for _, j := range jobs {
        wg.Add(1)
        go func(job int) {
            defer wg.Done()
            results <- process(job)
        }(j)
    }
    wg.Wait()
    close(results)
    
    for r := range results {
        fmt.Println(r)
    }
}
```

## Common Packages
- `fmt` — formatted I/O (Printf, Sprintf)
- `net/http` — HTTP server/client
- `encoding/json` — JSON marshal/unmarshal
- `os` — file I/O, env vars, exit
- `io` / `io/fs` — I/O interfaces
- `time` — time handling, duration, tickers
- `strings` — string manipulation
- `sync` — mutex, waitgroup, once
- `flag` — CLI flags
- `testing` — testing framework
