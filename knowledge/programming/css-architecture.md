# CSS Architecture & Modern Styling

## Overview
Modern CSS has evolved significantly with custom properties, container queries, cascade layers, and new layout methods. This guide covers scalable CSS architecture for maintainable, performant stylesheets.

## Modern CSS Features (2023-2024)

### CSS Custom Properties (Variables)
```css
:root {
  /* Design tokens */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-secondary: #64748b;
  --color-success: #059669;
  --color-warning: #d97706;
  --color-danger: #dc2626;
  
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, monospace;
  
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;
  
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms ease;
  
  --z-dropdown: 100;
  --z-modal: 200;
  --z-toast: 300;
  --z-tooltip: 400;
}

/* Component-scoped variables */
.button {
  --btn-padding-x: 1rem;
  --btn-padding-y: 0.5rem;
  --btn-font-size: 0.875rem;
  --btn-radius: var(--radius-md);
}

.button--lg {
  --btn-padding-x: 1.5rem;
  --btn-padding-y: 0.75rem;
  --btn-font-size: 1rem;
}

.button--sm {
  --btn-padding-x: 0.75rem;
  --btn-padding-y: 0.375rem;
  --btn-font-size: 0.75rem;
}
```

### Cascade Layers (@layer)
```css
/* Define layer order (last wins) */
@layer reset, base, components, utilities, overrides;

/* Layer 1: Reset */
@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  * { margin: 0; padding: 0; }
  img, video { max-width: 100%; height: auto; }
}

/* Layer 2: Base styles */
@layer base {
  html { font-size: 16px; }
  body { font-family: var(--font-sans); line-height: 1.5; }
  a { color: var(--color-primary); }
}

/* Layer 3: Components */
@layer components {
  .button { /* ... */ }
  .card { /* ... */ }
  .modal { /* ... */ }
}

/* Layer 4: Utilities (high specificity) */
@layer utilities {
  .sr-only { position: absolute; width: 1px; height: 1px; }
  .flex { display: flex; }
  .grid { display: grid; }
}

/* Layer 5: Overrides (highest) */
@layer overrides {
  .legacy-widget { /* forced styles */ }
}

/* Anonymous layer (highest priority) */
@layer {
  .critical-fix { color: red !important; }
}
```

### Container Queries
```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Responsive to container, not viewport */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--spacing-md);
  }
  
  .card__image {
    aspect-ratio: 1;
  }
}

@container card (min-width: 600px) {
  .card__title { font-size: 1.5rem; }
}

/* Size query (container query units) */
.card__title {
  font-size: clamp(1rem, 5cqw, 2rem);
}
```

### Logical Properties
```css
/* Instead of physical: margin-top, padding-left, etc. */
.box {
  /* Margin */
  margin-block-start: 1rem;    /* margin-top */
  margin-block-end: 1rem;      /* margin-bottom */
  margin-inline-start: 1rem;   /* margin-left (LTR) */
  margin-inline-end: 1rem;     /* margin-right (LTR) */
  
  /* Shorthand */
  margin-block: 1rem 2rem;     /* vertical */
  margin-inline: 1rem;         /* horizontal */
  
  /* Padding */
  padding-block: 1rem;
  padding-inline: 1.5rem;
  
  /* Borders */
  border-block-start: 2px solid;
  border-inline-end: 1px dashed;
  
  /* Positioning */
  inset-block-start: 0;        /* top: 0 */
  inset-inline-end: 0;         /* right: 0 */
  
  /* Sizing */
  inline-size: 100%;           /* width */
  block-size: auto;            /* height */
  min-inline-size: 200px;      /* min-width */
  max-block-size: 300px;       /* max-height */
}

/* Benefits: Works automatically in RTL languages */
```

### Modern Color Functions
```css
:root {
  --brand: #2563eb;
}

/* Relative color syntax (CSS Color 5) */
.button--hover {
  background: hsl(from var(--brand) h s calc(l - 10%));
}

.button--active {
  background: hsl(from var(--brand) h calc(s + 10%) calc(l - 15%));
}

/* Color mix */
.overlay {
  background: color-mix(in srgb, var(--brand) 20%, transparent);
}

/* OKLCH (perceptually uniform) */
:root {
  --brand-oklch: oklch(59% 0.22 264);
}

.gradient {
  background: linear-gradient(
    to right,
    oklch(from var(--brand-oklch) l c h),
    oklch(from var(--brand-oklch) l c calc(h + 30))
  );
}
```

