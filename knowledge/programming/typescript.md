# TypeScript Advanced Patterns

## Type System Fundamentals

### Utility Types

```typescript
// Partial - all optional
type PartialUser = Partial<User>;

// Required - all required
type RequiredUser = Required<User>;

// Readonly - all readonly
type ReadonlyUser = Readonly<User>;

// Pick - select keys
type UserPreview = Pick<User, 'id' | 'name' | 'email'>;

// Omit - exclude keys
type UserWithoutPassword = Omit<User, 'password'>;

// Record - key-value map
type UserRoles = Record<string, Role>;
type UserMap = Record<UserId, User>;

// Exclude/Extract from unions
type NonNullable = Exclude<string | null | undefined, null | undefined>; // string
type OnlyStrings = Extract<string | number | boolean, string>; // string

// ReturnType - infer return type
type GetUserReturn = ReturnType<typeof getUser>;

// Parameters - infer params tuple
type GetUserParams = Parameters<typeof getUser>;

// ConstructorParameters
type UserConstructorParams = ConstructorParameters<typeof User>;

// InstanceType
type UserInstance = InstanceType<typeof User>;

// ThisType (for methods)
type Methods = {
    setName(this: User, name: string): this;
    getName(this: User): string;
};
```

### Conditional Types

```typescript
// Basic conditional
type IsString = string extends string ? true : false; // true

// Distributive over unions
type ToArray = T extends any ? T[] : never;
type StringArray = ToArray<string | number>; // string[] | number[]

// never type
type Never = T extends never ? true : false; // never (empty union)

// infer keyword
type ReturnType = T extends (...args: any[]) => infer R ? R : never;
type PromiseValue = T extends Promise<infer U> ? U : never;
type ArrayElement = T extends (infer U)[] ? U : never;

// Type guards
type NonNullable = T extends null | undefined ? never : T;

// Template literal types
type EventName = `on${Capitalize}`; // 'onClick', 'onChange', etc.
type CSSProperty = `--${string}`;
type Route = `/${string}`;

// Mapped types with template literals
type Getters = {
    [K in keyof T as `get${Capitalize<K>}`]: () => T[K];
};

type Setters = {
    [K in keyof T as `set${Capitalize<K>}`]: (value: T[K]) => void;
};

// key remapping
type ReadonlyKeys = {
    readonly [K in keyof T as K extends `on${string}` ? never : K]: T[K];
};
```

## Generics

### Constraints

```typescript
// Basic constraint
function getLength(obj: { length: number }): number {
    return obj.length;
}

// extends constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

// Multiple constraints
function merge<T extends object, U extends object>(obj1: T, obj2: U): T & U {
    return { ...obj1, ...obj2 };
}

// Default type parameter
interface ApiResponse<T = unknown> {
    data: T;
    status: number;
    message: string;
}

// Generic interfaces
interface Repository<T> {
    findById(id: string): Promise<T | null>;
    save(entity: T): Promise<T>;
    delete(id: string): Promise<void>;
}

// Generic classes
class Cache {
    private store = new Map<string, T>();
    
    set(key: string, value: T): void {
        this.store.set(key, value);
    }
    
    get(key: string): T | undefined {
        return this.store.get(key);
    }
}
```

### Variance

```typescript
// Covariant (Producer) - safe to use wider type
interface Producer {
    get(): T;
}

// Contravariant (Consumer) - safe to use narrower type
interface Consumer {
    consume(value: T): void;
}

// Invariant (both) - mutable
interface Mutable {
    get(): T;
    set(value: T): void;
}

// Function variance
type Handler = (event: T) => void;
// (event: Event) => void is subtype of (event: ClickEvent) => void
// Function params are CONTRAVARIANT
// Function returns are COVARIANT
```

## Advanced Patterns

### Builder Pattern with Type Safety

```typescript
class QueryBuilder {
    private selectFields: string[] = [];
    private whereClauses: string[] = [];
    private orderByField?: string;
    private limitValue?: number;
    
    select(...fields: string[]): this {
        this.selectFields.push(...fields);
        return this;
    }
    
    where(condition: string): this {
        this.whereClauses.push(condition);
        return this;
    }
    
    orderBy(field: string): this {
        this.orderByField = field;
        return this;
    }
    
    limit(count: number): this {
        this.limitValue = count;
        return this;
    }
    
    build(): string {
        let query = `SELECT ${this.selectFields.join(', ') || '*'} FROM table`;
        if (this.whereClauses.length) {
            query += ` WHERE ${this.whereClauses.join(' AND ')}`;
        }
        if (this.orderByField) {
            query += ` ORDER BY ${this.orderByField}`;
        }
        if (this.limitValue) {
            query += ` LIMIT ${this.limitValue}`;
        }
        return query;
    }
}

// Usage with chaining
const query = new QueryBuilder()
    .select('id', 'name', 'email')
    .where('active = true')
    .where('age > 18')
    .orderBy('created_at DESC')
    .limit(10)
    .build();
```

