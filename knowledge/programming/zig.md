# Zig

## Overview

Zig is a general-purpose systems programming language focused on **robustness, optimality, and clarity**. No hidden control flow, no operator overloading, no exceptions, no garbage collector. Designed for cross-compilation and C interop. Compiler is written in Zig and C++.

## Key Philosophy

- **No hidden allocations**: every allocator is explicit
- **No hidden control flow**: no destructors, no RAII, no operator overload, no exceptions
- **Comptime**: full metaprogramming at compile time — macros, generics, code generation
- **C interop first class**: `@cImport` to import C headers directly; ABI-compatible
- **Cross-compilation**: ships libc + libc++ for all targets — no cross-toolchain needed

## Basic Syntax

```zig
const std = @import("std");

pub fn main() void {
    const name = "World";
    std.debug.print("Hello, {s}!\n", .{name});
}
```

- `const` = immutable (compile-time known or runtime), `var` = mutable
- `pub` = public visibility
- `fn` = function. Return type after parameters.
- `void` = unit type (no value)
- No semicolons after blocks. Semicolons required for statements.

## Comptime (Compile-Time Execution)

Zig's most distinctive feature. `comptime` blocks execute at compile time.

```zig
fn factorial(comptime n: u64) u64 {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
const result = comptime factorial(10); // computed at compile time

fn max(comptime T: type, a: T, b: T) T {
    return if (a > b) a else b;
}
const m = max(u8, 5, 3); // T inferred at compile time
```

- `comptime_int`: arbitrary precision integer (compile time only)
- `comptime_float`: arbitrary precision float
- `@typeInfo`, `@TypeOf`, `@field`, `@hasField`, `@import` — all comptime
- `comptime { ... }` block runs at compile time
- `inline for`, `inline while` — unroll loops at compile time

## Error Union Types

First-class error handling. Functions return `Type!ErrorType` or `!Type`.

```zig
fn parseNumber(s: []const u8) !u64 {
    if (s.len == 0) return error.EmptyInput;
    return std.fmt.parseInt(u64, s, 10);
}

pub fn main() !void {
    const result = parseNumber("42") catch |err| {
        std.debug.print("error: {any}\n", .{err});
        return;
    };
    // or
    const val = try parseNumber("42"); // propagates error
}
```

- Error set: `error{EmptyInput, ParseFailed}` — can define named error sets
- `try` = `catch |err| return err`
- `catch` with default: `const x = parse() catch 0`
- `anyerror` = global error type (use sparingly)
- Errors are enum-like values — not stack-allocated objects

## Optional Types

Nullable value. `?T` → either `T` or `null`.

```zig
fn find(haystack: []const u8, needle: u8) ?usize {
    for (haystack, 0..) |c, i| {
        if (c == needle) return i;
    }
    return null;
}

const idx = find("hello", 'e');
if (idx) |i| {
    std.debug.print("found at {d}\n", .{i});
} else {
    std.debug.print("not found\n", .{});
}
```

- `?T` and `T` are different types — must unwrap with `orelse` or `if (...) |val|`
- `.?` — force unwrap (panics on null)

## Allocators

**No built-in allocator.** All dynamic allocation requires an explicit allocator parameter.

```zig
const allocator = std.heap.page_allocator;    // OS page allocator (slow, no free tracking)
const allocator = std.heap.arena_allocator;   // arena: free all at once
const allocator = std.heap.c_allocator;       // libc malloc/free
const allocator = std.heap.FixedBufferAllocator; // fixed-size buffer
const allocator = std.heap.ArenaAllocator;    // bump allocator

var list = std.ArrayList(u8).init(allocator);
defer list.deinit();
try list.append('a');
```

- `allocator.alloc(u8, 100)` → `![]u8`
- `allocator.free(slice)` — must free exactly what was allocated
- `defer allocator.free(buf)` — runs at scope exit
- `errdefer allocator.free(buf)` — runs only if scope errors

## Memory Management Patterns

- **Arena allocator**: allocate many items, free all at once. Ideal for request lifecycles.
- **`gpa` (GeneralPurposeAllocator)**: debug allocator — double-free detection, leak detection
- **`FixedBufferAllocator`**: allocate from pre-allocated buffer — no kernel call
- **`StackFallbackAllocator`**: use stack first, fall back to heap

```zig
var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
defer arena.deinit();
const allocator = arena.allocator();
```

## Cross-Compilation

```bash
zig build-exe main.zig --target x86_64-linux-musl   # static Linux binary
zig build-exe main.zig --target aarch64-macos-gnu    # ARM macOS
zig build-exe main.zig --target wasm32-freestanding  # WebAssembly
zig build-exe main.zig --target x86_64-windows-gnu   # Windows
```

- Ships `libc` and `libc++` for all targets — no need for system SDK
- `zig targets` lists all supported triples
- `-target` / `--target` accepts `<arch>-<os>-<abi>` triple
- Equivalent: xcompile C code with `zig cc` / `zig c++` as a drop-in CC replacement

