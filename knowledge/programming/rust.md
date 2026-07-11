# Rust - Systems Programming Language

## Overview
Rust is a systems programming language focused on safety, speed, and concurrency. It achieves memory safety without garbage collection through ownership, borrowing, and lifetimes.

## Core Concepts

### Ownership
```rust
// Each value has a single owner
let s1 = String::from("hello");
let s2 = s1;  // s1 moved to s2, s1 no longer valid

// Clone for deep copy
let s3 = s2.clone();

// Functions take ownership
fn take_ownership(s: String) { println!("{}", s); }
take_ownership(s2);  // s2 moved

// Return ownership
fn give_ownership() -> String {
    String::from("hello")
}
let s4 = give_ownership();
```

### Borrowing & References
```rust
let s = String::from("hello");

// Immutable borrow (multiple allowed)
let r1 = &s;
let r2 = &s;
println!("{} {}", r1, r2);

// Mutable borrow (only one allowed, no immutable at same time)
let mut s = String::from("hello");
let r = &mut s;
r.push_str(" world");

// Slices
let s = String::from("hello world");
let hello = &s[0..5];
let world = &s[6..11];
```

### Lifetimes
```rust
// Explicit lifetime annotation
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// Struct with lifetime
struct ImportantExcerpt<'a> {
    part: &'a str,
}

impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 { 3 }
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("Attention: {}", announcement);
        self.part
    }
}

// Static lifetime
let s: &'static str = "I have a static lifetime";
```

## Data Types

### Primitives
```rust
// Integers
let x: i32 = -42;
let y: u64 = 100;
let z = 57u8;  // suffix

// Floats
let f: f64 = 3.14;
let f32: f32 = 2.718;

// Boolean
let t = true;
let f: bool = false;

// Char (Unicode scalar value)
let c = 'z';
let heart = '❤';
let chinese = '中';

// Tuple
let tup: (i32, f64, u8) = (500, 6.4, 1);
let (x, y, z) = tup;  // destructuring

// Array (fixed size)
let arr: [i32; 5] = [1, 2, 3, 4, 5];
let first = arr[0];

// Vector (dynamic array)
let mut v = Vec::new();
v.push(1);
let v = vec![1, 2, 3];
```

### Strings
```rust
// String (heap-allocated, growable)
let mut s = String::new();
s.push_str("hello");
let s = String::from("hello");
let s = "hello".to_string();

// &str (string slice)
let s: &str = "hello";
let slice = &s[0..3];

// Formatting
let s = format!("{} {}", "hello", "world");
println!("{}", s);
```

### Option & Result
```rust
// Option<T> - value or nothing
let some = Some(5);
let none: Option<i32> = None;

match some {
    Some(x) => println!("{}", x),
    None => println!("none"),
}

// Shorthand
if let Some(x) = some { println!("{}", x); }
let x = some.unwrap_or(0);
let x = some.expect("should have value");

// Result<T, E> - success or error
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 { Err("division by zero".to_string()) }
    else { Ok(a / b) }
}

match divide(10.0, 2.0) {
    Ok(result) => println!("{}", result),
    Err(e) => println!("Error: {}", e),
}

// ? operator for early return
fn read_file() -> Result<String, std::io::Error> {
    let mut s = String::new();
    std::fs::File::open("file.txt")?.read_to_string(&mut s)?;
    Ok(s)
}
```

## Control Flow

### Match
```rust
match value {
    1 => println!("one"),
    2 | 3 => println!("two or three"),
    4..=10 => println!("four to ten"),
    n if n % 2 == 0 => println!("even"),
    _ => println!("something else"),
}

// Match on Option/Result
match option {
    Some(x) => x,
    None => default,
}

// Match guard
match x {
    Some(n) if n > 0 => println!("positive"),
    Some(n) => println!("non-positive"),
    None => println!("none"),
}
```

### Loops
```rust
// loop
loop {
    if condition { break; }
}

// while
while condition {
    // ...
}

// for
for i in 1..=5 {  // inclusive range
    println!("{}", i);
}
for (i, v) in vec.iter().enumerate() { }

// Loop labels
'outer: loop {
    loop {
        break 'outer;
    }
}
```

## Functions

```rust
// Basic
fn add(a: i32, b: i32) -> i32 {
    a + b  // implicit return
}

// Multiple parameters
fn print_info(name: &str, age: u32) {
    println!("{} is {}", name, age);
}

// Diverging functions (never return)
fn panic_fn() -> ! {
    panic!("This function never returns");
}

// Closures
let add = |a, b| a + b;
let add = |a: i32, b: i32| -> i32 { a + b };

// Capturing environment
let x = 4;
let equal_to_x = |z| z == x;

// Fn, FnMut, FnOnce traits
fn apply<F>(f: F) where F: FnOnce() {
    f();
}
```

## Structs & Enums

