# CLAUDE.md — @spaceis/vue

## Overview

Vue 3 bindings for the SpaceIS SDK. Thin wrapper — no logic is duplicated from `@spaceis/sdk`.

Peer dependencies: `@spaceis/sdk >=0.1.0`, `@tanstack/vue-query >=5.0.0`, `vue >=3.3.0`

## Architecture

```
src/
  index.ts              — Barrel export (plugin, composables, re-exported SDK types/utils)
  plugin.ts             — SpaceISPlugin + SpaceISKey injection key
  composables/
    index.ts            — Barrel for all composables
    use-spaceis.ts      — inject client + cartManager
    use-cart.ts         — Reactive cart via shallowRef + CartManager.onChange
    use-products.ts     — useProducts(params?) → paginated list
    use-product.ts      — useProduct(slug), useProductRecommendations(slug)
    use-categories.ts   — useCategories(params?)
    use-packages.ts     — usePackages(params?)
    use-sales.ts        — useSales(params?)
    use-goals.ts        — useGoals(params?)
    use-rankings.ts     — useTopCustomers, useLatestOrders
    use-shop-config.ts  — useShopConfig()
    use-checkout.ts     — useCheckout (methods + agreements + placeOrder mutation)
    use-recaptcha.ts    — Lazy-loaded reCAPTCHA
    use-content.ts      — usePages, usePage, useStatute
  server/
    index.ts            — SSR: createServerClient, prefetch helpers, re-exports dehydrate/QueryClient
```

## Dual Entry Points

- `@spaceis/vue` — Client-side composables/plugin.
- `@spaceis/vue/server` — SSR helpers for Nuxt. No client-side code.

## Build

```bash
pnpm build      # tsup → dist/ (ESM + CJS + types for both entries)
pnpm dev        # watch mode
pnpm typecheck  # tsc --noEmit
pnpm test       # vitest run
```

## Key Patterns

- **SpaceISPlugin** installs VueQueryPlugin + provides SpaceIS context via `provide/inject`
- **useCart()** uses `shallowRef` + `CartManager.onChange` for reactive cart state
- **Data composables** use `MaybeRef` params + `toValue()` for reactive query parameters
- **Query keys** all start with `["spaceis", ...]` — easy bulk invalidation
- **SSR pattern**: Nuxt server route creates QueryClient → prefetch → dehydrate → client hydrates
- **staleTime** defaults: categories/config/statute 5-10min (static), products/sales 30s (dynamic)

## Key Differences from @spaceis/react

1. Plugin (app.use) instead of Provider component
2. provide/inject with InjectionKey instead of React Context
3. shallowRef + onUnmounted instead of useSyncExternalStore
4. MaybeRef + toValue for reactive params instead of plain values
5. No "use client" banner (Vue doesn't need it)
6. Server entry does NOT export HydrationBoundary (React-specific)