## Build System

Declarative build system in `build.zig`:

```zig
const Builder = @import("std").build.Builder;

pub fn build(b: *Builder) void {
    const exe = b.addExecutable("myapp", "src/main.zig");
    exe.install();

    const test_cmd = b.addTest("src/main.zig");
    test_cmd.setBuildMode(.Debug);
}
```

- `b.addExecutable`, `b.addSharedLibrary`, `b.addStaticLibrary`, `b.addTest`
- `b.option()`: custom build options (flags, features)
- `exe.linkSystemLibrary("z")` or `exe.linkLibC()`
- `exe.addPackage(.{ .name = "utils", .source = .{ .path = "src/utils.zig" }})`

```bash
zig build                    # debug build
zig build -Doptimize=ReleaseFast
zig build run                # build + run
zig build test               # run tests
zig build install            # install to zig-out/
```

## C Interop

```zig
const c = @cImport({
    @cInclude("stdio.h");
    @cInclude("curl/curl.h");
});

pub fn main() void {
    _ = c.printf("hello from C\n");
}
```

- `@cImport` uses the system's C preprocessor
- `extern fn` — declare C functions manually: `extern "c" fn puts([*c]const u8) c_int`
- `@cInclude`, `@cDefine`, `@cUndefine`
- `[*c]T` — C pointer (nullable, possibly single or array)
- `@ptrCast`, `@intCast`, `@alignCast` — safe casts
- No FFI overhead — Zig structs match C ABI:
  - `extern struct` — C-compatible layout (no reordering)
  - `packed struct` — bit-packed
  - `@alignOf`, `@sizeOf`, `@offsetOf` match C

## Data Structures

```zig
const std = @import("std");

var arr = [_]u8{ 1, 2, 3 };          // fixed-size array
var slice: []const u8 = arr[0..2];    // slice (ptr + len)
var list = std.ArrayList(u8).init(allocator); // dynamic array
var map = std.StringHashMap(i32).init(allocator); // hash map
var set = std.AutoHashSet(i32).init(allocator);
```

- `std.StringHashMap(V)`, `std.AutoHashMap(K, V)` — with stack allocator
- `std.SinglyLinkedList`, `std.DoublyLinkedList`
- `std.BufSet`, `std.BufMap`
- `std.PriorityQueue`, `std.SegmentedList`

## Testing

```zig
const testing = @import("std").testing;

test "basic math" {
    try testing.expectEqual(@as(u32, 42), 42);
}

test "array length" {
    const arr = [_]i32{1, 2, 3};
    try testing.expectEqual(arr.len, 3);
}
```

```bash
zig test src/main.zig     # run all tests
zig build test            # via build system
```

- `test "name" { ... }` — top-level test block
- `testing.expect(bool)`, `testing.expectEqual(a, b)`
- `testing.allocator` — detects memory leaks
- Tests run in parallel by default

## Concurrency

```zig
// Async functions (not fibers — cooperative)
fn doWork(allocator: std.mem.Allocator) !void {
    // ...
}

// Currently, async is being re-evaluated — prefer OS threads:
const thread = try std.Thread.spawn(.{}, doWork, .{allocator});
thread.join();
```

- `std.Thread.spawn`, `std.Thread.Pool`
- `std.Mutex`, `std.RwLock`, `std.Semaphore`, `std.Atomic`
- `std.fifo.LinearFifo` — lock-free SPSC queue
- No built-in async/await; async/await is being re-architected

## Useful Standard Library Modules

- `std.fs` — file system operations
- `std.io` — readers/writers (`std.io.Writer`, `std.io.Reader`)
- `std.json` — JSON parsing (`std.json.parseFromSlice`)
- `std.crypto` — AEAD, hash, signatures, key exchange
- `std.net` — TCP/UDP sockets
- `std.unicode` — UTF-8/16 handling
- `std.sort`, `std.math`, `std.mem` — utilities

## Zig vs C / Rust

| Aspect | Zig | C | Rust |
|--------|-----|---|------|
| Memory safety | Optional runtime checks | None | Compile-time borrow checker |
| Allocator | Explicit parameter | `malloc` implicit | Global allocator (`alloc` crate) |
| Metaprogramming | Comptime | Preprocessor macros | Proc macros + generics |
| C interop | Native (`@cImport`) | Native | `cc` or `bindgen` |
| Build system | Built-in `build.zig` | Make / CMake | Cargo |
| Cross-compile | Built-in libc + targets | Target toolchain needed | `--target` + std libs |
| Hidden control flow | None | Macros | Drop glue, panics |
| Error handling | Error union types | Return codes | `Result<T, E>` |
| Learning curve | Moderate (low ceremony) | Low (but dangerous) | Steep (borrow checker) |
