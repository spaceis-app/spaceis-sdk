# CLAUDE.md — @spaceis/react

## Overview

React bindings for the SpaceIS SDK. Thin wrapper — no logic is duplicated from `@spaceis/sdk`.

Peer dependencies: `@spaceis/sdk >=0.1.0`, `@tanstack/react-query >=5.0.0`, `react >=18.0.0`

## Architecture

```
src/
  index.ts            — Barrel export (provider, hooks, re-exported SDK types/utils)
  provider.tsx        — SpaceISProvider + useSpaceIS hook
  hooks/
    index.ts          — Barrel for all hooks
    use-cart.ts       — Reactive cart via useSyncExternalStore
    use-products.ts   — useProducts(params?) → paginated list
    use-product.ts    — useProduct(slug), useProductRecommendations(slug)
    use-categories.ts — useCategories(params?)
    use-packages.ts   — usePackages(params?)
    use-sales.ts      — useSales(params?)
    use-goals.ts      — useGoals(params?)
    use-rankings.ts   — useTopCustomers, useLatestOrders
    use-shop-config.ts— useShopConfig()
    use-checkout.ts   — useCheckout (methods + agreements + placeOrder mutation)
    use-recaptcha.ts  — Lazy-loaded reCAPTCHA
    use-content.ts    — usePages, usePage, useStatute
  server/
    index.ts          — SSR: createServerClient, prefetch helpers, re-exports dehydrate/QueryClient/HydrationBoundary
```

## Dual Entry Points

- `@spaceis/react` — Client-side hooks/provider. Has `"use client"` banner in built output.
- `@spaceis/react/server` — SSR helpers for Next.js. No `"use client"` banner.

## Build

```bash
pnpm build      # tsup → dist/ (ESM + CJS + types for both entries)
pnpm dev        # watch mode
pnpm typecheck  # tsc --noEmit
pnpm test       # vitest run
```

## Key Patterns

- **SpaceISProvider** wraps app with TanStack QueryClientProvider + SpaceIS context
- **useCart()** uses `useSyncExternalStore` to subscribe to CartManager — no re-render storms
- **Query keys** all start with `["spaceis", ...]` — easy bulk invalidation
- **SSR pattern**: Server Component creates QueryClient → prefetch → dehydrate → HydrationBoundary wraps Client Component
- **staleTime** defaults: categories/config/statute 5-10min (static), products/sales 30s (dynamic)

## Examples

Examples live in `examples/react/` at the monorepo root — a Next.js App Router app using all hooks with SSR prefetching.
