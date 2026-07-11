# WebAssembly (Wasm)

## Overview
WebAssembly (Wasm) is a binary instruction format for a stack-based virtual machine. It's designed as a portable compilation target for programming languages, enabling deployment on the web for client and server applications.

## Key Features
- **Fast**: Near-native performance
- **Safe**: Sandboxed execution environment
- **Portable**: Runs on any platform
- **Compact**: Binary format, small size
- **Interoperable**: Works with JavaScript

## Module Structure

### Text Format (WAT)
```wat
(module
  (type $add_type (func (param i32 i32) (result i32)))
  (func $add (type $add_type) (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add
  )
  (export "add" (func $add))
  
  (memory 1)
  (export "memory" (memory 0))
  
  (global $global_i32 (mut i32) (i32.const 42))
  (export "global_i32" (global $global_i32))
)
```

### Binary Format Sections
| Section | ID | Description |
|---------|----|-------------|
| Custom | 0 | Custom name/debug info |
| Type | 1 | Function signatures |
| Import | 2 | Imports |
| Function | 3 | Function declarations |
| Table | 4 | Function table |
| Memory | 5 | Memory declaration |
| Global | 6 | Global variables |
| Export | 7 | Exports |
| Start | 8 | Start function |
| Element | 9 | Element segment |
| Code | 10 | Function bodies |
| Data | 11 | Data segments |

## Value Types
| Type | Description |
|------|-------------|
| `i32` | 32-bit integer |
| `i64` | 64-bit integer |
| `f32` | 32-bit float |
| `f64` | 64-bit float |
| `v128` | 128-bit SIMD vector |
| `funcref` | Function reference |
| `externref` | External reference |

## Instructions

### Control Flow
```wat
;; Block
(block $label
  ;; instructions
  br_if $label (condition)
)

;; Loop
(loop $label
  ;; instructions
  br $label
)

;; If/else
(if (condition)
  (then ...)
  (else ...)
)

;; Return
(return)

;; Unreachable
(unreachable)
```

### Numeric Operations
```wat
;; i32 arithmetic
i32.add i32.sub i32.mul i32.div_s i32.div_u
i32.rem_s i32.rem_u i32.and i32.or i32.xor i32.shl i32.shr_s i32.shr_u i32.rotl i32.rotr

;; i32 comparison
i32.eqz i32.eq i32.ne i32.lt_s i32.lt_u i32.gt_s i32.gt_u i32.le_s i32.le_u i32.ge_s i32.ge_u

;; f32/f64 arithmetic
f32.add f32.sub f32.mul f32.div f32.min f32.max f32.copysign
f32.sqrt f32.ceil f32.floor f32.trunc f32.nearest f32.abs f32.neg

;; Conversions
i32.wrap_i64 i64.extend_i32_s i64.extend_i32_u
i32.trunc_f32_s i32.trunc_f32_u f32.convert_i32_s f32.convert_i32_u
i32.reinterpret_f32 f32.reinterpret_i32
```

### Memory Operations
```wat
;; Load/store
i32.load (align 4) (offset 0)  ;; local.get 0 -> i32
i32.store (align 4) (offset 0)  ;; local.get 0, local.get 1 -> 

;; Memory management
memory.size  ;; returns pages (64KB each)
memory.grow  ;; grow by N pages, returns old size

;; Bulk memory (SIMD)
memory.copy  ;; dst, src, len
memory.fill  ;; dst, val, len
memory.init  ;; dst, src, len (from passive data)
data.drop    ;; drop passive data segment
```

### Variable Operations
```wat
;; Locals
(local $var i32)
local.get $var
local.set $var
local.tee $var  ;; set and return value

;; Globals
(global $g (mut i32) (i32.const 0))
global.get $g
global.set $g
```

### Function Calls
```wat
;; Call by index
call $func_index

;; Call indirect (through table)
call_indirect (type $sig)
```

## Compilation Toolchains

### Emscripten (C/C++)
```bash
# Install
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk && ./emsdk install latest && ./emsdk activate latest
source ./emsdk_env.sh

# Compile
emcc hello.c -o hello.js -s EXPORTED_FUNCTIONS='["_add", "_main"]' -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]'

# With WASM standalone
emcc hello.c -o hello.wasm -s STANDALONE_WASM=1 -s EXPORTED_FUNCTIONS='["_add"]'

# Optimization
emcc -O3 -s WASM=1 hello.c -o hello.js
```

### Rust (wasm-pack)
```bash
# Install
cargo install wasm-pack

# Create library
cargo new --lib wasm-lib
cd wasm-lib

# Cargo.toml
[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"

# Build
wasm-pack build --target web
# Output: pkg/wasm_lib.js, pkg/wasm_lib_bg.wasm
```

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[wasm_bindgen]
pub struct Calculator {
    value: i32,
}

