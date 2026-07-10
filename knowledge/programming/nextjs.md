# Next.js

Next.js is a React framework for production-grade web applications.

## Key Concepts
- **Pages Router** (legacy) vs **App Router** (since v13.4): App Router uses React Server Components by default
- **File-based routing**: `app/` directory maps to URL paths (e.g. `app/blog/[slug]/page.js` → `/blog/:slug`)
- **Server Components**: Run on server, reduce client JS bundle. Can `await` async data fetching directly
- **Client Components**: Add `'use client'` directive when using hooks (`useState`, `useEffect`, `useRouter`) or browser APIs
- **Layouts**: `layout.js` wraps child pages, persists across navigations, can be nested
- **Templates**: `template.js` re-renders on every navigation (unlike layouts)
- **Loading UI**: `loading.js` shows fallback while page loads — uses React Suspense
- **Error Handling**: `error.js` catches errors in child segments (requires `'use client'`), `global-error.js` catches root errors
- **Not Found**: `not-found.js` handles 404 for specific routes

## Data Fetching
- **Server Components**: `async` component with `await fetch()` — cached by default, deduplicated automatically
- **Revalidation**: `fetch(url, { next: { revalidate: 60 } })` for time-based; `revalidatePath()` / `revalidateTag()` for on-demand
- **Route Handlers**: `app/api/*/route.js` export `GET`, `POST`, etc. functions — replaces Pages API routes
- **Server Actions**: `'use server'` functions called from Client Components — for form mutations without manual API routes

## Static vs Dynamic
- **Static rendering** (default): Route rendered at build time, result cached and served via CDN
- **Dynamic rendering**: Route rendered per request — automatically when using `cookies()`, `headers()`, `searchParams`, or `dynamic = 'force-dynamic'`
- **Partial Prerendering (PPR)**: Experimental — combines static shell with dynamic holes in same page

## Image Optimization
- `next/image`: Automatic sizing, lazy loading, WebP/AVIF conversion, responsive srcset
- Requires `width`/`height` or `fill` prop; uses sharp (prod) or squoosh (dev) for optimization

## Middleware
- **`middleware.js`** in project root: Runs on every request before route matching
- Use for redirects, rewrites, A/B testing, geolocation, authentication checks (Edge runtime only)

## Deployment
- **Static export**: `next export` / `output: 'export'` — fully static HTML/CSS/JS, no server needed
- **Node server**: `next start` — requires Node.js server with all API routes
- **Docker**: Official images at `node:20-alpine` with standalone output mode (`output: 'standalone'`)
- **Vercel**: Zero-config deployment with automatic ISR, Edge Functions, Analytics

## Caching
- **Full Route Cache**: HTML payload of static routes — persisted to disk in `.next`
- **Data Cache**: `fetch()` results cached across requests — can be persisted (default) or ephemeral
- **Router Cache**: Client-side in-memory cache of RSC payload — soft navigations use this
- Cache invalidation: `revalidatePath()`, `revalidateTag()`, or time-based revalidation
