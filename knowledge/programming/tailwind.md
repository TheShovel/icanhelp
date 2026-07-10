# Tailwind CSS

## Overview

Utility-first CSS framework. Provides low-level utility classes — compose them directly in HTML to build designs. No custom CSS for most UIs. Value: consistent design system, no naming conventions, small production bundles (Purging unused classes), responsive and state variants built-in. Install: `npm install -D tailwindcss @tailwindcss/cli`.

## Core Concepts

### Utility-First Workflow

```html
<div class="p-4 mx-auto max-w-md bg-white rounded-xl shadow-md">
  <img class="w-12 h-12 rounded-full" src="..." alt="avatar" />
  <div class="ml-4">
    <h2 class="text-lg font-semibold text-gray-900">Alice</h2>
    <p class="text-sm text-gray-500">Developer</p>
  </div>
</div>
```

- Each class sets one CSS property: `p-4` = `padding: 1rem`, `rounded-xl` = `border-radius: 0.75rem`
- No naming things — no BEM, no CSS modules needed for common patterns
- Every utility is a single-purpose class. Compose freely.

### Responsive Prefixes

```html
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  <!-- 1 col on mobile, 2 at sm, 3 at md, 4 at lg+ -->
</div>
```

Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px). Customizable in config.

Apply: `sm:`, `md:`, `lg:`, `xl:`, `2xl:` — prefix to any utility class.

### State Variants

```html
<button class="bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2
               active:bg-blue-800 disabled:opacity-50">
  Submit
</button>
```

States: `hover:`, `focus:`, `active:`, `disabled:`, `visited:`, `focus-visible:`, `focus-within:`, `target:`, `autofill:`, `empty:`, `required:`, `invalid:`, `valid:`

Group/parent variants: `group-hover:`, `group-focus:`, `peer-hover:`, `peer-invalid:`

```html
<div class="group">
  <h3 class="group-hover:text-blue-600">Title</h3>
</div>
```

Custom variants via `addVariant` in config.

## Dark Mode

```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <!-- dark: prefix activated by class or media query -->
</div>
```

```js
// tailwind.config.js
module.exports = {
  darkMode: "class",       // toggle via <html class="dark">
  // or "media"            // follows OS preference
};
```

Toggle: `document.documentElement.classList.toggle('dark')`. Persist with localStorage or user preference.

## Custom Configuration

```js
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          500: "#3b82f6",
          900: "#1e3a5f",
        },
      },
      fontFamily: {
        heading: ["Inter", "sans-serif"],
      },
      spacing: {
        18: "4.5rem",  // custom
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
```

- `content` (formerly `purge`): glob patterns for class scanning
- `theme.extend`: add to defaults. `theme`: replace entirely.
- `screens`: customize breakpoints: `{ "tablet": "768px" }`
- `plugins`: `@tailwindcss/forms`, `@tailwindcss/typography`, `@tailwindcss/aspect-ratio`, `@tailwindcss/container-queries`

## @apply Directive

Use in CSS files to extract repeated utility combinations:

```css
.btn-primary {
  @apply px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg
         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400;
}
```

Usage in component CSS (processed by Tailwind). Good for component libraries or legacy codebases. Avoid overusing — it recreates the class naming problem Tailwind solves.

## Class-Based vs CSS Variables / Design Tokens

Tailwind config maps to CSS custom properties:

```js
// tailwind.config.js
theme: { extend: { colors: { primary: "var(--color-primary)" } } }
```

```css
:root { --color-primary: #3b82f6; }
.dark { --color-primary: #60a5fa; }
```

This makes Tailwind config values dynamic (theme switching, runtime customization).

Tailwind CSS v3+ also supports arbitrary values:

```html
<div class="bg-[#1da1f1] text-[length:13px] top-[calc(100%-10px)]">
  <!-- square bracket notation for any CSS value -->
</div>
```

## Plugins

Official plugins extend Tailwind with new utilities and components:

```bash
npm install @tailwindcss/typography @tailwindcss/forms @tailwindcss/aspect-ratio
```

```js
plugins: [
  require("@tailwindcss/typography"),    // .prose for rich text
  require("@tailwindcss/forms"),         // better default form styles
  require("@tailwindcss/aspect-ratio"),  // aspect-ratio utilities
  require("@tailwindcss/container-queries"), // @container support
]
```

Custom plugin:

```js
const plugin = require("tailwindcss/plugin");
module.exports = {
  plugins: [
    plugin(({ addUtilities, addComponents, addBase, addVariant, theme }) => {
      addUtilities({ ".scrollbar-hide": { "scrollbar-width": "none" } });
    }),
  ],
};
```

## Component Extraction Strategy

Three levels of reuse (in order of recommendation):

1. **Inline utilities directly in template** — for one-off UI
2. **Template partials / components** — frontend framework (React, Vue, etc.) — extract repeated utility groups as components
3. **@apply** — only for leaf UI primitives in component libraries

```tsx
// React component (preferred over @apply)
function Button({ variant = "primary", children }) {
  const base = "px-4 py-2 font-semibold rounded-lg";
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-700",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
  };
  return <button className={`${base} ${variants[variant]}`}>{children}</button>;
}
```

## Prefix & Important

```js
// tailwind.config.js
module.exports = {
  prefix: "tw-",           // class="tw-p-4 tw-text-center"
  important: true,         // add !important to all utilities
  important: "#app",       // scope via selector
};
```

- Prefix: avoid conflicts with other CSS frameworks
- Important: for pre-existing styles you can't control (rarely needed)

## JIT (Just-in-Time) Engine

Tailwind CSS v3+ uses JIT compilation:

- Generates styles on-demand (not all 10k+ combinations upfront)
- Dev: rebuild on change in ~100ms
- Prod: purges unused styles automatically (no config needed beyond `content` paths)
- Supports arbitrary values (`h-[500px]`, `grid-cols-[1fr_2fr]`) with no config change
- Output size: typically < 10 KB gzipped for real projects

## Performance Tips

- Keep `content` paths tight — don't scan `node_modules`
- Use `safelist: ['bg-red-500', ...]` only for dynamic class construction
- Avoid string concatenation of classes — use full class names for scanner to pick up
- PurgeCSS built-in: any class not found in content is omitted
- For dynamic classes, either do full string or use `safelist` pattern:

```js
safelist: [{ pattern: /^bg-(red|blue|green)-(100|500)$/ }]
```

## Tailwind vs Traditional CSS

| Aspect | Tailwind | Custom CSS |
|--------|----------|------------|
| Naming | None (utility classes) | BEM / SMACSS / CSS Modules |
| Bundle size | Tiny (purging) | Depends on authoring |
| Consistency | Design tokens in config | Manual theming/linting |
| Learning curve | Learn utility names | Learn CSS (already known) |
| Rework | Low — edit HTML classes | May need CSS + HTML changes |
| Responsive | Prefixes per class | Media query blocks |
| Component reuse | Template components | @apply / mixins |
| IDE support | IntelliSense (official extension) | Standard CSS autocomplete |