#[wasm_bindgen]
impl Calculator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Calculator {
        Calculator { value: 0 }
    }
    
    pub fn add(&mut self, x: i32) -> i32 {
        self.value += x;
        self.value
    }
    
    pub fn get_value(&self) -> i32 {
        self.value
    }
}

// Export memory for direct access
#[wasm_bindgen]
pub fn memory() -> JsValue {
    wasm_bindgen::memory()
}
```

### Go (TinyGo)
```bash
# Install TinyGo
# Compile
tinygo build -o main.wasm -target wasm main.go
```

```go
// main.go
package main

import "syscall/js"

func add(this js.Value, args []js.Value) interface{} {
    return args[0].Int() + args[1].Int()
}

func main() {
    js.Global().Set("add", js.FuncOf(add))
    select {} // Keep running
}
```

### AssemblyScript (TypeScript-like)
```bash
npm install --save-dev assemblyscript
npx asinit .
npm run asbuild
```

```typescript
// assembly/index.ts
export function add(a: i32, b: i32): i32 {
  return a + b;
}

export function fibonacci(n: i32): i32 {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Memory management
export function allocate(size: i32): i32 {
  return __alloc(size);
}

export function deallocate(ptr: i32): void {
  __free(ptr);
}
```

## JavaScript Integration

### Loading & Instantiation
```javascript
// Fetch and compile
const response = await fetch('module.wasm');
const bytes = await response.arrayBuffer();
const module = await WebAssembly.compile(bytes);
const instance = await WebAssembly.instantiate(module, {
  env: {
    memory: new WebAssembly.Memory({ initial: 10, maximum: 100 }),
    table: new WebAssembly.Table({ initial: 10, element: 'anyfunc' }),
    // Imported functions
    consoleLog: (ptr, len) => {
      const memory = new Uint8Array(instance.exports.memory.buffer);
      console.log(new TextDecoder().decode(memory.slice(ptr, ptr + len)));
    },
  },
});

// Use exports
const result = instance.exports.add(5, 3); // 8
```

### Streaming Compilation
```javascript
// Compile while downloading
const { instance } = await WebAssembly.instantiateStreaming(
  fetch('module.wasm'),
  importObject
);
```

### Memory Management
```javascript
// Access memory
const memory = instance.exports.memory;
const buffer = new Uint8Array(memory.buffer);

// Read string from WASM
function readString(ptr, len) {
  return new TextDecoder().decode(buffer.slice(ptr, ptr + len));
}

// Write string to WASM
function writeString(str) {
  const encoded = new TextEncoder().encode(str);
  const ptr = instance.exports.allocate(encoded.length);
  buffer.set(encoded, ptr);
  return ptr;
}

// Grow memory
instance.exports.memory.grow(10); // Add 10 pages (640KB)
```

### Calling JS from Wasm (Imports)
```javascript
const importObject = {
  env: {
    // Function imports
    log_i32: (val) => console.log('i32:', val),
    log_f64: (val) => console.log('f64:', val),
    
    // Memory import
    memory: new WebAssembly.Memory({ initial: 10 }),
    
    // Table import
    table: new WebAssembly.Table({ initial: 10, element: 'anyfunc' }),
    
    // Math imports
    Math_abs: Math.abs,
    Math_sin: Math.sin,
  },
  // Custom namespace
  myModule: {
    myFunction: (arg) => { /* ... */ },
  },
};
```

## WebAssembly System Interface (WASI)

### WASI Preview 1
```bash
# Compile with WASI target (Rust)
rustup target add wasm32-wasi
cargo build --target wasm32-wasi --release

# Run with wasmtime
wasmtime run target/wasm32-wasi/release/app.wasm

# With file access
wasmtime run --dir=. target/wasm32-wasi/release/app.wasm
```

```rust
// Rust WASI example
use std::fs;
use std::io::{self, Write};

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: {} <file>", args[0]);
        std::process::exit(1);
    }
    
    let content = fs::read_to_string(&args[1]).unwrap();
    println!("File content: {}", content);
    
    // Write to stdout
    io::stdout().write_all(b"Hello from WASI!\n").unwrap();
}
```

## Advanced Features

### SIMD (128-bit vectors)
```wat
;; SIMD operations
v128.const i32x4 1 2 3 4
v128.add
v128.mul
v128.dot_i32x4
v128.load
v128.store
```

```rust
// Rust SIMD
use core::arch::wasm32::*;

let a = v128_new(1, 2, 3, 4);
let b = v128_new(5, 6, 7, 8);
let c = i32x4_add(a, b); // [6, 8, 10, 12]
```

### Threads (Shared Memory)
```javascript
// JavaScript
const memory = new WebAssembly.Memory({ initial: 10, maximum: 100, shared: true });
const worker = new Worker('worker.js');
worker.postMessage({ memory });

