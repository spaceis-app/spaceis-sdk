# @spaceis/react — agent guidance

> Canonical instruction file for AI coding agents (Claude Code, Cursor,
> Codex, Copilot). Applies when working on this package OR when a consumer
> imports `@spaceis/react` or `@spaceis/react/server`.
>
> `CLAUDE.md` in this folder is a thin pointer to this file.
>
> For SDK-level domain conventions (prices in cents, qty in thousandths,
> cart token lifecycle, payment commission as a multiplier, XSS on HTML
> fields) see `node_modules/@spaceis/sdk/AGENTS.md` — all of those rules
> apply here too.

## Overview

React bindings for the SpaceIS SDK. Thin wrapper — no business logic is
duplicated from `@spaceis/sdk`.

Peer dependencies: `@spaceis/sdk >=0.2.0`, `react >=18.0.0`,
`@tanstack/react-query >=5.0.0`

Two npm entry points:

| Entry | Purpose |
|---|---|
| `@spaceis/react` | Client-side hooks + Provider. Has `"use client"` banner in built output. |
| `@spaceis/react/server` | SSR prefetch helpers for Next.js. No `"use client"` banner. |

## Architecture

```
src/
  index.ts            — Barrel export (provider, hooks, re-exported SDK types/utils)
  provider.tsx        — SpaceISProvider + useSpaceIS hook
  hooks/
    index.ts          — Barrel for all hooks
    use-cart.ts       — Reactive cart via useSyncExternalStore
    use-products.ts   — useProducts(params?)
    use-product.ts    — useProduct(slug), useProductRecommendations(slug)
    use-categories.ts — useCategories(params?)
    use-packages.ts   — usePackages(params?)
    use-sales.ts      — useSales(params?)
    use-goals.ts      — useGoals(params?)
    use-rankings.ts   — useTopCustomers, useLatestOrders
    use-shop-config.ts— useShopConfig()
    use-checkout.ts   — useCheckout (payment methods + agreements + usePlaceOrder)
    use-recaptcha.ts  — Lazy-loaded reCAPTCHA with retry logic
    use-content.ts    — usePages, usePage, useStatute
  server/
    index.ts          — SSR: createServerClient, prefetch helpers,
                        re-exports dehydrate / QueryClient / HydrationBoundary
```

## Domain conventions — React-specific

### Provider: stable QueryClient via useRef

`SpaceISProvider` stores the `QueryClient` in a `useRef`, not `useMemo`.
`useRef` is guaranteed stable on every render; `useMemo` is only "best
effort" stable in React. Never replace this pattern with `useState` or
`useMemo`.

```tsx
// CORRECT — current implementation
const queryClientRef = useRef<QueryClient | null>(null)
if (!queryClientRef.current) {
  queryClientRef.current = new QueryClient(...)
}
```

### Provider: config prop stability guard

`SpaceISProvider` emits a `console.warn` in development (`process.env.NODE_ENV === 'development'`)
when the `config` prop identity changes after initial mount. This guard was
added in 0.1.4 to surface the common mistake of passing an inline object
literal as `config`.

**Do not remove this guard** when refactoring — it catches a hard-to-debug
stale-closure issue in consumer apps.

```tsx
// BAD — inline object recreated on every render, triggers the dev warning
<SpaceISProvider config={{ baseUrl: '...', shopUuid: '...' }}>

// GOOD — stable reference declared outside the component
const spaceisConfig = { baseUrl: '...', shopUuid: '...' }
export default function Layout({ children }) {
  return <SpaceISProvider config={spaceisConfig}>{children}</SpaceISProvider>
}
```

### useCart — useSyncExternalStore pattern

`useCart` subscribes to `CartManager` via React's `useSyncExternalStore`.
The three arguments map as follows:

```
subscribe        → CartManager.onChange(callback) — returns unsubscribe fn
getSnapshot      → () => cartManager.state        — client snapshot
getServerSnapshot→ () => initialEmptyCart         — SSR snapshot
```

All action callbacks (`add`, `remove`, `setQuantity`, `applyDiscount`,
`clearCart`) are wrapped in `useMemo` so their references are stable across
re-renders (prevents child component churn).

### Query keys

All TanStack Query keys start with `["spaceis", ...]`. This makes bulk
invalidation trivial: `queryClient.invalidateQueries({ queryKey: ["spaceis"] })`.

Do not use a different root key in new hooks — keep the convention.

