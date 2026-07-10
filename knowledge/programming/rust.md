# Rust Programming Basics

## Why Rust
- **Memory safety without garbage collection**: ownership system guarantees no null pointers, dangling pointers, data races, buffer overflows at compile time
- **Zero-cost abstractions**: high-level constructs compile to efficient code, no runtime overhead
- **Strong type system**: algebraic data types (enums + pattern matching), traits, generics
- **Tooling**: Cargo (build/package manager), rustfmt, clippy (linter), rust-analyzer (LSP)
- Great for: systems programming, CLI tools, web assembly, embedded, game engines

## Ownership Rules
1. Each value has exactly one owner at a time
2. When owner goes out of scope, value is dropped
3. You can have: one mutable reference OR any number of immutable references (not both)
4. References must always be valid

```rust
fn main() {
    // Ownership moves
    let s1 = String::from("hello");
    let s2 = s1;            // s1 MOVED to s2, s1 no longer valid
    // println!("{}", s1);  // ERROR: s1 moved

    // Clone (deep copy)
    let s1 = String::from("hello");
    let s2 = s1.clone();    // deep copy
    println!("{} {}", s1, s2);  // OK

    // Copy types (stack-only: integers, bools, floats, chars, tuples of Copy types)
    let x = 5;
    let y = x;              // COPY (implements Copy trait)
    println!("{} {}", x, y); // OK

    // Borrowing (references)
    let s = String::from("hello");
    let len = calculate_length(&s);  // &s borrows, doesn't take ownership
    println!("{} has length {}", s, len);  // s still usable
}

fn calculate_length(s: &String) -> usize {
    s.len()
}  // s goes out of scope but since it's a reference, nothing happens
```

## Borrowing & References
```rust
// Mutable reference (one at a time)
let mut s = String::from("hello");
let r1 = &mut s;          // OK - first mutable ref
// let r2 = &mut s;        // ERROR - can't have two mutable refs
r1.push_str(", world");

// Dangling reference prevention (compiler won't allow)
// fn dangle() -> &String {  // ERROR: returns reference to dropped String
//     let s = String::from("hello");
//     &s
// }  // s dropped here

// Correct: return the String (ownership moves out)
fn no_dangle() -> String {
    let s = String::from("hello");
    s
}
```

## Basic Syntax
```rust
// Variables (immutable by default)
let x = 5;           // immutable
let mut y = 10;      // mutable
y = 15;
const MAX: u32 = 100;

// Types
let a: i32 = -10;    // i8, i16, i32, i64, i128, isize
let b: u32 = 10;     // u8, u16, u32, u64, u128, usize
let f: f64 = 3.14;   // f32, f64
let b: bool = true;
let c: char = 'z';   // 4 bytes, unicode

// Tuples
let tup: (i32, f64, u8) = (500, 6.4, 1);
let (x, y, z) = tup;  // destructuring

// Arrays (fixed size)
let arr: [i32; 3] = [1, 2, 3];
let first = arr[0];

// Vectors (dynamic)
let mut v = Vec::new();
v.push(1);
let v = vec![1, 2, 3];  // macro

// Strings
let s = "hello";              // &str (string slice, immutable, UTF-8)
let s = String::from("hello"); // String (heap-allocated, growable)
```

## Pattern Matching
```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => {
            println!("Lucky penny!");
            1
        },
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}

// With bindings
enum UsState { Alabama, Alaska }
enum Coin { Penny, Quarter(UsState) }
fn value(coin: Coin) -> u8 {
    match coin {
        Coin::Quarter(state) => {
            println!("Quarter from {:?}!", state);
            25
        },
        _ => 0,  // catch-all
    }
}

// if let (for single pattern)
let config_max = Some(3u8);
if let Some(max) = config_max {
    println!("Maximum is {}", max);
}
```

## Error Handling
```rust
// Result enum
enum Result<T, E> {
    Ok(T),
    Err(E),
}

fn read_username(path: &str) -> Result<String, io::Error> {
    let f = File::open(path);
    let mut f = match f {
        Ok(file) => file,
        Err(e) => return Err(e),
    };
    let mut s = String::new();
    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(e) => Err(e),
    }
}

// ? operator (shorthand — returns error if Err, unwraps if Ok)
fn read_username_short(path: &str) -> Result<String, io::Error> {
    let mut f = File::open(path)?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}

// Even shorter
fn read_username_shorter(path: &str) -> Result<String, io::Error> {
    let mut s = String::new();
    File::open(path)?.read_to_string(&mut s)?;
    Ok(s)
}

// panic! (for unrecoverable errors)
fn main() {
    panic!("crash and burn");
}
```

## Traits & Generics
```rust
// Define trait
trait Summary {
    fn summarize(&self) -> String;
    fn default_summary(&self) -> String {
        String::from("(Read more...)")  // default implementation
    }
}

// Implement trait
struct Article {
    headline: String,
    content: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{}: {}", self.headline, self.content[..50].to_string())
    }
}

// Generic function with trait bound
fn notify<T: Summary>(item: &T) {
    println!("Breaking news! {}", item.summarize());
}

// or with where clause
fn notify2<T>(item: &T) where T: Summary {
    println!("{}", item.summarize());
}

// Multiple trait bounds
use std::fmt::Display;
fn some_function<T: Summary + Display>(t: &T) { }

// impl Trait syntax (for simple cases)
fn notify3(item: &impl Summary) { }

// Generic struct
struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

// Generic method with trait bound
impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("Largest: {}", self.x);
        } else {
            println!("Largest: {}", self.y);
        }
    }
}
```

## Common Collections & Methods
```rust
// Vec
let mut v = vec![1, 2, 3];
v.push(4);
v.pop();              // removes last, returns Option<T>
v.iter()              // iterate (borrowed)
v.iter_mut()          // iterate (mutable)
v.into_iter()         // consume
v.len()
v.is_empty()
v.contains(&x)

// HashMap
use std::collections::HashMap;
let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);
scores.entry(String::from("Yellow")).or_insert(50);
let team = String::from("Blue");
scores.get(&team);  // Option<&V>

// Iterator chain
let sum: i32 = vec![1, 2, 3]
    .iter()
    .filter(|x| *x % 2 == 0)
    .map(|x| x * 2)
    .sum();
```

## Concurrency
```rust
use std::thread;
use std::sync::mpsc;  // multiple producer, single consumer
use std::sync::{Arc, Mutex};

// Threads
let handle = thread::spawn(move || {
    // code runs in new thread
    println!("Hello from thread!");
});
handle.join().unwrap();  // wait for thread

// Message passing (channels)
let (tx, rx) = mpsc::channel();
thread::spawn(move || {
    tx.send(String::from("hello")).unwrap();
});
let received = rx.recv().unwrap();  // blocks

// Shared state (Mutex)
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
for handle in handles {
    handle.join().unwrap();
}
println!("Result: {}", *counter.lock().unwrap()); // 10
```
