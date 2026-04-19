# @spaceis/vue — agent guidance

> Canonical instruction file for AI coding agents (Claude Code, Cursor,
> Codex, Copilot). Applies when working on this package OR when a consumer
> imports `@spaceis/vue` or `@spaceis/vue/server`.
>
> `CLAUDE.md` in this folder is a thin pointer to this file.
>
> For SDK-level domain conventions (prices in cents, qty in thousandths,
> cart token lifecycle, payment commission as a multiplier, XSS on HTML
> fields) see `node_modules/@spaceis/sdk/AGENTS.md` — all of those rules
> apply here too.

## Overview

Vue 3 bindings for the SpaceIS SDK. Thin wrapper — no business logic is
duplicated from `@spaceis/sdk`.

Peer dependencies: `@spaceis/sdk >=0.2.0`, `vue >=3.3.0`,
`@tanstack/vue-query >=5.0.0`

Two npm entry points:

| Entry | Purpose |
|---|---|
| `@spaceis/vue` | Client-side composables + Plugin. |
| `@spaceis/vue/server` | SSR prefetch helpers for Nuxt. No client-side code. |

## Architecture

```
src/
  index.ts              — Barrel export (plugin, composables, re-exported SDK types/utils)
  plugin.ts             — SpaceISPlugin + SpaceISKey injection key
  composables/
    index.ts            — Barrel for all composables
    use-spaceis.ts      — inject client + cartManager
    use-cart.ts         — Reactive cart via shallowRef + CartManager.onChange
    use-products.ts     — useProducts(params?)
    use-product.ts      — useProduct(slug), useProductRecommendations(slug)
    use-categories.ts   — useCategories(params?)
    use-packages.ts     — usePackages(params?)
    use-sales.ts        — useSales(params?)
    use-goals.ts        — useGoals(params?)
    use-rankings.ts     — useTopCustomers, useLatestOrders
    use-shop-config.ts  — useShopConfig()
    use-checkout.ts     — useCheckout (payment methods + agreements + usePlaceOrder)
    use-recaptcha.ts    — Lazy-loaded reCAPTCHA with SSR guard and retry logic
    use-content.ts      — usePages, usePage, useStatute
  server/
    index.ts            — SSR: createServerClient, prefetch helpers,
                          re-exports dehydrate / QueryClient (no HydrationBoundary — React-only)
```

## Domain conventions — Vue-specific

### Plugin installation vs Provider component

`@spaceis/vue` uses the Vue plugin pattern, not a Provider component.
Install once at app root:

```ts
// main.ts
import { createApp } from 'vue'
import { SpaceISPlugin } from '@spaceis/vue'
import App from './App.vue'

const app = createApp(App)
app.use(SpaceISPlugin, {
  baseUrl: import.meta.env.VITE_SPACEIS_BASE_URL,
  shopUuid: import.meta.env.VITE_SPACEIS_SHOP_UUID,
})
app.mount('#app')
```

The plugin installs `VueQueryPlugin` internally and provides the SpaceIS
context via `provide/inject` with a typed `InjectionKey`.

### MaybeRefOrGetter — NOT MaybeRef