### Fluent API with Type-Level State

```typescript
type State = 'empty' | 'hasSelect' | 'hasWhere' | 'complete';

class TypedQueryBuilder {
    private state: State = 'empty';
    private query = '';
    
    select(): TypedQueryBuilder & { state: 'hasSelect' } {
        this.query += 'SELECT *';
        this.state = 'hasSelect';
        return this as any;
    }
    
    where(): TypedQueryBuilder & { state: 'hasWhere' } {
        this.query += ' WHERE 1=1';
        this.state = 'hasWhere';
        return this as any;
    }
    
    // Only available after where()
    and(): this & { state: 'hasWhere' } {
        this.query += ' AND 1=1';
        return this;
    }
    
    build(): string {
        return this.query;
    }
}

// Usage - compile error if wrong order
const q = new TypedQueryBuilder().select().where().and().build();
// new TypedQueryBuilder().where() // Error!
```

### Discriminated Unions

```typescript
type Shape = 
    | { type: 'circle'; radius: number }
    | { type: 'rectangle'; width: number; height: number }
    | { type: 'square'; size: number };

function area(shape: Shape): number {
    switch (shape.type) {
        case 'circle':
            return Math.PI * shape.radius ** 2;
        case 'rectangle':
            return shape.width * shape.height;
        case 'square':
            return shape.size ** 2;
        default:
            const _exhaustive: never = shape;
            throw new Error(`Unknown shape: ${_exhaustive}`);
    }
}

// Narrowing with custom type guards
function isCircle(shape: Shape): shape is Extract<Shape, { type: 'circle' }> {
    return shape.type === 'circle';
}
```

### Result/Option Types (Railway Oriented)

```typescript
type Result<T, E = Error> = 
    | { ok: true; value: T }
    | { ok: false; error: E };

type Option = 
    | { some: true; value: T }
    | { some: false };

// Helpers
const Ok = <T>(value: T): Result<T> => ({ ok: true, value });
const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

const Some = <T>(value: T): Option<T> => ({ some: true, value });
const None = <T>(): Option<T> => ({ some: false });

// Map/flatMap
function map<T, U, E>(result: Result<T, E>, fn: (v: T) => U): Result<U, E> {
    if (result.ok) return Ok(fn(result.value));
    return result;
}

function flatMap<T, U, E>(result: Result<T, E>, fn: (v: T) => Result<U, E>): Result<U, E> {
    if (result.ok) return fn(result.value);
    return result;
}

// Usage
function divide(a: number, b: number): Result<number, string> {
    if (b === 0) return Err('Division by zero');
    return Ok(a / b);
}

const result = divide(10, 2)
    .map(x => x * 2)
    .flatMap(x => divide(x, 0));
```

## React Patterns

### Component Props with Generics

```typescript
interface SelectProps<T> {
    options: { value: T; label: string }[];
    value: T | null;
    onChange: (value: T) => void;
    placeholder?: string;
}

function Select<T>({ options, value, onChange, placeholder }: SelectProps<T>) {
    return (
        <select value={value ?? ''} onChange={e => onChange(e.target.value as T)}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}

// Usage
const colors = [
    { value: 'red' as const, label: 'Red' },
    { value: 'blue' as const, label: 'Blue' },
];

function ColorPicker() {
    const [color, setColor] = useState<'red' | 'blue' | null>('red');
    return <Select options={colors} value={color} onChange={setColor} />;
}
```

### Higher-Order Components (HOC)

```typescript
// With props injection
function withLoading<P extends { isLoading?: boolean }>(
    WrappedComponent: React.ComponentType<P>
) {
    return function WithLoadingComponent(props: Omit<P, 'isLoading'> & { loading?: boolean }) {
        const { loading, ...rest } = props;
        return <WrappedComponent {...rest as P} isLoading={loading} />;
    };
}

// Usage
interface UserProfileProps {
    user: User;
    isLoading?: boolean;
}

const UserProfileWithLoading = withLoading(UserProfile);
```

### Render Props

```typescript
interface DataFetcherProps<T> {
    url: string;
    children: (data: { data: T | null; loading: boolean; error: Error | null }) => React.ReactNode;
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    useEffect(() => {
        fetch(url)
            .then(res => res.json())
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [url]);
    
    return <>{children({ data, loading, error })}</>;
}

// Usage
<DataFetcher<User> url="/api/user">
    {({ data, loading, error }) => loading ? <Spinner /> : data ? <Profile user={data} /> : <Error error={error} />}
</DataFetcher>
```

### Custom Hooks with Generics

