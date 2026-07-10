# React Basics

## Core Concepts
- **Component**: function returning JSX — reusable UI piece
- **JSX**: HTML-like syntax in JS — `return <div>Hello</div>`
- **Props**: data passed to component — `function Greet({ name }: { name: string })`
- **State**: data that changes — `const [count, setCount] = useState(0)`
- **Effect**: side effects (fetch, timers) — `useEffect(() => { ... }, [deps])`

## Hooks
```tsx
useState<T>(initial)          // reactive state
useEffect(fn, deps)           // side effects
useRef<T>(initial)            // mutable ref (no re-render)
useContext(Context)            // access context value
useReducer(reducer, initial)  // complex state logic
useCallback(fn, deps)         // memoized fn
useMemo(() => val, deps)      // memoized value
useId()                       // unique ID (accessibility)
useTransition()               // mark update as low priority
useDeferredValue(val)         // defer re-render
useImperativeHandle(ref, fn)  // expose methods to parent
useLayoutEffect(fn, deps)     // sync effect before paint
```

## Patterns
```tsx
// Lifting state up
// State in parent, passed as props to children

// Composition > inheritance
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>

// Controlled components
<input value={val} onChange={e => setVal(e.target.value)} />

// Custom hooks
function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : initial
  })
  useEffect(() => localStorage.setItem(key, JSON.stringify(val)), [key, val])
  return [val, setVal] as const
}
```

## State Management
- **Local state**: `useState` — component-specific, no other component needs it
- **Lifted state**: parent `useState`, passed as props — shared between siblings
- **Context**: `createContext` + `useContext` — avoids prop drilling, global-ish state
- **Zustand**: lightweight external store — `const useStore = create((set) => ({ count, setCount }))`
- **Redux**: older, more boilerplate — use RTK (Redux Toolkit) if you must
- **React Query / TanStack Query**: server state (caching, refetching) — best for API data
- Rules: don't put everything in global state, don't put server cache in global state

## Performance
- `React.memo(Component)` — skip re-render if props unchanged (shallow compare)
- `useMemo` — skip expensive calculations on re-render
- `useCallback` — stable function reference (for child deps)
- Virtual list: `react-window`, `@tanstack/virtual` — render only visible items
- Code splitting: `React.lazy(() => import("./Big"))` + `<Suspense>`
- Avoid: inline functions in JSX (if child is memo'd), unnecessary state, too many re-renders
- Profiling: React DevTools Profiler tab — identifies slow renders

## Routing (React Router v6)
```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/users/:id" element={<User />} />
    <Route path="/dashboard" element={<Dashboard />}>
      <Route index element={<Overview />} />
      <Route path="settings" element={<Settings />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>

// Navigation
const navigate = useNavigate()
navigate("/users/123")
<Link to="/about">About</Link>

// Params
const { id } = useParams()
const search = useSearchParams()  // ?page=2
const location = useLocation()    // current path
```

## Forms
- Controlled: onChange handlers + state (more code, more control)
- Uncontrolled: `useRef` + form submit (simpler)
- Libraries: React Hook Form (performant, less re-renders), Formik (older)
- Validation: Zod + React Hook Form = current best practice
```tsx
const { register, handleSubmit, errors } = useForm()
<form onSubmit={handleSubmit(data => submit(data))}>
  <input {...register("email", { required: true })} />
  {errors.email && <span>Required</span>}
</form>
```

## Testing Components
```tsx
// Vitest + Testing Library
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

test("increments counter", async () => {
  render(<Counter />)
  const btn = screen.getByRole("button", { name: /increment/i })
  await userEvent.click(btn)
  expect(screen.getByText("1")).toBeInTheDocument()
})
```

## Common Pitfalls
- `useEffect` missing deps (use ESLint react-hooks/exhaustive-deps)
- State updates are async (don't read state right after setState)
- Mutating state directly (use spread/immer for nested objects)
- Too many re-renders from creating objects/arrays in render
- `useEffect` dependency on function/object (wrap in useCallback/useMemo)
- Forgetting cleanup in useEffect (return cleanup fn to avoid memory leaks)
- Key prop on list items (use stable unique ID, not index)
