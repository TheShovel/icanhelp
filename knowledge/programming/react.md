# React Fundamentals & Best Practices

## Component Patterns

### Functional Components with Hooks

```tsx
// UserProfile.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserService } from './services';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Stable callback reference
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await UserService.getById(userId);
      setUser(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Memoized computation
  const displayName = useMemo(() => 
    user ? `${user.firstName} ${user.lastName}` : 'Loading...', 
    [user]
  );

  const handleUpdate = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = await UserService.update(user.id, updates);
    setUser(updated);
    onUpdate?.(updated);
  };

  if (loading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} onRetry={fetchUser} />;
  if (!user) return <NotFound />;

  return (
    <div className="user-profile">
      <h1>{displayName}</h1>
      <UserForm user={user} onSubmit={handleUpdate} />
    </div>
  );
}
```

### Custom Hooks

```tsx
// useApi.ts
import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, refetch: execute };
}

// Usage
function UserList() {
  const { data: users, loading, error, refetch } = useApi(
    () => UserService.getAll(),
    []
  );
  
  return (
    <div>
      <button onClick={refetch} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh'}
      </button>
      {users?.map(user => <UserCard key={user.id} user={user} />)}
    </div>
  );
}
```

```tsx
// useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

## State Management

### Context + useReducer

```tsx
// AppState.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

const initialState: AppState = {
  user: null,
  theme: 'light',
  notifications: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'REMOVE_NOTIFICATION':
      return { 
        ...state, 
        notifications: state.notifications.filter(n => n.id !== action.payload) 
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

// Usage
function Header() {
  const { state, dispatch } = useApp();
  return (
    <header className={state.theme}>
      <button onClick={() => dispatch({ 
        type: 'SET_THEME', 
        payload: state.theme === 'light' ? 'dark' : 'light' 
      })}>
        Toggle Theme
      </button>
    </header>
  );
}
```

### Zustand (Lightweight Alternative)

```tsx
// store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set(state => {
        const existing = state.items.find(i => i.id === item.id);
        if (existing) {
          return { items: state.items.map(i => 
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
          )};
        }
        return { items: [...state.items, item] };
      }),
      removeItem: (id) => set(state => ({
        items: state.items.filter(i => i.id !== id)
      })),
      updateQuantity: (id, quantity) => set(state => ({
        items: state.items.map(i => 
          i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i
        ).filter(i => i.quantity > 0)
      })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'cart-storage' }
  )
);
```

## Performance Optimization

### Memoization

```tsx
// ExpensiveComponent.tsx
import { memo, useMemo, useCallback } from 'react';

interface ExpensiveComponentProps {
  items: Item[];
  filter: string;
  onSelect: (item: Item) => void;
}

// Memoize component
export const ExpensiveComponent = memo(function ExpensiveComponent({ 
  items, 
  filter, 
  onSelect 
}: ExpensiveComponentProps) {
  // Memoize filtered list
  const filteredItems = useMemo(() => 
    items.filter(item => item.name.toLowerCase().includes(filter.toLowerCase())),
    [items, filter]
  );

  // Memoize callback
  const handleClick = useCallback((item: Item) => {
    onSelect(item);
  }, [onSelect]);

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id} onClick={() => handleClick(item)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}, (prev, next) => {
  // Custom comparison
  return prev.filter === next.filter && 
         prev.items.length === next.items.length;
});
```

### Virtualization

```tsx
// VirtualList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  height: number;
}

export function VirtualList<T>({ 
  items, 
  itemHeight, 
  renderItem, 
  height 
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height, overflow: 'auto' }}>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Forms

### React Hook Form + Zod

```tsx
// FormExample.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(v => v, 'Must accept terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export function RegistrationForm() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    reset 
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await AuthService.register(data);
      reset();
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input {...register('email')} id="email" type="email" />
        {errors.email && <span>{errors.email.message}</span>}
      </div>
      
      <div>
        <label htmlFor="password">Password</label>
        <input {...register('password')} id="password" type="password" />
        {errors.password && <span>{errors.password.message}</span>}
      </div>
      
      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input {...register('confirmPassword')} id="confirmPassword" type="password" />
        {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}
      </div>
      
      <div>
        <label>
          <input {...register('acceptTerms')} type="checkbox" />
          Accept Terms
        </label>
        {errors.acceptTerms && <span>{errors.acceptTerms.message}</span>}
      </div>
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
```

## Testing

### Component Testing (Vitest + React Testing Library)

```tsx
// UserProfile.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from './UserProfile';
import { UserService } from './services';

// Mock service
vi.mock('./services', () => ({
  UserService: {
    getById: vi.fn(),
    update: vi.fn(),
  },
}));

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays user', async () => {
    const mockUser = { 
      id: '1', 
      firstName: 'John', 
      lastName: 'Doe',
      email: 'john@example.com'
    };
    
    UserService.getById.mockResolvedValue(mockUser);

    render(<UserProfile userId="1" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('handles update', async () => {
    const mockUser = { 
      id: '1', 
      firstName: 'John', 
      lastName: 'Doe' 
    };
    
    UserService.getById.mockResolvedValue(mockUser);
    UserService.update.mockResolvedValue({ ...mockUser, firstName: 'Jane' });

    render(<UserProfile userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('First Name');
    await userEvent.clear(input);
    await userEvent.type(input, 'Jane');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(UserService.update).toHaveBeenCalledWith('1', { firstName: 'Jane' });
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  it('displays error on load failure', async () => {
    UserService.getById.mockRejectedValue(new Error('Network error'));

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
```

## TypeScript Patterns

### Component Props

```tsx
// Strict prop types
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

// Forward ref for DOM access
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`btn btn-${variant} btn-${size} ${className || ''}`}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? <Spinner /> : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Generic Components

```tsx
// Select.tsx
interface SelectProps<T> {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
}

export function Select<T>({ options, value, onChange, placeholder }: SelectProps<T>) {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value as T)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Usage
const colors = [
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
];

function ColorPicker() {
  const [color, setColor] = useState<string | null>('red');
  return <Select options={colors} value={color} onChange={setColor} />;
}
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts
│   ├── forms/           # Form-specific components
│   │   ├── FormField.tsx
│   │   └── FormLayout.tsx
│   └── layout/          # Layout components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── features/            # Feature-based modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── dashboard/
│   └── settings/
├── hooks/               # Shared hooks
│   ├── useApi.ts
│   ├── useLocalStorage.ts
│   └── index.ts
├── services/            # API services
│   ├── api.ts
│   ├── auth.ts
│   └── users.ts
├── store/               # Global state
│   ├── index.ts
│   └── cart.ts
├── utils/               # Utilities
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
├── types/               # Global types
│   ├── api.ts
│   └── user.ts
├── styles/              # Global styles
│   ├── globals.css
│   └── variables.css
├── App.tsx
├── main.tsx
└── routes.tsx
```

## Performance Checklist

- [ ] Use `React.memo` for pure components
- [ ] Use `useCallback` for event handlers passed as props
- [ ] Use `useMemo` for expensive computations
- [ ] Implement virtualization for long lists
- [ ] Code-split with `React.lazy` and `Suspense`
- [ ] Optimize images (WebP, lazy loading)
- [ ] Use production build (`NODE_ENV=production`)
- [ ] Profile with React DevTools Profiler
- [ ] Monitor bundle size with `webpack-bundle-analyzer`