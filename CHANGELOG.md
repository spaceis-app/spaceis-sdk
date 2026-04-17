# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [@spaceis/sdk 0.2.0] - 2026-04-17

Audit-driven release hardening the public API, fixing two edge-case runtime
bugs, and clarifying security expectations for consumers of HTML-typed fields.

### Changed
- **BREAKING (TS)**: `GetProductsParams`, `GetCategoriesParams`, `GetSalesParams`,
  `GetGoalsParams`, `GetPackagesParams`, `GetPagesParams`, `GetTopCustomersParams`,
  `GetLatestOrdersParams` no longer carry an `[key: string]: unknown` index
  signature. Use the new `extraParams?: Record<string, unknown>` field to forward
  undocumented API parameters. Runtime behaviour is unchanged; only TypeScript
  now rejects unknown top-level keys (catches typos like `categori_slug`).
  - Migration: `client.products.list({ category_slug: 'vip', custom: 'x' })` →
    `client.products.list({ category_slug: 'vip', extraParams: { custom: 'x' } })`.
- `CartManager._mutate()` now resets `isLoading` and `error` on its success path.
  The helper `applyMutation()` is renamed to `applyCart()` and only assigns
  `_cart` — notification and state reset live in one place. Notification
  semantics are unchanged (2 notifies per mutation: start + end).

### Fixed
- `RecaptchaModule`: the global callback registered on `globalThis` now uses a
  unique name per load attempt (`__spaceis_recaptcha_cb_<random>`). Fixes a
  denial-of-service when two SDK instances coexist on the same page
  (multi-shop embed, React StrictMode double-mount, HMR re-render).
- `buildUrl()` (`http.ts`) defensively handles a non-object `extraParams` value.

### Removed
- `RawOrderSummary` is no longer re-exported from `@spaceis/sdk`. The type
  was marked `@internal` and described the un-normalised API shape
  (`items: T | T[]`). Consumers should use the public `OrderSummary` type.

### Security
- `Agreement.content`, `ShopPage.content`, `Statute.content`, and
  `ShowShopProduct.description` now carry a JSDoc `@remarks` warning that
  these fields contain raw HTML from the API and must be sanitised
  (e.g. via DOMPurify) or escaped before being written to `innerHTML`.

### Documentation
- Full JSDoc with `@param`, `@returns`, and `@example` added to `cartToken`,
  `setCartToken`, `setLang`, `getCartItemImage`, and `escapeHtml`.
- Removed duplicate `"shop"` keyword from `package.json`.

### Internal
- `generateCallbackName()` exported (`@internal`) from
  `modules/recaptcha.ts` for testability.
- New test files: 5 new `buildUrl` tests for `extraParams` handling,
  3 new `RecaptchaModule.generateCallbackName` tests, 3 new `CartManager`
  notify-count invariant tests.
- Bump `typescript` 6.0.2 → 6.0.3.

## [@spaceis/react 0.2.0] - 2026-04-17

### Changed
- Peer dependency `@spaceis/sdk` bumped to `>=0.2.0`. Downstream TypeScript
  consumers inherit the stricter query-params typing (see SDK 0.2.0 notes).
- Removed duplicate `"shop"` keyword from `package.json`.

## [@spaceis/vue 0.2.0] - 2026-04-17

### Changed
- Peer dependency `@spaceis/sdk` bumped to `>=0.2.0`. Downstream TypeScript
  consumers inherit the stricter query-params typing (see SDK 0.2.0 notes).

## [@spaceis/sdk 0.1.6] - 2026-04-10

### Fixed
- `CartManager`: extract `_mutate()` helper — eliminates 7 identical try/catch blocks
- `OrderSummary` type: API may return `items` as single object or array — normalize to always-array; split into internal `RawOrderSummary` and public `OrderSummary`
- `client.ts`: `_config` is now truly private; added public `lang` getter
- `escapeHtml`: typed escape map with exhaustive keys; fallback via `?? ch`
- `RecaptchaModule`: reset `_configPromise` on failure to allow retry
- `encodeURIComponent` applied to `siteKey` and callback name in reCAPTCHA script URL (security)

### Added
- `CartManager.error` typed as `SpaceISError | Error | null` (was `unknown`)

## [@spaceis/react 0.1.4] - 2026-04-10

### Fixed
- `useCart`: all action callbacks wrapped in `useMemo` — stable references across re-renders
- `useRecaptcha`: concurrent `execute()` calls deduplicated via `loadPromiseRef`
- `SpaceISProvider`: warns in console when `config` prop identity changes after mount

## [@spaceis/vue 0.1.1] - 2026-04-10

### Fixed
- All composables: `queryKey` wrapped in `computed(() => [..., toValue(params)])` — fixes SSR hydration miss when params are reactive refs
- `useCart`: lifecycle hooks (`onMounted`/`onUnmounted`) guarded by `getCurrentInstance()` — no SSR warning
- `useCart`: `ref` → `shallowRef` for cart, isLoading, error — avoids deep reactivity on complex objects

## [@spaceis/sdk 0.1.4] - 2026-03-29

### Changed
- DRY: extract duplicate `QTY_MULTIPLIER` constant in CartManager
- Add clarifying comments on HTTP response type assertion and autoLoad

