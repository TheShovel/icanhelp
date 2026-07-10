# TypeScript Practical Guide

## Compiler Settings That Catch Bugs
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  }
}
```
`strict` is the baseline. `noUncheckedIndexedAccess` makes array/object lookups return `T | undefined`. `exactOptionalPropertyTypes` distinguishes an omitted field from a field explicitly set to `undefined`.

## Types vs Interfaces
```ts
type ID = string | number
interface User { id: string; name: string }
type Admin = User & { role: "admin" }
```
Use `interface` for object shapes intended to be extended or implemented. Use `type` for unions, intersections, mapped types, tuples, and aliases. Both can describe objects.

## Narrowing Unknown Values
```ts
function parseUser(value: unknown): { name: string } | null {
  if (typeof value !== "object" || value === null) return null
  if (!("name" in value) || typeof value.name !== "string") return null
  return { name: value.name }
}
```
Prefer `unknown` over `any` for external input. Narrow with `typeof`, `Array.isArray`, property checks, discriminants, or schema validation before use.

## Discriminated Unions
```ts
type Result =
  | { ok: true; value: string }
  | { ok: false; error: string }

function handle(result: Result) {
  if (result.ok) return result.value
  throw new Error(result.error)
}
```
Use a shared literal field such as `type`, `kind`, or `ok`. This gives safe exhaustive branching without optional fields everywhere.

## Exhaustive Switch
```ts
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`)
}

function label(state: "idle" | "loading" | "done") {
  switch (state) {
    case "idle": return "Idle"
    case "loading": return "Loading"
    case "done": return "Done"
    default: return assertNever(state)
  }
}
```
The `never` check makes TypeScript fail compilation when a new union member is added but not handled.

## Generics That Stay Useful
```ts
function first<T>(items: T[]): T | undefined {
  return items[0]
}

function pluck<T, K extends keyof T>(item: T, key: K): T[K] {
  return item[key]
}
```
Use generics when the output type depends on the input type. Avoid generic parameters that appear only once; they usually add complexity without safety.

## Avoiding Common Traps
- `as SomeType` bypasses checking; prefer parsing or narrowing.
- `any` spreads unsafety through code; prefer `unknown` at boundaries.
- Optional fields are not the same as nullable fields: `name?: string` vs `name: string | null`.
- Runtime values do not exist for TypeScript-only types; types are erased after compilation.
- `enum` emits JavaScript; string literal unions often produce simpler output.
