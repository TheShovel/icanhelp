# Solid.js

## Core Philosophy

Solid is a reactive UI library with **no virtual DOM**. It compiles JSX to real DOM nodes and updates only what changes via fine-grained reactivity. Components render once (the "create" phase); signals drive Granular updates thereafter. No re-renders, no diffing, no VDOM overhead.

## Signals

Basic reactive primitive. `createSignal(initial)` returns `[getter, setter]`.

```js
import { createSignal } from "solid-js";
const [count, setCount] = createSignal(0);
console.log(count()); // 0 — signals are functions, no .value
setCount(5);
setCount((prev) => prev + 1);
```

Accessing a signal outside a tracking context reads the current value without subscribing. Pass a function to setter for derived updates.

## Effects & Memos

- **`createEffect`**: runs after DOM paint, re-runs when tracked dependencies change.
- **`createMemo`**: derived signal — caches value, re-evaluates lazily when deps change.
- **`onCleanup`**: register cleanup inside effect/memo (e.g. remove event listeners).

```js
createEffect(() => {
  console.log(`Count is ${count()}`);
});

const doubled = createMemo(() => count() * 2);
```

Effects auto-track any signal/memo read during execution. Use `on()` for explicit deps:

```js
createEffect(on(count, (c, prev) => console.log(c, prev), { defer: true }));
```

## Control Flow

Built-in components — no `&&` tricks. They only evaluate children that are visible.

```jsx
<Show when={count() > 0} fallback={<p>Zero</p>}>
  <p>Positive</p>
</Show>

<For each={items()}>{(item, index) => <li>{index()}: {item}</li>}</For>

<Index each={items()}>{(item, index) => <li>{index}: {item()}</li>}</Index>
// Index gives signal for element, index is fixed. For gives signal for index, element is fixed.
```

- `Switch`/`Match`: multi-condition
- `Dynamic`: render component by variable
- `Portal`: teleport DOM
- `ErrorBoundary`: catch errors in children

## JSX & Compilation

Solid uses a custom Babel/TypeScript transform. Each JSX expression compiles to `effect()` or `memo()` calls. Require `babel-preset-solid` or `solid-js` in tsconfig `"jsxImportSource": "solid-js"`.

```jsx
function Counter() {
  const [count, setCount] = createSignal(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count()}</button>;
}
```

Spread props: `<MyComponent {...props} />`. Ref forwarding: pass a setter to `ref`.

## Stores

Reactive proxy objects for deep state. Nested access is tracked:

```js
import { createStore } from "solid-js/store";
const [state, setState] = createStore({ user: { name: "Alice", tags: [] } });
setState("user", "name", "Bob");
setState("user", "tags", (t) => [...t, "admin"]);
```

Produce-style immutable updates with `produce`:

```js
import { produce } from "solid-js/store";
setState(produce((s) => { s.user.name = "Charlie"; }));
```

## Resources

Data fetching primitive. Returns `[data, { mutate, refetch, loading, error }]`.

```js
const [user] = createResource(() => userId(), fetchUser);
// Suspense-friendly, automatically tracks signal dependencies
```

Options: `initialValue`, `onHydrated`, `storage` (for refetch strategy), `ssrLoadFrom`. Use `Suspense` to show fallback while loading.

## Routing (@solidjs/router)

Nested routes, file-system-style config, lazy loading.

```jsx
<Router>
  <Route path="/" component={Layout}>
    <Route path="/" component={Home} />
    <Route path="/users/:id" component={User} />
  </Route>
</Router>
```

- `useParams`, `useSearchParams`, `useNavigate`, `useLocation`, `useIsRouting`
- `A` component: accessible `<a>` with active class
- Load functions for pre-loading data before navigation (SSR compatible)

## Solid vs React

| Aspect | Solid | React |
|--------|-------|-------|
| Rendering | Compile-time, no VDOM | Runtime VDOM + fiber |
| Re-renders | None — granular | Full tree re-render |
| Component calls | Once | Every render |
| State | Signals (getter/setter) | `useState` (value + setter) |
| Effect | `createEffect` | `useEffect` (always runs after render) |
| Props | Destructure lossless | Destructure causes stale closures |
| Children | Lazy by default | Eager |
| Suspense | Native support | Concurrent mode |

## Lifecycle & Context

- `onMount(fn)` — after first render
- `onCleanup(fn)` — when reactive scope disposes (component unmount, effect re-run)
- `createContext(default)` / `useContext(ctx)` — no Provider nesting required
- `children(() => props.children)` — reactive children access

## Derived Reactivity & Batching

- `untrack(fn)`: read without tracking
- `batch(fn)`: defer signal updates until fn completes (automatic in Solid 1.5+)
- `getOwner()`: current reactive context owner

## SSR & Hydration

- `renderToString(() => <App />)` — synchronous SSR
- `renderToStream(() => <App />)` — streaming HTML (Node/Bun)
- `hydrate(() => <App />, el)` — client hydration
- `createResource` works with Suspense during SSR; await resolved data before sending HTML.

## Testing

- `solid-testing-library` — Jest/Vitest compatible
- Wrap components in `render`; use `screen` queries
- Test signals/memos directly as plain functions

## Performance Characteristics

- No reconciliation overhead
- Memory: ~2–3× smaller heap than React
- CPU: update cost is O(changed nodes), not O(tree size)
- Bundle: ~7 KB gzipped (vs ~45 KB React+DOM)