```typescript
function useApi<T>(url: string, options?: RequestInit) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [url, options]);
    
    useEffect(() => { fetchData(); }, [fetchData]);
    
    return { data, loading, error, refetch: fetchData };
}

// Usage
const { data: users, loading, error } = useApi<User[]>('/api/users');
```

## Zod Integration

```typescript
import { z } from 'zod';

// Schema
const UserSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2).max(100),
    email: z.string().email(),
    age: z.number().int().min(0).max(150).optional(),
    role: z.enum(['admin', 'user', 'guest']).default('user'),
    metadata: z.record(z.string()).optional(),
});

// Infer type
type User = z.infer<typeof UserSchema>;

// Parse with validation
function createUser(data: unknown): User {
    return UserSchema.parse(data);
}

// Safe parse
function tryCreateUser(data: unknown) {
    const result = UserSchema.safeParse(data);
    if (!result.success) {
        console.error(result.error.format());
        return null;
    }
    return result.data;
}

// Transform
const UserWithDefaults = UserSchema.transform(data => ({
    ...data,
    createdAt: new Date(),
}));

// Refinement
const PositiveNumber = z.number().refine(n => n > 0, 'Must be positive');

// Union with discriminator
const EventSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('click'), x: z.number(), y: z.number() }),
    z.object({ type: z.literal('keypress'), key: z.string() }),
    z.object({ type: z.literal('scroll'), deltaY: z.number() }),
]);
type Event = z.infer<typeof EventSchema>;
```

## Module Augmentation

```typescript
// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            user?: User;
            sessionId: string;
        }
    }
}

// Extend third-party types
declare module 'express' {
    interface Request {
        user?: User;
    }
}

// Extend Window
interface Window {
    __MY_APP__: {
        version: string;
        config: AppConfig;
    };
}

// Extend globalThis
declare global {
    var __DEV__: boolean;
}
```

## Configuration

```json
// tsconfig.json
{
    "compilerOptions": {
        "target": "ES2022",
        "lib": ["ES2022", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "moduleResolution": "bundler",
        "jsx": "react-jsx",
        "strict": true,
        "noUncheckedIndexedAccess": true,
        "noImplicitOverride": true,
        "noPropertyAccessFromIndexSignature": true,
        "exactOptionalPropertyTypes": true,
        "forceConsistentCasingInFileNames": true,
        "skipLibCheck": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true
    }
}
```

## Type Testing

```typescript
// type-tests.ts
import { expectType, expectError } from 'tsd';

// Test utility types
expectType<Pick<User, 'id' | 'name'>>({} as UserPreview);
expectError<Pick<User, 'password'>>({} as UserPreview);

// Test generics
expectType<string>(getProperty({ name: 'test' }, 'name'));
expectError(getProperty({ name: 'test' }, 'invalid'));

// Test conditional types
expectType<string>(PromiseValue<Promise<string>>);
expectType<never>(PromiseValue<number>);

// Test inference
declare function createUser(data: UserInput): User;
expectType<User>(createUser({ name: 'test', email: 'test@test.com' }));
```

## Performance

```typescript
// Avoid deep nesting in types
// Bad
type Bad = {
    a: { b: { c: { d: { e: string } } } };
};

// Good - flat
interface Good {
    a: string;
    b: string;
    c: string;
    d: string;
    e: string;
}

// Use type aliases for complex unions
type EventHandlers = 
    | { type: 'click'; handler: ClickHandler }
    | { type: 'hover'; handler: HoverHandler };

// Prefer interfaces for object types (declaration merging)
interface User {
    name: string;
}

// Use type for unions, primitives, computed types
type UserId = string & { readonly brand: unique symbol };
type ID = UserId | PostId;

// Avoid enums (use const objects)
const Role = {
    Admin: 'admin',
    User: 'user',
    Guest: 'guest',
} as const;
type Role = typeof Role[keyof typeof Role];
```

## Migration from JavaScript

```typescript
// JSDoc for gradual migration
/**
 * @param {string} name
 * @param {number} age
 * @returns {User}
 */
function createUser(name, age) {
    return { name, age };
}

// @ts-check at top of JS files
// @ts-nocheck to disable
// @ts-ignore for single line
// @ts-expect-error for expected errors (will error if no error)

// Allow JS in TS project
"allowJs": true,
"checkJs": true,
```

## Best Practices

1. **Use `strict: true`** - Catch all errors
2. **Prefer `interface` for objects** - Declaration merging
3. **Use `type` for unions/computed** - Flexibility
4. **Avoid `any`** - Use `unknown` instead
5. **Use `readonly`** - Immutability
6. **Use `const` assertions** - Literal types
7. **Use branded types for IDs** - Type safety
8. **Leverage type inference** - Less annotations
9. **Use discriminated unions** - Exhaustive checking
10. **Keep types flat** - Performance