### Structs
```rust
// Classic struct
struct User {
    name: String,
    email: String,
    active: bool,
}

let user = User {
    name: String::from("John"),
    email: String::from("john@example.com"),
    active: true,
};

// Tuple struct
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

let black = Color(0, 0, 0);

// Unit struct
struct AlwaysEqual;

// Methods
impl User {
    fn new(name: String, email: String) -> User {
        User { name, email, active: true }
    }
    
    fn email(&self) -> &str {
        &self.email
    }
    
    fn deactivate(&mut self) {
        self.active = false;
    }
}

let mut user = User::new("John".into(), "john@example.com".into());
user.deactivate();
```

### Enums
```rust
enum IpAddrKind {
    V4,
    V6,
}

enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}

let home = IpAddr::V4(127, 0, 0, 1);
let loopback = IpAddr::V6(String::from("::1"));

// Option (built-in)
enum Option<T> {
    None,
    Some(T),
}

// Result (built-in)
enum Result<T, E> {
    Ok(T),
    Err(E),
}

// Methods on enums
impl IpAddr {
    fn display(&self) {
        match self {
            IpAddr::V4(a, b, c, d) => println!("{}.{}.{}.{}", a, b, c, d),
            IpAddr::V6(s) => println!("{}", s),
        }
    }
}
```

## Generics & Traits

### Generics
```rust
// Generic function
fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
    let mut largest = list[0];
    for &item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

// Generic struct
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T { &self.x }
}

// Multiple generics
struct Pair<T, U> {
    first: T,
    second: U,
}
```

### Traits
```rust
// Trait definition
pub trait Summary {
    fn summarize(&self) -> String;
    
    // Default implementation
    fn summarize_author(&self) -> String {
        String::from("(Unknown)")
    }
}

// Implementation
struct Article {
    headline: String,
    author: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{} by {}", self.headline, self.author)
    }
}

// Trait bounds
fn notify(item: &impl Summary) {
    println!("{}", item.summarize());
}

// Trait bound syntax
fn notify<T: Summary>(item: &T) { }

// Multiple bounds
fn notify(item: &(impl Summary + Display)) { }
fn notify<T: Summary + Display>(item: &T) { }

// Where clause
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{ }

// Returning types that implement traits
fn returns_summarizable() -> impl Summary {
    Article { headline: String::from("..."), author: String::from("...") }
}

// Trait objects (dynamic dispatch)
let items: Vec<Box<dyn Summary>> = vec![
    Box::new(Article { ... }),
    Box::new(Tweet { ... }),
];
```

## Collections

### Vector
```rust
let mut v = Vec::new();
v.push(1);
let v = vec![1, 2, 3];

let third = &v[2];  // panics if out of bounds
let third = v.get(2);  // returns Option

for i in &v { println!("{}", i); }
for i in &mut v { *i += 10; }
```

### HashMap
```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Red"), 50);

// Access
let score = scores.get(&String::from("Blue")).copied().unwrap_or(0);

// Iterate
for (key, value) in &scores {
    println!("{}: {}", key, value);
}

// Update
scores.entry(String::from("Yellow")).or_insert(50);
scores.entry(String::from("Blue")).and_modify(|v| *v += 10);
```

### HashSet
```rust
use std::collections::HashSet;

let mut set = HashSet::new();
set.insert(1);
set.insert(2);

let intersection: HashSet<_> = set1.intersection(&set2).collect();
let union: HashSet<_> = set1.union(&set2).collect();
let difference: HashSet<_> = set1.difference(&set2).collect();
```

## Error Handling

### Custom Error Types
```rust
use std::fmt;
use std::error::Error;

#[derive(Debug)]
enum MyError {
    Io(std::io::Error),
    Parse(std::num::ParseIntError),
    Custom(String),
}

impl fmt::Display for MyError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            MyError::Io(e) => write!(f, "IO error: {}", e),
            MyError::Parse(e) => write!(f, "Parse error: {}", e),
            MyError::Custom(s) => write!(f, "Custom error: {}", s),
        }
    }
}

impl Error for MyError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            MyError::Io(e) => Some(e),
            MyError::Parse(e) => Some(e),
            MyError::Custom(_) => None,
        }
    }
}

// From implementations for ? operator
impl From<std::io::Error> for MyError {
    fn from(e: std::io::Error) -> Self { MyError::Io(e) }
}
impl From<std::num::ParseIntError> for MyError {
    fn from(e: std::num::ParseIntError) -> Self { MyError::Parse(e) }
}
```

## Concurrency

### Threads
```rust
use std::thread;
use std::time::Duration;

let handle = thread::spawn(|| {
    for i in 1..10 {
        println!("hi number {} from spawned thread!", i);
        thread::sleep(Duration::from_millis(1));
    }
});

for i in 1..5 {
    println!("hi number {} from main thread!", i);
    thread::sleep(Duration::from_millis(1));
}

handle.join().unwrap();
```

### Channels (Message Passing)
```rust
use std::sync::mpsc;

let (tx, rx) = mpsc::channel();

thread::spawn(move || {
    let val = String::from("hi");
    tx.send(val).unwrap();
});

let received = rx.recv().unwrap();
println!("Got: {}", received);

// Multiple producers
let (tx, rx) = mpsc::channel();
let tx1 = tx.clone();
thread::spawn(move || tx.send(1).unwrap());
thread::spawn(move || tx1.send(2).unwrap());

for received in rx { println!("Got {}", received); }
```

