# WebAssembly (Wasm)

WebAssembly is a binary instruction format for stack-based virtual machines, designed for near-native performance in browsers and beyond.

## Key Concepts
- **Binary format**: `.wasm` files — compact, fast to decode, streaming compilation
- **Text format**: `.wat` (WebAssembly Text) — human-readable: `(module (func $add (param i32 i32) (result i32) local.get 0 local.get 1 i32.add))`
- **Stack machine**: Instructions push/pop from operand stack — `i32.const 1`, `i32.add`
- **Linear memory**: Contiguous array of bytes (WebAssembly.Memory) — growable up to 4GB, manual allocation
- **No garbage collection**: Memory managed by host or via custom allocator — manual free
- **Deterministic**: Same inputs always produce same results — good for sandboxing

## Features
- **Types**: `i32`, `i64`, `f32`, `f64` — no strings, objects, or dynamic types natively
- **Functions**: `(func (param $a i32) (param $b i32) (result i32))` — exported via `(export "name" (func ...))`
- **Imports**: `(import "env" "memory" (memory 1))` — host provides functions, memory, globals
- **Globals**: Mutable or immutable — `(global $g (mut i32) (i32.const 0))`
- **Tables**: `funcref` arrays for indirect function calls (function pointers) — `call_indirect`
- **SIMD (128-bit)**: `v128` type — parallel operations on integers and floats (WebAssembly SIMD proposal)
- **Exception handling**: `try`/`catch`/`throw` — for control flow, not panics (exception handling proposal)
- **Tail calls**: `return_call` — optimized recursive calls without stack growth (tail call proposal)

## Proposed Features (in progress)
- **GC (Garbage Collection)**: DOM-like reference types, struct arrays, i31ref — for languages like Kotlin, Dart, Java
- **Exception handling**: First-class try/catch/throw — landed in Chrome, Firefox
- **Multi-memory**: Multiple linear memory instances per module
- **Relaxed SIMD**: Fine-grained control over SIMD precision vs performance
- **Component Model**: Interoperability between Wasm modules — interface types, higher-level composition

## Compilation Targets
- **C/C++**: Emscripten (`emcc`) — generates `.wasm` + JS glue, supports WebGL, pthreads, filesystem emulation
- **Rust**: `wasm-pack` / `wasm-bindgen` — `cargo build --target wasm32-unknown-unknown`
- **Go**: `GOOS=js GOARCH=wasm go build -o main.wasm` — includes Go runtime
- **AssemblyScript**: TypeScript-like language compiling directly to Wasm
- **.NET**: Blazor WebAssembly — runs Mono/.NET runtime compiled to Wasm
- **Python**: Pyodide — CPython compiled to Wasm, runs in browser

## WebAssembly System Interface (WASI)
- **POSIX-like API**: Filesystem, networking, clock, random — `wasi_snapshot_preview1`
- **Sandboxed I/O**: Capability-based — programs declare which files/dirs/networks they access
- **WASI Preview 2**: Component model-based, richer types, async I/O, HTTP, streaming
- **Wasmtime**: Fast standalone Wasm runtime — `wasmtime run file.wasm`
- **wasm3**: The fastest interpreter — runs on microcontrollers, no JIT needed

## Performance Tips
- **Avoid JS↔Wasm boundary crossings**: Each call incurs overhead — batch operations, pass array buffers
- **Use typed arrays**: `Int32Array`, `Float64Array` for shared memory access — direct memory read/write
- **Enable SIMD**: Auto-vectorization by LLVM/clang with `-msimd128` flag for C/Rust
- **Streaming compilation**: `WebAssembly.instantiateStreaming()` — compile as download progresses
- **Memory growth**: Expensive operation — pre-allocate sufficient initial memory pages (64KB each)
