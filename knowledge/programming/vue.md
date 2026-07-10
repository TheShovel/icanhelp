# Vue.js

Vue.js is a progressive JavaScript framework for building user interfaces.

## Core Concepts
- **Reactive data**: `ref()` for primitives (`.value` to access), `reactive()` for objects (auto-unwrap)
- **Composition API** (recommended): `setup()` or `<script setup>` — organize logic by feature with composables
- **Options API** (legacy): `data()`, `methods`, `computed`, `watch` — organize by option type
- **Template syntax**: `{{ expression }}`, `v-bind:prop` / `:prop`, `v-on:event` / `@event`, `v-model` for two-way binding
- **Directives**: `v-if`/`v-else-if`/`v-else`, `v-show`, `v-for`, `v-html`, `v-text`, `v-cloak`, `v-once`, `v-memo`
- **Lifecycle hooks** (Composition API): `onMounted()`, `onUnmounted()`, `onUpdated()`, `onBeforeMount()`, `onBeforeUnmount()`, `onActivated()`, `onDeactivated()`

## Reactivity System
- **Proxy-based** (since Vue 3): Intercepts get/set operations on reactive objects
- **`computed()`**: Derives value from reactive sources, caches until dependencies change
- **`watch()`**: Performs side effects when reactive source changes — supports `deep`, `immediate`, `once` options
- **`watchEffect()`**: Runs effect immediately and re-runs when any dependency changes
- Shallow reactivity: `shallowRef()`, `shallowReactive()` — only track top-level changes, better for large data

## Component System
- **Props**: `defineProps(['propName'])` or `defineProps({ propName: String })` — one-way data flow
- **Emits**: `defineEmits(['event'])` — child emits events to parent via `$emit`
- **Slots**: `<slot>` for content projection, named slots (`<slot name="header">`), scoped slots (slot passes data back)
- **Provide/Inject**: `provide(key, value)` in ancestor, `inject(key)` in descendant — for deep prop drilling
- **Teleport**: `<Teleport to="body">` moves content to different DOM node (modals, tooltips)
- **Suspense**: `<Suspense>` wraps async components, shows fallback while loading

## State Management
- **Pinia** (official): `defineStore('name', () => ({ state, getters, actions }))` — Composition API style store
- **Vuex** (legacy): `state`, `getters`, `mutations`, `actions` — deprecated in favor of Pinia
- **provide/inject** + shallow reactive: Simple global state for small apps

## Router
- **Vue Router**: `createRouter({ history: createWebHistory(), routes })` — nested routes, dynamic segments (`:id`), navigation guards (`beforeEach`, `beforeEnter`)
- Lazy loading: `() => import('./views/About.vue')` in route config

## Performance
- **Virtual DOM**: Efficient diffing with static hoisting (Vue 3 compiler hoists static nodes)
- **Tree-shaking**: Vue 3 core is ~10KB gzipped — most features are importable, unused code shakes out
- **Suspense streaming**: Combine with SSR for faster TTFB
- **v-memo**: Memoize template subtrees that only change when dependencies change
