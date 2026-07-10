# TypeScript Basics

## Core Types
```typescript
// Primitives
let name: string = "hello"
let age: number = 30
let isDone: boolean = true
let nothing: null = null
let notDefined: undefined = undefined
let big: bigint = 100n
let sym: symbol = Symbol("key")

// Arrays
let list: number[] = [1, 2, 3]
let fruits: Array<string> = ["a", "b"]  // generic syntax

// Tuples (fixed length, typed positions)
let pair: [string, number] = ["age", 30]

// Enum
enum Direction { Up, Down, Left, Right }

// Any (avoid unless migration)
let loose: any = "can be anything"

// Unknown (type-safe any — must narrow)
let val: unknown = JSON.parse(raw)

// Void (no return value)
function log(msg: string): void { console.log(msg) }

// Never (never returns / always throws)
function fail(): never { throw new Error() }
```

## Interfaces & Types
```typescript
// Interface (can be extended, merged)
interface User {
  id: number
  name: string
  email?: string           // optional
  readonly createdAt: Date  // immutable after init
}

// Type alias (can do union/intersection, can't be extended)
type Status = "active" | "inactive" | "pending"
type Point = { x: number; y: number }
type ID = string | number

// Extending
interface Admin extends User {
  role: "admin"
}

// Intersection
type Employee = User & { department: string }

// Index signature
interface Dictionary {
  [key: string]: unknown
}
```

## Generics
```typescript
function identity<T>(arg: T): T { return arg }

interface Response<T> {
  data: T
  error: string | null
}

// Constraints
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length
}

// Default type
function createSet<T = string>(): Set<T> { return new Set() }

// keyof
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}
```

## Utility Types
```typescript
Partial<T>       // all optional
Required<T>      // all required
Readonly<T>      // all readonly
Pick<T, K>       // subset of keys
Omit<T, K>       // exclude keys
Record<K, V>     // object with key type K and value type V
Exclude<T, U>    // exclude types from union
Extract<T, U>    // extract types from union
NonNullable<T>   // remove null/undefined
ReturnType<T>    // return type of function
Parameters<T>    // parameter types of function
Awaited<T>       // unwrap promise
```

## Type Narrowing
```typescript
// typeof
if (typeof val === "string") { val.toUpperCase() }

// instanceof
if (err instanceof Error) { err.message }

// discriminated union
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.radius ** 2
    case "square": return s.side ** 2
  }
}
```

## Common Patterns
```typescript
// Type guard
function isString(val: unknown): val is string {
  return typeof val === "string"
}

// Assertion function
function assert(condition: any): asserts condition {
  if (!condition) throw new Error("Assertion failed")
}

// Class
class Animal {
  constructor(public name: string) {}  // auto-init
  speak(this: Animal): void { ... }
  static create(name: string): Animal { return new Animal(name) }
}

// Module declarations
declare module "*.json" {
  const value: any
  export default value
}
```

## Config (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true
  }
}
```
Key strict flags: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`