### staleTime defaults

| Data type | staleTime |
|---|---|
| `useCategories`, `useShopConfig`, `useStatute` | 5–10 min (rarely changes) |
| `useProducts`, `useSales`, `useGoals`, `usePackages` | 30 s |
| `usePaymentMethods`, `useAgreements` | 10 min |
| `useTopCustomers`, `useLatestOrders` | 30 s |

Do not set `staleTime: Infinity` on data that changes in the admin panel
(products, sales).

### usePlaceOrder — cart cleared on success

`usePlaceOrder` calls `cartManager.clearCart()` in its `onSuccess` callback.
This is intentional — after a successful order the cart must reset. Do not
remove this side-effect when refactoring the hook.

### "use client" banner scope

The `"use client"` directive is emitted **only** in the client entry
(`dist/index.js`, `dist/index.cjs`). The server entry (`dist/server.js`,
`dist/server.cjs`) must never carry this banner — Next.js would refuse to
import it in a Server Component.

tsup config drives this via separate entry objects. If you add a new entry
point, decide explicitly which side it belongs to.

## Common mistakes to avoid

- **Passing an inline `config` object to Provider**: `<SpaceISProvider config={{ baseUrl, shopUuid }}>` —
  the object is recreated on every render. Declare it as a module-level
  constant or use `useMemo` with an empty dependency array.

- **Calling `cart.addItem({ productId })` or similar**: the API is
  `cart.add(variantUuid: string, qty: number)`. There is no `addItem`
  method. Check `CartManager` in `@spaceis/sdk` for the full action surface.

- **Using `useCart()` outside a `SpaceISProvider`**: the hook throws
  (or silently returns stale state) if the context is missing. Always
  ensure the Provider is an ancestor in the tree.

- **Mutating `cart.items` directly**: the cart state returned by `useCart`
  is read-only from the consumer perspective. Use the action functions
  (`cart.add`, `cart.remove`, `cart.setQuantity`, etc.).

- **Ignoring `error.isRateLimited` in retry logic**: SpaceIS API rate-limits
  heavy endpoints. When `SpaceISError.isRateLimited` is `true`, do not retry
  immediately — respect the 429 backoff. TanStack Query's default `retry: 3`
  is fine for network errors but should be overridden for validation / rate-limit
  errors.

- **Rendering HTML fields via `dangerouslySetInnerHTML` without sanitisation**:
  `page.content`, `statute.content`, `agreement.content`,
  `product.description` all contain raw HTML from the admin panel. Sanitise
  with DOMPurify before rendering.

- **Importing server helpers from `@spaceis/react`** (client entry): they
  are only available via `@spaceis/react/server`. The client bundle does not
  export `createServerClient` or any prefetch helpers.

## Consumer integration — Next.js App Router SSR

Typical pattern for a page with SSR-prefetched data:

```tsx
// app/shop/page.tsx (Server Component)
import { createServerClient, prefetchProducts } from '@spaceis/react/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import ShopClient from './ShopClient'

export default async function ShopPage() {
  const { queryClient } = createServerClient({
    baseUrl: process.env.SPACEIS_BASE_URL!,
    shopUuid: process.env.SPACEIS_SHOP_UUID!,
  })

  await prefetchProducts(queryClient, { limit: 20 })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ShopClient />
    </HydrationBoundary>
  )
}
```

```tsx
// app/shop/ShopClient.tsx (Client Component)
'use client'
import { useProducts } from '@spaceis/react'

export default function ShopClient() {
  const { data, isLoading } = useProducts({ limit: 20 })
  // ...
}
```

Key points:
- `createServerClient` creates a one-shot client + QueryClient for the request.
- `prefetch*` helpers accept the same params as their hook counterparts.
- `dehydrate` + `HydrationBoundary` must be used together — do not dehydrate
  without the boundary or client-side data will be refetched immediately.
- The `HydrationBoundary` goes in the **Server** Component, wrapping the
  **Client** Component that uses the hooks.

## Examples

Live examples are in `examples/react/` at the monorepo root — a Next.js App
Router app using all hooks with SSR prefetching. Not shipped in the npm tarball.

## Reference

- API docs: https://docs.spaceis.app/api
- Repository: https://github.com/spaceis-app/spaceis-sdk
- npm: https://www.npmjs.com/package/@spaceis/react
- SDK guidance: `node_modules/@spaceis/sdk/AGENTS.md`