### Fixed
- Improved README: table of contents, CartManager options, low-level API, snapQuantity examples, lifecycle hooks, related packages

## [@spaceis/react 0.1.3] - 2026-03-29

### Fixed
- Remove unsafe type assertion in `useCart` subscribe callback
- `useRecaptcha` now retries on load failure (resets loaded flag)

### Added
- 4 new SSR prefetch helpers: `prefetchTopCustomers`, `prefetchLatestOrders`, `prefetchPaymentMethods`, `prefetchAgreements`
- Explicit `staleTime: 10min` on `usePaymentMethods` and `useAgreements`
- Improved README: badges, table of contents, complete server helpers table, utilities section, related packages

## [@spaceis/vue 0.1.0] - 2026-03-29

### Added
- `SpaceISPlugin` — Vue 3 plugin with provide/inject + TanStack Vue Query
- 18 composables: `useProducts`, `useProduct`, `useProductRecommendations`, `useCategories`, `usePackages`, `useSales`, `useGoals`, `useTopCustomers`, `useLatestOrders`, `useShopConfig`, `usePaymentMethods`, `useAgreements`, `usePlaceOrder`, `useCheckout`, `useRecaptcha`, `usePages`, `usePage`, `useStatute`
- `useCart()` — reactive cart via Vue refs + `CartManager.onChange`, SSR-safe fallback
- `useRecaptcha()` — lazy-loaded reCAPTCHA with SSR guard and retry on failure
- 14 SSR prefetch helpers (`@spaceis/vue/server`) for Nuxt
- Nuxt 4 example (`examples/vue/`) with SSR, SEO, DOMPurify, editable qty inputs
- 57 tests (plugin, exports, composables, server prefetch helpers)

## [@spaceis/sdk 0.1.3] - 2026-03-28

### Added
- `snapQuantity(qty, limits)` — utility to snap a quantity to the nearest valid value respecting min, max, and step
- PHP SSR example (`examples/php/`) — complete storefront with server-side rendering

### Changed
- Examples now use published npm packages instead of workspace links
- Pin CDN links to specific SDK version in vanilla and PHP examples

## [@spaceis/react 0.1.2] - 2026-03-28

### Added
- Re-export `snapQuantity` from `@spaceis/sdk`
- Editable quantity inputs in cart, drawer, checkout with auto-snap to product limits (`QtyInput` component)
- Product detail page (`/product/[slug]`) with SSR, SEO metadata, and OG image
- Sitemap (`/sitemap.xml`) and robots.txt
- Custom 404 page

### Changed
- Standardized all imports to `@/` path alias
- Examples use npm packages instead of workspace links

## [@spaceis/react 0.1.1] - 2026-03-28

### Changed
- Updated repository URL

## [@spaceis/react 0.1.0] - 2026-03-28

### Added

- `SpaceISProvider` — root React context with built-in TanStack QueryClient
- 19 data hooks: `useProducts`, `useProduct`, `useProductRecommendations`, `useCategories`, `usePackages`, `useSales`, `useGoals`, `useTopCustomers`, `useLatestOrders`, `useShopConfig`, `usePaymentMethods`, `useAgreements`, `usePlaceOrder`, `useCheckout`, `useRecaptcha`, `usePages`, `usePage`, `useStatute`
- `useCart()` — reactive cart via `useSyncExternalStore` with full cart operations
- SSR prefetch helpers (`@spaceis/react/server`) — `createServerClient`, `prefetchProducts`, `prefetchCategories`, and 9 more for Next.js Server Components
- Dual entry points: `@spaceis/react` (client, `"use client"` banner) and `@spaceis/react/server` (SSR)
- Next.js App Router example with SSR, SEO metadata, sitemap, robots.txt, product detail pages, community section
- 47 tests (provider, hooks, server helpers, exports)

### Changed

- Moved examples from `packages/sdk/examples/` to root `examples/`
- Vanilla example now uses CDN imports (jsdelivr)
- Added CartManager tests to `@spaceis/sdk` (63 new test cases)
- Updated all packages to TypeScript 6, React 19, Next.js 16

## [@spaceis/sdk 0.1.2] - 2026-03-28

### Added
- CartManager test suite (63 test cases)

### Changed
- Upgraded to TypeScript 6
- Require Node.js >= 20 (dropped Node 18)
- Updated repository URL to `spaceis-app/spaceis-sdk`

### Fixed
- Node.js version in README browser support section

## [0.1.1] - 2025-03-27

### Fixed
- Updated README with unpkg CDN link

## [0.1.0] - 2025-03-27

### Added

- `createSpaceIS()` factory and `SpaceISClient` class
- API modules: products, categories, cart, checkout, orders, content, sales, goals, packages, vouchers, daily rewards, rankings, shop, recaptcha
- `CartManager` with reactive state, localStorage persistence, and auto token management
- `SpaceISError` with field-level validation, status helpers (`isValidation`, `isNotFound`, `isRateLimited`)
- Utility functions: `formatPrice`, `centsToAmount`, `fromApiQty`, `toApiQty`, `getProductLimits`, `getCartItemImage`, `getItemQty`, `escapeHtml`
- ESM, CJS, and IIFE (browser global `window.SpaceIS`) builds
- Full TypeScript type definitions