// worker.js
self.onmessage = (e) => {
  const memory = new WebAssembly.Memory(e.data.memory);
  const instance = await WebAssembly.instantiateStreaming(fetch('module.wasm'), { env: { memory } });
  // Use atomic operations
  Atomics.add(new Int32Array(memory.buffer), offset, value);
};
```

```wat
;; Atomic operations
atomic.load i32.atomic.load
atomic.store i32.atomic.store
atomic.rmw.add i32.atomic.rmw.add
atomic.rmw.sub i32.atomic.rmw.sub
atomic.rmw.and i32.atomic.rmw.and
atomic.rmw.or i32.atomic.rmw.or
atomic.rmw.xor i32.atomic.rmw.xor
atomic.rmw.xchg i32.atomic.rmw.xchg
atomic.cmpxchg i32.atomic.cmpxchg
atomic.wait i32.atomic.wait
atomic.notify i32.atomic.notify
atomic.fence
```

### Reference Types
```wat
;; Funcref
ref.func $func
ref.null funcref
ref.is_null
ref.as_non_null

;; Externref
ref.null externref
ref.as_non_null
```

### GC (Garbage Collection) - WasmGC
```wat
;; Struct/Array types (WasmGC)
(type $struct (struct (field i32) (field (mut f32))))
(type $array (array i32))

;; Operations
struct.new $struct
struct.get $struct 0
struct.set $struct 0

array.new $array
array.get $array
array.set $array
array.len
```

## Performance Optimization

### Size Optimization
```bash
# Binaryen optimization
wasm-opt -Oz input.wasm -o output.wasm

# Specific passes
wasm-opt --enable-bulk-memory --enable-reference-types -Oz input.wasm -o output.wasm

# Strip debug info
wasm-opt --strip-debug input.wasm -o output.wasm
```

### Runtime Optimization
```javascript
// Cache compiled module
const moduleCache = new Map();

async function getModule(url) {
  if (!moduleCache.has(url)) {
    const response = await fetch(url);
    const bytes = await response.arrayBuffer();
    const module = await WebAssembly.compile(bytes);
    moduleCache.set(url, module);
  }
  return moduleCache.get(url);
}

// Reuse memory
const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });
const instance1 = await WebAssembly.instantiate(module, { env: { memory } });
const instance2 = await WebAssembly.instantiate(module, { env: { memory } });
```

## Debugging

### Source Maps
```bash
# Generate with source maps
emcc -g -gsource-map hello.c -o hello.js

# Or with wasm-pack
wasm-pack build --dev
```

### Browser DevTools
- Chrome/Firefox: Sources panel shows .wat files
- Set breakpoints in WAT
- Inspect memory, locals, stack

### Console Logging from Wasm
```wat
(import "env" "log" (func $log (param i32)))

;; In code
local.get $value
call $log
```

```javascript
// JS import
const importObject = {
  env: {
    log: (ptr) => {
      const mem = new Uint8Array(instance.exports.memory.buffer);
      let str = '';
      for (let i = ptr; mem[i] !== 0; i++) {
        str += String.fromCharCode(mem[i]);
      }
      console.log('WASM:', str);
    },
  },
};
```

## Use Cases

### Web Applications
- Image/video processing (ffmpeg.wasm)
- Games (Unity, Godot, custom engines)
- CAD/3D modeling (Figma, Onshape)
- Cryptography (libsodium, WebCrypto)
- Machine learning (TensorFlow.js, ONNX Runtime)

### Server-Side
- Edge computing (Cloudflare Workers, Fastly Compute@Edge)
- Plugin systems (Envoy, Istio, Shopify Functions)
- Database UDFs (SingleStore, Redis)
- Blockchain (Ewasm, Solana, Polkadot)
- FaaS platforms

### Languages Compiling to Wasm
| Language | Toolchain | Best For |
|----------|-----------|----------|
| Rust | wasm-pack, cargo | General purpose, performance |
| C/C++ | Emscripten | Porting existing code |
| Go | TinyGo | Small binaries |
| AssemblyScript | asc | TypeScript developers |
| Zig | zig build | Modern C alternative |
| Swift | WASI SDK | Apple ecosystem |
| Kotlin | Kotlin/Wasm | JVM alternative |

## Resources
- [WebAssembly Specification](https://webassembly.github.io/spec/core/)
- [MDN WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [Wasm By Example](https://wasmbyexample.dev/)
- [WebAssembly.org](https://webassembly.org/)
- [Awesome Wasm](https://github.com/mbround18/awesome-wasm)
- [WebAssembly Weekly](https://wasmweekly.news/)