All composable parameters that accept reactive input use
`MaybeRefOrGetter<T>` (from `@vueuse/core` re-export or `vue`'s type utils),
**not** `MaybeRef<T>`. The getter pattern — passing `() => props.slug` —
is supported and required for derived reactive values.

```ts
// CORRECT — getter function supported
const { data } = useProduct(() => props.slug)

// CORRECT — plain ref supported
const slug = ref('starter-pack')
const { data } = useProduct(slug)

// WRONG — plain MaybeRef does NOT accept getter functions
// TS will reject: () => props.slug is not assignable to MaybeRef<string>
```

This was introduced in 0.1.1. When adding new composables, always type
params as `MaybeRefOrGetter<T>` and unwrap with `toValue()`.

### Query keys — computed + toValue

Query keys for reactive parameters must be wrapped in `computed` so that
TanStack Vue Query can track reactivity:

```ts
const queryKey = computed(() => ['spaceis', 'product', toValue(slug)])
```

Do not use a plain array — the query will not re-run when `slug` changes.
Static queries (no reactive params) may skip `computed`.

### shallowRef for cart state

`useCart` stores cart state in `shallowRef` (not `ref`). Cart objects are
complex — deep reactivity via `ref` causes unnecessary traversal. Use
`shallowRef` for all domain-object state in new composables.

```ts
// CORRECT
const cart = shallowRef<CartState>(initialCart)

// WRONG — deep reactivity is wasteful for complex nested objects
const cart = ref<CartState>(initialCart)
```

### onMounted / onUnmounted guarded by getCurrentInstance()

Composables that attach lifecycle hooks must guard with `getCurrentInstance()`
to stay SSR-safe. Without the guard, calling the composable in a Nuxt server
context throws a "lifecycle hook called outside setup()" error.

```ts
import { getCurrentInstance, onMounted, onUnmounted } from 'vue'

if (getCurrentInstance()) {
  onMounted(() => { /* subscribe */ })
  onUnmounted(() => { /* unsubscribe */ })
}
```

This pattern applies to `useCart` and any future composable that needs
cleanup.

### SpaceISContext.cartManager nullability

The context type exposes `cartManager: CartManager | null`. In SSR (Nuxt
server routes) the `CartManager` is not initialised because `localStorage`
is unavailable. Always guard against `null` before using it:

```ts
const { cartManager } = useSpaceIS()
if (!cartManager) return // SSR path — cart not available

cartManager.add(variantUuid, qty)
```

### useQueryClient for out-of-mutation invalidation

When you need to invalidate queries outside of a `useMutation` callback
(e.g. in response to a WebSocket message or a store action), use
`useQueryClient()` from `@tanstack/vue-query`:

```ts
import { useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient()
queryClient.invalidateQueries({ queryKey: ['spaceis', 'products'] })
```

Do not import `QueryClient` directly and instantiate a new one — that
creates a second cache disconnected from the one installed by `SpaceISPlugin`.

### usePlaceOrder — cart cleared on success

`usePlaceOrder` calls `cartManager.clearCart()` in its `onSuccess` callback.
This is intentional. Do not remove this side-effect when refactoring.

### Query keys convention

All TanStack Query keys start with `["spaceis", ...]`. Bulk invalidation:
`queryClient.invalidateQueries({ queryKey: ["spaceis"] })`.

### staleTime defaults

| Data type | staleTime |
|---|---|
| `useCategories`, `useShopConfig`, `useStatute` | 5–10 min |
| `useProducts`, `useSales`, `useGoals`, `usePackages` | 30 s |
| `usePaymentMethods`, `useAgreements` | 10 min |
| `useTopCustomers`, `useLatestOrders` | 30 s |

## Common mistakes to avoid

- **`useCart()` called outside `setup()`**: the `shallowRef` subscription is
  attached during setup. If you call `useCart` outside a component or
  composable setup function (e.g. in a Pinia action), the cart ref will never
  update. Move the call inside the component setup or use `cartManager`
  directly from the injected context.

- **Using `MaybeRef` instead of `MaybeRefOrGetter` for params**: TypeScript
  will reject `() => props.slug` as a `MaybeRef<string>` — getters are only
  assignable to `MaybeRefOrGetter`. Always use the wider type when typing
  composable parameters.

- **Missing null check on `cartManager` in SSR context**: `cartManager` is
  `null` on the server (no `localStorage`). Accessing `.add()` or `.state`
  on `null` throws at runtime in Nuxt server routes / `useAsyncData`.

- **`v-html` with unsanitised API content**: `page.content`, `statute.content`,
  `agreement.content`, `product.description` contain raw HTML. Always pipe
  through DOMPurify before binding to `v-html`:
  ```html
  <div v-html="DOMPurify.sanitize(page.content)" />
  ```

- **Calling `app.use(SpaceISPlugin)` more than once**: Vue will silently ignore
  the second install call but the config from the first call wins. Pass the
  correct config on the first `app.use`.

- **Importing server helpers from `@spaceis/vue`** (client entry): they are
  only available via `@spaceis/vue/server`. The client bundle does not export
  `createServerClient` or any prefetch helpers. There is also no
  `HydrationBoundary` export — that is React-specific.

- **Ignoring `error.isRateLimited` in retry logic**: same as the SDK — do not
  retry on 429 immediately. Override TanStack Query's default `retry` option
  for rate-limited errors.

## Consumer integration — Nuxt SSR

Typical pattern for an SSR page with prefetched data:

```ts
// server/api/shop-data.ts (Nuxt server route)
import { createServerClient, prefetchProducts } from '@spaceis/vue/server'
import { dehydrate } from '@tanstack/vue-query'

export default defineEventHandler(async () => {
  const { queryClient } = createServerClient({
    baseUrl: process.env.SPACEIS_BASE_URL!,
    shopUuid: process.env.SPACEIS_SHOP_UUID!,
  })

  await prefetchProducts(queryClient, { limit: 20 })

  return dehydrate(queryClient)
})
```

```vue
<!-- pages/shop.vue -->
<script setup lang="ts">
import { useProducts } from '@spaceis/vue'
import { useHydration } from '#imports' // Nuxt auto-import

const { data: dehydratedState } = await useFetch('/api/shop-data')
useHydration('spaceis', () => dehydratedState.value)

const { data } = useProducts({ limit: 20 })
</script>
```

Key points:
- `createServerClient` creates a one-shot client + QueryClient for the request.
- `prefetch*` helpers accept the same params as their composable counterparts.
- Hydration on the client side is handled by `@tanstack/vue-query`'s built-in
  hydration support. There is no `HydrationBoundary` component in Vue.
- Unlike React, there is no `"use client"` concept in Vue — all composables
  work on client and SSR equally (subject to the `getCurrentInstance()` guard
  for lifecycle hooks).

## Examples

Live examples are in `examples/vue/` at the monorepo root — a Nuxt 4 app
using all composables with SSR, SEO, DOMPurify, and editable quantity inputs.
Not shipped in the npm tarball.

## Reference

- API docs: https://docs.spaceis.app/api
- Repository: https://github.com/spaceis-app/spaceis-sdk
- npm: https://www.npmjs.com/package/@spaceis/vue
- SDK guidance: `node_modules/@spaceis/sdk/AGENTS.md`