## CSS Architecture Patterns

### ITCSS (Inverted Triangle CSS)
```
Settings     → Design tokens, variables
Tools        → Mixins, functions
Generic      → Reset, normalize
Elements     → Bare HTML elements (h1, a, table)
Objects      → Layout patterns (.container, .grid)
Components   → UI components (.button, .card)
Utilities    → Helper classes (.text-center, .mt-4)
```

### CUBE CSS (Composition Utility Block Exception)
```css
/* Composition - Layout primitives */
.flow > * + * { margin-block-start: var(--flow-space, 1em); }
.stack { display: flex; flex-direction: column; gap: var(--gap, 1rem); }
.cluster { display: flex; flex-wrap: wrap; gap: var(--gap, 1rem); }
.grid { display: grid; gap: var(--gap, 1rem); }

/* Utility - Single responsibility */
.visually-hidden { /* screen reader only */ }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Block - Component */
.card {
  /* Block styles */
}

.card__image { /* Element */ }
.card__title { /* Element */ }

.card--featured { /* Variation */ }
.card--compact { /* Variation */ }

/* Exception - Overrides */
.card--featured .card__title { font-weight: 700; }
```

### BEM (Block Element Modifier)
```css
/* Block */
.card { }

/* Element */
.card__image { }
.card__title { }
.card__description { }
.card__footer { }

/* Modifier */
.card--featured { }
.card--compact { }
.card__title--large { }

/* State */
.card--loading { }
.card--error { }

/* JavaScript hooks (not styled) */
.js-card-toggle { }
```

## Layout Patterns

### Modern Grid Layouts
```css
/* Holy Grail Layout */
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav main aside"
    "footer footer footer";
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 250px 1fr 250px;
  min-height: 100vh;
}

.header { grid-area: header; }
.nav { grid-area: nav; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }

/* Responsive */
@media (max-width: 768px) {
  .layout {
    grid-template-areas:
      "header"
      "main"
      "nav"
      "aside"
      "footer";
    grid-template-columns: 1fr;
  }
}

/* Auto-fit Grid (Responsive without media queries) */
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

/* Masonry-like (CSS Grid) */
.masonry {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  grid-auto-rows: 10px; /* Small row height */
  grid-auto-flow: dense;
}

.masonry-item {
  grid-row-end: span 10; /* Adjust based on content */
}

/* Sidebar Layout (Flexbox) */
.sidebar-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
}

.main {
  flex: 1;
  min-width: 0; /* Prevents overflow */
}
```

### Intrinsic Web Design
```css
/* Fluid typography */
:root {
  --fs-300: clamp(0.875rem, 0.875rem + 0vw, 0.875rem);
  --fs-400: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --fs-500: clamp(1.125rem, 1.02rem + 0.5vw, 1.5rem);
  --fs-600: clamp(1.5rem, 1.25rem + 1.25vw, 2.25rem);
  --fs-700: clamp(2rem, 1.5rem + 2.5vw, 3.5rem);
  --fs-800: clamp(3rem, 2rem + 5vw, 5rem);
}

/* Fluid spacing */
.section {
  padding-block: clamp(2rem, 5vw, 6rem);
}

/* Fluid container */
.container {
  width: min(100% - 2rem, 1200px);
  margin-inline: auto;
}
```

## Component Patterns

### Button System
```css
.button {
  --btn-bg: var(--color-primary);
  --btn-color: white;
  --btn-hover-bg: var(--color-primary-hover);
  --btn-focus-ring: 0 0 0 3px color-mix(in srgb, var(--color-primary) 40%, transparent);
  
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: var(--btn-padding-y, 0.5rem) var(--btn-padding-x, 1rem);
  font-size: var(--btn-font-size, 0.875rem);
  font-weight: 600;
  line-height: 1.5;
  border-radius: var(--btn-radius, var(--radius-md));
  border: 2px solid transparent;
  background: var(--btn-bg);
  color: var(--btn-color);
  cursor: pointer;
  transition: background var(--transition-fast), box-shadow var(--transition-fast);
  text-decoration: none;
  white-space: nowrap;
}

.button:hover {
  background: var(--btn-hover-bg);
}

.button:focus-visible {
  outline: none;
  box-shadow: var(--btn-focus-ring);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants */
.button--secondary {
  --btn-bg: var(--color-secondary);
  --btn-hover-bg: #475569;
}

.button--outline {
  --btn-bg: transparent;
  --btn-color: var(--color-primary);
  --btn-hover-bg: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-color: var(--color-primary);
}

.button--ghost {
  --btn-bg: transparent;
  --btn-color: var(--color-primary);
  --btn-hover-bg: color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.button--destructive {
  --btn-bg: var(--color-danger);
  --btn-hover-bg: #b91c1c;
}

/* Sizes */
.button--sm { --btn-padding-x: 0.75rem; --btn-padding-y: 0.375rem; --btn-font-size: 0.75rem; }
.button--lg { --btn-padding-x: 1.5rem; --btn-padding-y: 0.75rem; --btn-font-size: 1rem; }
.button--xl { --btn-padding-x: 2rem; --btn-padding-y: 1rem; --btn-font-size: 1.125rem; }
```