### Shared State (Mutex, Arc)
```rust
use std::sync::{Arc, Mutex};
use std::thread;

let counter = Arc::new(Mutex::new(0));
let mut handles = vec![];

for _ in 0..10 {
    let counter = Arc::clone(&counter);
    let handle = thread::spawn(move || {
        let mut num = counter.lock().unwrap();
        *num += 1;
    });
    handles.push(handle);
}

for handle in handles { handle.join().unwrap(); }
println!("Result: {}", *counter.lock().unwrap());
```

### Async/Await
```rust
use futures::executor::block_on;

async fn hello() {
    println!("Hello");
}

async fn learn_async() {
    let future = hello();
    future.await;
}

// With tokio
#[tokio::main]
async fn main() {
    let handle = tokio::spawn(async {
        println!("Spawned task");
    });
    handle.await.unwrap();
    
    // Channels
    let (tx, mut rx) = tokio::sync::mpsc::channel(32);
    tx.send("hello").await.unwrap();
    println!("Received: {}", rx.recv().await.unwrap());
    
    // Mutex
    let data = Arc::new(tokio::sync::Mutex::new(0));
    let mut handles = vec![];
    for _ in 0..10 {
        let data = data.clone();
        handles.push(tokio::spawn(async move {
            *data.lock().await += 1;
        }));
    }
    for h in handles { h.await.unwrap(); }
    println!("Count: {}", *data.lock().await);
}
```

## Smart Pointers

### Box<T>
```rust
// Heap allocation
let b = Box::new(5);
println!("b = {}", b);

// Recursive types
enum List {
    Cons(i32, Box<List>),
    Nil,
}

let list = List::Cons(1, Box::new(List::Cons(2, Box::new(List::Nil))));
```

### Rc<T> (Reference Counted)
```rust
use std::rc::Rc;

let a = Rc::new(5);
let b = Rc::clone(&a);
let c = Rc::clone(&a);

println!("count = {}", Rc::strong_count(&a));  // 3
```

### RefCell<T> (Interior Mutability)
```rust
use std::cell::RefCell;

let value = RefCell::new(5);
*value.borrow_mut() = 6;
println!("{}", value.borrow());

// Combined with Rc for multiple owners with mutable data
use std::rc::Rc;
let value = Rc::new(RefCell::new(5));
let a = Rc::clone(&value);
let b = Rc::clone(&value);
*b.borrow_mut() += 10;
```

## Testing

### Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    #[should_panic(expected = "division by zero")]
    fn test_divide_by_zero() {
        divide(10, 0);
    }

    #[test]
    fn test_result() -> Result<(), String> {
        let result = divide(10, 2)?;
        assert_eq!(result, 5);
        Ok(())
    }
}
```

### Integration Tests
```bash
# tests/integration_test.rs
use my_crate::add;

#[test]
fn test_add() {
    assert_eq!(add(2, 3), 5);
}
```

### Benchmarks
```rust
#![feature(test)]
extern crate test;

#[bench]
fn bench_add(b: &mut test::Bencher) {
    b.iter(|| add(test::black_box(2), test::black_box(3)));
}
```

## Cargo & Project Structure

### Cargo.toml
```toml
[package]
name = "my_project"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
anyhow = "1.0"
thiserror = "1.0"

[dev-dependencies]
criterion = "0.5"

[[bench]]
name = "my_bench"
harness = false
```

### Workspace
```toml
# Cargo.toml (root)
[workspace]
members = ["crate_a", "crate_b", "crate_c"]
resolver = "2"
```

## Common Patterns

### Builder Pattern
```rust
struct User {
    name: String,
    email: String,
    age: u32,
}

struct UserBuilder {
    name: Option<String>,
    email: Option<String>,
    age: Option<u32>,
}

impl UserBuilder {
    fn new() -> Self { UserBuilder { name: None, email: None, age: None } }
    fn name(mut self, name: impl Into<String>) -> Self { self.name = Some(name.into()); self }
    fn email(mut self, email: impl Into<String>) -> Self { self.email = Some(email.into()); self }
    fn age(mut self, age: u32) -> Self { self.age = Some(age); self }
    fn build(self) -> Result<User, String> {
        Ok(User {
            name: self.name.ok_or("name required")?,
            email: self.email.ok_or("email required")?,
            age: self.age.unwrap_or(0),
        })
    }
}

let user = UserBuilder::new()
    .name("John")
    .email("john@example.com")
    .age(30)
    .build()?;
```

### State Machine Pattern
```rust
struct Draft;
struct Published;
struct Archived;

struct Post<State> {
    content: String,
    state: State,
}

impl Post<Draft> {
    fn new(content: String) -> Self {
        Post { content, state: Draft }
    }
    fn publish(self) -> Post<Published> {
        Post { content: self.content, state: Published }
    }
}

impl Post<Published> {
    fn archive(self) -> Post<Archived> {
        Post { content: self.content, state: Archived }
    }
}
```

## Resources
- [The Rust Book](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [Rustlings](https://github.com/rust-lang/rustlings)
- [Async Rust](https://rust-lang.github.io/async-book/)
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)