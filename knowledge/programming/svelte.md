# Svelte

Svelte is a JavaScript framework that shifts compilation to build time, producing vanilla JS with no runtime.

## Key Concepts
- **Compiler, not framework**: Svelte compiles `.svelte` components into efficient imperative DOM manipulation code
- **No virtual DOM** — updates directly mutate DOM via compiled reactive assignments
- **`.svelte` files**: Single-file components with `<script>`, `<style>`, and markup
- **Reactive declarations**: `$: doubled = count * 2` — re-runs when `count` changes
- **Reactive statements**: `$: console.log(count)` — side effect on change; `$: ({ count } = obj)` — destructuring
- **Reactive stores**: `writable()`, `readable()`, `derived()`, custom stores — auto-subscribe with `$store` syntax

## Reactivity
- **Assignment triggers reactivity**: `count = count + 1` — Svelte's compiler instruments assignments
- **Array/object mutations**: Must reassign (`arr = [...arr, new]`) or use `arr[0] = x; arr = arr` (same reference still triggers)
- **`$store` auto-subscription**: In .svelte files, prefixing store variable with `$` auto-subscribes/unsubscribes
- **Stores in JS files**: Regular JS modules work — no framework dependency for shared state

## Component Features
- **Props**: `export let propName` to expose as prop; `export let propName = 'default'` for defaults
- **Slots**: `<slot>`, named slots `<slot name="header">`, slot props `let:prop`
- **Events**: `createEventDispatcher()` for custom events; `on:click` for DOM events
- **Bindings**: `bind:value={var}`, `bind:this={domRef}`, `bind:group` for checkboxes/radios, `bind:files` for file inputs
- **Lifecycle**: `onMount()`, `onDestroy()`, `beforeUpdate()`, `afterUpdate()`, `tick()` (awaits pending DOM updates)

## Logic
- **{#if condition}...{:else}...{/if}** for conditionals
- **{#each items as item, i}...{/each}** for loops — with `(key)` for list diffing
- **{#await promise}...{:then value}...{:catch error}...{/await}** for async data
- **{@html string}** — render HTML (sanitize first, no auto-escaping)

## Transitions & Animations
- Built-in: `transition:fade`, `transition:slide`, `transition:scale`, `transition:fly`, `transition:blur`
- Custom transitions: Functions returning `{ duration, css(t) }` or `{ duration, tick(t, u) }`
- In/out transitions: `in:fly`, `out:fade`, `transition:slide` (both directions)
- **Motion**: `spring()` and `tweened()` stores for smooth animated values

## SvelteKit (Meta-framework)
- **File-based routing**: `src/routes/` — `+page.svelte`, `+layout.svelte`, `+server.js`, `+page.server.js`
- **Data loading**: `load()` functions in `+page.server.js` (server) or `+page.js` (universal)
- **Form actions**: `export const actions = { default: async (event) => {...} }` in `+page.server.js`
- **Endpoints**: `+server.js` exports `GET`, `POST`, `PUT`, `DELETE` handlers
- **Adapters**: `@sveltejs/adapter-auto`, `adapter-node`, `adapter-static`, `adapter-vercel`, `adapter-netlify`
- **Streaming**: `load()` can return promises that stream to browser as they resolve

## Performance
- Smallest bundle sizes among frameworks — no runtime to ship
- Best-in-class startup performance (fewer CPU cycles on initial render)
- Fine-grained reactivity — only updates DOM nodes that actually changed