### Card Component
```css
.card {
  --card-bg: white;
  --card-border: 1px solid var(--color-border, #e2e8f0);
  --card-radius: var(--radius-lg);
  --card-shadow: var(--shadow-sm);
  --card-padding: var(--spacing-lg);
  
  background: var(--card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: var(--card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.card__title {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
}

.card__meta {
  font-size: 0.75rem;
  color: var(--color-muted, #64748b);
}

.card__content {
  flex: 1;
  color: var(--color-text-secondary, #475569);
  line-height: 1.6;
}

.card__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border, #e2e8f0);
  margin-top: auto;
}

/* Variants */
.card--elevated {
  --card-shadow: var(--shadow-lg);
  --card-border: none;
}

.card--outlined {
  --card-shadow: none;
  --card-border: 2px solid var(--color-border, #e2e8f0);
}

.card--interactive {
  cursor: pointer;
  transition: box-shadow var(--transition-fast), transform var(--transition-fast);
}

.card--interactive:hover {
  --card-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Form Components
```css
.form-field {
  display: grid;
  gap: var(--spacing-xs);
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #1e293b);
}

.form-input {
  --input-bg: white;
  --input-border: 1px solid var(--color-border, #cbd5e1);
  --input-focus-ring: 0 0 0 3px color-mix(in srgb, var(--color-primary) 40%, transparent);
  --input-radius: var(--radius-md);
  --input-padding-x: 0.75rem;
  --input-padding-y: 0.5rem;
  --input-font-size: 0.875rem;
  
  width: 100%;
  background: var(--input-bg);
  border: var(--input-border);
  border-radius: var(--input-radius);
  padding: var(--input-padding-y) var(--input-padding-x);
  font-size: var(--input-font-size);
  line-height: 1.5;
  color: var(--color-text, #1e293b);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--input-focus-ring);
}

.form-input:disabled {
  background: var(--color-muted, #f1f5f9);
  cursor: not-allowed;
}

.form-input:invalid:not(:placeholder-shown) {
  --input-border: 1px solid var(--color-danger);
}

.form-input::placeholder {
  color: var(--color-muted, #94a3b8);
}

/* With label floating */
.form-field--float .form-input {
  padding-block: 1.25rem 0.375rem;
}

.form-field--float .form-label {
  position: absolute;
  top: 50%;
  left: 0.75rem;
  transform: translateY(-50%);
  pointer-events: none;
  transition: transform var(--transition-fast), font-size var(--transition-fast), color var(--transition-fast);
  color: var(--color-muted, #94a3b8);
}

.form-field--float .form-input:focus + .form-label,
.form-field--float .form-input:not(:placeholder-shown) + .form-label {
  transform: translateY(-100%) scale(0.85);
  color: var(--color-primary);
}

/* Error state */
.form-field--error .form-input {
  --input-border: 1px solid var(--color-danger);
}

.form-error {
  font-size: 0.75rem;
  color: var(--color-danger);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
```

## Animation & Transitions

### Performance-First Animation
```css
/* Only animate transform, opacity, filter */
.animate-fade {
  animation: fadeIn var(--transition-normal) ease-out;
}

.animate-slide-up {
  animation: slideUp var(--transition-normal) ease-out;
}

.animate-scale {
  animation: scaleIn var(--transition-fast) ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.95);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Scroll Animations
```css
/* Scroll-driven animations (experimental) */
@scroll-timeline --reveal-timeline {
  source: selector(#scroller);
  orientation: vertical;
  scroll-offsets: 0, 100%;
}

.reveal {
  animation: reveal linear;
  animation-timeline: --reveal-timeline;
  animation-range: entry 0% cover 50%;
}

@keyframes reveal {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* IntersectionObserver fallback for broader support */
```

## Performance Optimization

### Critical CSS
```html
<!-- Inline critical CSS in <head> -->
<style>
  /* Above-the-fold styles only */
  .header { ... }
  .hero { ... }
  .btn-primary { ... }
</style>

<!-- Load non-critical async -->
<link rel="preload" href="/styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/styles.css"></noscript>
```

### CSS Containment
```css
.card {
  contain: layout style paint;
  /* or */
  contain: strict; /* layout style paint size */
}

.feed {
  contain-intrinsic-size: 1000px; /* Reserve space */
}

.widget {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}
```

### Layer Optimization
```css
/* Promote to layer for animations */
.animated-element {
  will-change: transform, opacity;
  /* Use sparingly - removes after animation */
}

/* Avoid layout thrashing */
/* BAD */
element.style.width = element.offsetWidth + 10 + 'px';

/* GOOD */
element.style.width = `${element.clientWidth + 10}px`;

/* Use requestAnimationFrame for DOM reads/writes */
function animate() {
  requestAnimationFrame(() => {
    // Read
    const height = element.offsetHeight;
    // Write
    element.style.height = height + 10 + 'px';
  });
}
```

## Browser Support (2024)

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Custom Properties | ✅ | ✅ | ✅ | ✅ |
| Cascade Layers | ✅ 99+ | ✅ 97+ | ✅ 15.4+ | ✅ 99+ |
| Container Queries | ✅ 105+ | ✅ 110+ | ✅ 16+ | ✅ 105+ |
| Logical Properties | ✅ 69+ | ✅ 41+ | ✅ 15+ | ✅ 79+ |
| `:has()` | ✅ 105+ | ✅ 121+ | ✅ 15.4+ | ✅ 105+ |
| `color-mix()` | ✅ 111+ | ✅ 119+ | ✅ 16.2+ | ✅ 111+ |
| Relative Colors | ✅ 119+ | ✅ 126+ | ✅ 17+ | ✅ 119+ |
| `color-contrast()` | ✅ 119+ | ❌ | ✅ 17+ | ✅ 119+ |
| `color-scheme` | ✅ | ✅ | ✅ | ✅ |
| `subgrid` | ✅ 117+ | ✅ 71+ | ✅ 16+ | ✅ 117+ |
| `anchor()` positioning | ✅ 125+ | ❌ | ❌ | ✅ 125+ |

## Tools & Workflow

### PostCSS Pipeline
```javascript
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-import': {},           // Inline @import
    'postcss-custom-properties': {  // Fallback for custom properties
      preserve: true
    },
    'postcss-nesting': {},          // Native CSS nesting
    'postcss-custom-media': {},     // @custom-media
    'postcss-color-function': {},   // color() function
    'autoprefixer': {               // Vendor prefixes
      flexbox: 'no-2009',
      grid: 'autoplace'
    },
    'cssnano': {                    // Minification
      preset: 'default'
    }
  }
}
```

### Stylelint Config
```json
{
  "extends": ["stylelint-config-standard", "stylelint-config-recess-order"],
  "plugins": ["stylelint-order", "stylelint-scss"],
  "rules": {
    "color-hex-case": "lower",
    "color-hex-length": "short",
    "selector-class-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
    "custom-property-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$",
    "selector-pseudo-class-no-unknown": [true, {
      "ignorePseudoClasses": ["global", "local", "deep"]
    }]
  }
}
```

## Resources

### Documentation
- [MDN CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [CSS-Tricks](https://css-tricks.com/)
- [web.dev CSS](https://web.dev/learn/css/)
- [CSS Working Group Drafts](https://drafts.csswg.org/)

### Inspiration
- [CSS Layout](https://csslayout.io/)
- [CSS Grid Garden](https://cssgridgarden.com/)
- [Flexbox Froggy](https://flexboxfroggy.com/)
- [Every Layout](https://every-layout.dev/)

### Tools
- [CSS Stats](https://cssstats.com/) - Analyze CSS
- [Specificity Calculator](https://specificity.keegan.st/)
- [CSS Specificity Visualizer](https://specifishity.com/)
- [CSS Gradient Generator](https://cssgradient.io/)
- [Clamp Calculator](https://royalfig.github.io/fluid-typography-calculator/)