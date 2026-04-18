# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [examples 0.2.0] - 2026-04-19

Audit-driven hardening pass for all four examples — **vanilla**,
**PHP**, **react** (Next.js), and **vue** (Nuxt). All examples are now
structurally ready for the 0.2.0 release — only the SDK pin update
remains, which must run after `@spaceis/sdk@0.2.0` is published
(`pnpm bump-sri 0.2.0` for vanilla/PHP IIFE; manual `package.json`
bump for react/vue).

### Added — Vanilla
- DOMPurify sanitisation on `product.description` in the PDP modal
  (`shared/modal.js`); DOMPurify CDN loaded on `index.html` and
  `packages.html` (the pages that open the modal).
- `shared/categories.js` — shared category filter + subcategory render
  module. Previously duplicated ~80 LoC between `index.html` and
  `packages.html`.
- `shared/recommendations.js` exports `loadRecsForFirstCartItem()` — a
  parametrised helper used by the cart drawer and the checkout page.
- `shared/cart-drawer.js` — drawer-specific render + state extracted
  from the previously 603-LoC `shared/cart.js`. Holds
  `renderCartDrawer`, `renderCartItems`, `toggleCart`, `clearCart`,
  `renderCartBadge`, `isCartOpen`, and the `_cartOpen` state.
  `shared/cart.js` is now 302 LoC of shared primitives (qty handlers,
  discount section, skeletons, summary, limits cache).
- `.qty-unit` CSS class in `styles.css` — styles the unit label next
  to quantity steppers.

### Added — PHP
- `includes/js/` — 7 ES modules (`app`, `format`, `toast`, `mobile-menu`,
  `badge`, `cart-ops`, `cart-drawer`, `cart-item`) replacing the
  previously monolithic ~450 LoC inline `<script>` in `includes/footer.php`.
- `<template>` + DOMPurify pattern for HTML fields (`page.content`,
  `statute.content`, `product.description`). Scripts inside a
  `<template>` tag are inert — they do not execute during HTML parsing;
  DOMPurify sanitises before injecting into the live DOM.
- `$loadDOMPurify` flag in `includes/header.php` — pages that render
  raw API HTML set this to conditionally load DOMPurify via CDN with
  an SRI hash.
- `<script type="application/json" id="spaceis-config">` — SDK base URL
  and shop UUID are now passed to the module loader via a JSON tag
  (replaces direct `<?= e(...) ?>` interpolation into JS string literals).
- `SpaceISApp.renderCartItemHtml(item, layout)` — shared cart-item
  renderer used by the drawer, cart page, and checkout page.
- `isLastFailed()` on the `SpaceISApi` class — lets templates
  distinguish a service-unavailable state from an empty-result state.
  `product.php` now returns `503` on API failure, `404` on genuine
  not-found.
- `AGENTS.md` — canonical agent-guidance file for the example.
  `CLAUDE.md` reduced to a thin pointer. Covers folder structure,
  the `spaceis:ready` protocol, `SpaceISApp` global contract,
  commission-multiplier / unit / HTML-sanitisation gotchas, and
  common AI-agent mistakes.
- README security notes — `.env` exposure via `php -S` docroot,
  Nginx/Apache dotfile deny rules, SSRF scheme-guard behaviour,
  `<template>` + DOMPurify sanitisation strategy, CSP caveat for
  inline `onclick=` handlers.
- `unit` display next to the PDP quantity stepper
  (`product.php`) — reads `$product['unit']` from the API response
  (new field in SDK 0.2.0). Replaces hardcoded `"pcs."` strings in
  the unit-price label and recommendation qty badges.

### Changed — Vanilla
- Renamed each example's `INSTRUCTIONS.md` → `README.md`. Same content,
  now the standard first-read file in each example folder (php, react,
  vanilla, vue). The old "For AI Agents" framing is replaced with a
  unified banner that serves both humans following the tutorial and
  AI coding agents collaborating on integration.
- Bumped pinned SDK version references (`0.1.x` → `0.2.0`) in the
  integration code samples (vanilla example, 2 occurrences).
- `shared/main.js` flat `window.*` globals are now derived via
  `Object.assign(window, window.ShopUI)` — a single source of truth
  instead of two parallel lists that could drift.
- `shared/cart.js` `renderDiscountSection()` uses event delegation on
  the stable parent container (tracked via a `WeakSet`) instead of
  re-attaching listeners to each re-rendered button. Prevents
  listener stacking on rapid cart updates.
- `shared/modal.js` `renderModalShell()` is no longer `export`ed —
  it is module-private.

### Changed — PHP
- `includes/footer.php` reduced from 459 lines to 16: HTML footer +
  SDK CDN tag + JSON config tag + `<script type="module">` loader.
  All client-side behaviour moved to `includes/js/` ES modules.
- `order.php` auto-lookup on URL `?order=…` now uses `spaceis:ready`
  (previously `DOMContentLoaded`, which can fire before the ES module
  completes) and reads `codeFromUrl` via `json_encode` (JS-string-safe
  literal, defends against backslash / unicode in the URL param).
- `SPACEIS_API_URL` is scheme-validated (http/https only) in
  `SpaceISApi::__construct` — prevents SSRF via a misconfigured
  `file://` or custom-scheme env value.

### Fixed — Vanilla
- `daily-reward.html` — click handler on `#daily-submit-btn` is now
  registered inside `spaceis:ready`. Previously, if a user clicked
  the button before `shared/main.js` (a deferred ES module) finished
  loading, the handler hit an undefined `client` global.
- `order-summary.html` — same fix for the "Check" button click +
  Enter-key handler. The URL-code auto-load path was already guarded.
- `checkout.html` — `result.redirect_url` from the API is now
  validated to be an `http(s)://` URL via `new URL(...).protocol`
  before `window.location.href`. Defends against a compromised API
  returning `javascript:` / `data:` redirects.

### Fixed — PHP
- `checkout.php` — `PaymentMethod.commission` is now correctly treated
  as a **multiplier** (`1.2` = +20% surcharge), not a percentage integer.
  Affects three sites: fee amount calculation
  (`Math.round(finalPrice * commission - finalPrice)`), payment-method
  label, and summary fee row. Display uses
  `Math.round((commission - 1) * 100)%`. Matches the SDK JSDoc
  clarification and the vanilla example.
- `checkout.php` — `RETURN_URL` / `CANCEL_URL` environment values are
  validated via `filter_var(FILTER_VALIDATE_URL)` and serialised with
  `json_encode` (JS-string-safe) before reaching the `placeOrder` call.
- `includes/footer.php` — `window.SpaceISApp` was previously assigned
  twice (an early stub before `cart.onChange()` subscription, then a
  full overwrite after all helpers were defined). The early stub lacked
  `showToast`, `addToCart`, etc. If `onChange` fired between the two
  assignments (e.g. `createCartManager({ autoLoad: true })` settled
  fast), handlers threw `TypeError`. Now assigned once, after all
  definitions, with the subscription attached afterwards.
- `page.php`, `statute.php`, `product.php` — raw API HTML is no longer
  echoed directly into a live DOM container. Content is rendered into
  an inert `<template>` and sanitised client-side with DOMPurify before
  being placed in the live DOM. Hardens against a compromised admin
  panel or MITM'd API response inserting stored XSS payloads.

### Security — Vanilla
- Defence-in-depth protocol guard on `checkout.html` redirect URL
  (see Fixed).
- DOMPurify sanitisation on all four raw-HTML rendering sites
  (`page.content`, `statute.content`, `agreement.content` already
  sanitised; `product.description` in the PDP modal now too).

### Security — PHP
- SSRF guard on `SPACEIS_API_URL` (see Changed).
- Open-redirect guard on `RETURN_URL` / `CANCEL_URL` (see Fixed).
- XSS hardening via `<template>` + DOMPurify on all three raw-HTML
  sites (see Fixed).
- `SpaceISApp` double-assignment race fix (see Fixed).

### Documentation
- `examples/vanilla/AUDIT-2026-04-18.md` and
  `examples/php/AUDIT-2026-04-18.md` — full audit reports grouped
  by severity (KRYTYCZNE / WAŻNE / TECH-DEBT / INFO) with file:line
  references and effort estimates.
- PHP example README expanded with a **Security notes** section:
  `.env` exposure via `php -S`, dotfile deny rules for Nginx and
  Apache, the `<template>` + DOMPurify sanitisation pattern, and a
  CSP caveat for the inline `onclick=` handlers used throughout the
  example for pedagogical clarity.

### Added — React (Next.js)
- `src/features/` tree — feature-based folder layout replacing the
  flat `views/` + `components/`. Domains: `cart`, `checkout`,
  `products`, `packages`, `sales`, `content`, `community`, `voucher`,
  `daily-reward`, `order`. Shared cross-feature UI stays in
  `components/` (`Pagination`, `SafeHtml`, `PlaceholderSVG` +
  `components/layout/{Header,Footer}`). ~17 file renames preserved
  via `git mv`.
- `src/components/CartItemRow.tsx` — shared cart item renderer with
  `layout: 'drawer' | 'cart' | 'checkout'` prop. Replaces ~100 LoC
  of duplicated JSX across CartDrawer, CartPage and CheckoutPage.
- `src/components/DiscountSection.tsx` — self-contained discount
  apply/remove component reading `useCart()` directly. Removes
  discount-handler duplication across three views.
- `src/components/SafeHtml.tsx` — wraps `isomorphic-dompurify`; drops
  into any place that previously used raw `dangerouslySetInnerHTML`.
- `src/lib/use-focus-trap.ts` — generic `useFocusTrap(isOpen)` hook
  returning a ref callback. Cycles Tab/Shift+Tab inside the container,
  focuses the first focusable on open, restores focus to the trigger
  on close. Wired into `CartDrawer`.
- `src/features/checkout/checkout-utils.ts` — pure helpers
  (`calcPaymentFee`, `commissionPercent`, `isSafeRedirect`).
- `src/features/products/unit-utils.ts` — `formatUnitLabel(step, unit)`
  shared with vanilla/PHP/vue semantics.
- Security headers via `next.config.ts` `headers()` — CSP
  (without nonces — keeps dev HMR working), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy`.
- 6 new test files — `checkout-utils`, `unit-utils`, `SafeHtml`,
  `CartItemRow`, `use-focus-trap`, plus existing `helpers` + `components`.
  91 tests total, all pass.

### Changed — React
- Commission math — treated as multiplier (not percent) in
  `CheckoutPage.tsx`. Was
  `Math.round((finalPrice * commission) / 100)`, now
  `calcPaymentFee(finalPrice, commission)` which is
  `Math.round(base * commission - base)` with a `commission > 1`
  guard. Payment method labels and summary row now render
  `commissionPercent(commission)%`.
- `ProductPage`, `ContentPage`, `StatutePage` — replaced raw
  `dangerouslySetInnerHTML` on `product.description`, `page.content`,
  `statute.content` with `<SafeHtml html={…} />`.
- Cart drawer, cart page, checkout — now delegate to `<CartItemRow />`
  and `<DiscountSection />`. CartDrawer: 318 → 139 LoC. CartPage:
  296 → 104. CheckoutPage: 465 → 278.
- `CartDrawer.tsx` — `role="dialog" aria-modal` already present, now
  also: Escape closes, `useFocusTrap` keeps Tab inside the drawer.
- `Header.tsx` + `cart-drawer-context.tsx` — moved `document.body.style.overflow`
  mutations out of store reducers into `useEffect` bodies. Removes
  SSR crash risk if Nuxt ever evaluates them on the server.
- `OrderSummaryPage.tsx` — dropped `useState<any>`; uses
  `OrderSummary | null` + `OrderSummaryItem` from `@spaceis/react`.
  `loadOrder` wrapped in `useCallback`; the `eslint-disable-next-line`
  that masked a real missing dep is removed.
- `CommunitySection`, `Recommendations` — dropped 5 `any` map callbacks
  for `TopCustomer`, `LatestOrder`, `Goal`, `PackageRecommendation`
  types re-exported from `@spaceis/react`.
- `CheckoutPage.tsx` — `nick` and `email` inputs now carry
  `maxLength={32}` and `maxLength={255}` respectively.
- `package.json` — `next` bumped to `^16.2.4` (patches
  `GHSA-q4gf-8mx6-v5v3` DoS CVE on `<16.2.3`). `isomorphic-dompurify`
  `^3.9.0` added.

### Fixed — React
- Open-redirect on `CheckoutPage.tsx:87` — `window.location.href = result.redirect_url`
  is now guarded by `isSafeRedirect()` which enforces an `http(s):`
  allow-list.
- ESM-only CSS import errors on fresh checkout — `src/globals.d.ts`
  adds a `declare module "*.css"` so TS 6 resolves side-effect imports
  before `.next/types/` is generated.

### Added — Vue (Nuxt)
- `components/` reorganised into feature subdirectories —
  `cart/`, `checkout/`, `products/`, `community/`, `layout/`,
  `order/`, `voucher/`, `daily-reward/`. Nuxt `components: [{ path:
  '~/components', pathPrefix: false }]` keeps auto-imported names
  short (`<CartDrawer>`, not `<CartCartDrawer>`).
- `components/cart/CartItemRow.vue` — shared cart-item component
  with `layout: 'drawer' | 'cart' | 'checkout'` prop. Uses
  `<component :is>` for the polymorphic root (`<li>` for drawer,
  `<div>` for cart/checkout) and class maps to keep per-surface CSS
  stable. Reads `useCart()` + `useToast()` internally.
- `components/cart/DiscountSection.vue` — self-contained apply/remove
  component with its own `pending` guard and toast.
- `composables/useFocusTrap.ts` — Vue port of the React focus-trap
  hook. Watches `isOpen`, focuses the first focusable on open, cycles
  Tab/Shift+Tab inside the container, returns focus to the trigger
  on close. Wraps the whole effect in `if (import.meta.client)` so
  Nuxt SSR does not crash.
- `utils/checkout-utils.ts` and `utils/unit-utils.ts` — same pure
  helpers as the React example (`calcPaymentFee`, `commissionPercent`,
  `isSafeRedirect`, `formatUnitLabel`).
- Security headers via Nitro `routeRules` in `nuxt.config.ts` —
  CSP (including `https://www.google.com` / `gstatic.com` for
  reCAPTCHA iframe + scripts), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy`.
- 4 new test files — `checkout-utils` (24 tests), `unit-utils`
  (8 tests), `CartItemRow` (11 tests), `useFocusTrap` (4 tests).
  79 tests total.

### Changed — Vue
- Commission math — `CheckoutContent.client.vue` now uses
  `calcPaymentFee(finalPrice, commission)` + `commissionPercent(m.commission)`
  with a `commission > 1` guard. Payment method labels and the fee
  summary row are only rendered when there is a real surcharge.
- `CartDrawer.client.vue`, `CartContent.client.vue` and
  `CheckoutContent.client.vue` — delegate to `<CartItemRow>` and
  `<DiscountSection>`. Net −411 LoC across the three files,
  replaced by the two shared components.
- `AppHeader.vue` — `document.body.style.overflow` mutation moved
  out of the `toggleMobileMenu`/`closeMobileMenu` event handlers
  into a `watch(mobileMenuOpen)` effect guarded by
  `if (import.meta.client)`. Adds an `onBeforeUnmount` cleanup so
  navigation away from a page with the mobile menu open does not
  leave the body scroll-locked.
- `OrderContent.client.vue` — `ref<any>` replaced with
  `ref<OrderSummary | null>`.
- `SaleCard.vue` — `sale: any` prop replaced with
  `sale: Sale` from `@spaceis/vue`. The stray `ends_at` fallback
  (never existed on the type) removed.
- `pages/{index,packages}.vue` — three `any`-typed `.filter((c: any) => c.is_active)`
  calls now type `c` as `ShopCategory`.
- `pages/sales.vue` — dropped `(data.value as any)?.data` cast;
  `useSales` already returns `PaginatedResponse<Sale>`.
- `CheckoutContent.client.vue` — `nick` and `email` inputs gained
  `maxlength="32"` and `maxlength="255"` respectively.

### Fixed — Vue
- Open-redirect in `CheckoutContent.client.vue` — guarded by
  `isSafeRedirect()` (same helper as React).
- `@vitejs/plugin-vue` pinned to `^5.2.0` — version 6 is ESM-only
  and fails to load under vitest 2 / Vite 5 `require()`-based
  transforms.

### Security — React
- Open-redirect guard, CSP header, `isomorphic-dompurify` for three
  CMS HTML sites, `next` bumped past the DoS CVE.

### Security — Vue
- Open-redirect guard, full CSP header (including reCAPTCHA allow-list),
  SSR-safe body-scroll lock. No XSS surface — all three `v-html` sites
  already sanitised via `isomorphic-dompurify` in prior release
  (`sanitizedContent` / `sanitizedDescription` computed properties).

### Documentation — React + Vue
- `examples/react/README.md` and `examples/vue/README.md` — Project
  Structure sections updated to reflect the feature-based layout
  (react: `src/features/` + `lib/` + `components/layout/`; vue:
  `components/{cart,checkout,products,community,layout,…}/` with
  `pathPrefix: false`). Both READMEs now enumerate the test files
  and test count.

## [@spaceis/sdk 0.2.0] - 2026-04-17

Audit-driven release hardening the public API, fixing two edge-case runtime
bugs, and clarifying security expectations for consumers of HTML-typed fields.

### Added
- `ShowShopProduct.unit` — human-readable quantity unit label (e.g. `"szt"`,
  `"dni"`, `"min"`) returned by `GET /products/{shopProduct}`. Intended for
  display next to quantity inputs (e.g. `"+1 szt"`, `"-1 dni"`). Not present
  on list/cart/order responses — only the product detail endpoint.

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
- `PaymentMethod.commission` JSDoc now correctly describes it as a **price
  multiplier** (`final = base * commission`, e.g. `1.2 × 100 PLN = 120 PLN`),
  not a percentage. The previous wording suggested the value was a % surcharge
  added to the order — that was incorrect.
- Promoted `AGENTS.md` as the canonical agent-guidance file for the SDK.
  `CLAUDE.md` remains as a thin pointer for Claude Code's hierarchical
  loading. `AGENTS.md` ships in the npm tarball.
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

### Documentation
- Promoted AGENTS.md as canonical agent-guidance file. CLAUDE.md kept as
  a thin pointer for Claude Code's hierarchical loading. AGENTS.md ships
  in the npm tarball.

## [@spaceis/vue 0.2.0] - 2026-04-17

### Changed
- Peer dependency `@spaceis/sdk` bumped to `>=0.2.0`. Downstream TypeScript
  consumers inherit the stricter query-params typing (see SDK 0.2.0 notes).

### Documentation
- Promoted AGENTS.md as canonical agent-guidance file. CLAUDE.md kept as
  a thin pointer for Claude Code's hierarchical loading. AGENTS.md ships
  in the npm tarball.

## [create-spaceis 0.2.0] - 2026-04-17

### Added
- After downloading an example template, the CLI now fetches the `latest`
  version of every `@spaceis/*` dependency from the npm registry and
  rewrites the example's `package.json` before running `install`. This
  means a fresh `npx create-spaceis` always lands on the current release
  even if the committed example references an older version.
- Graceful offline fallback: if the npm registry is unreachable the CLI
  prints a warning and continues with the example-provided versions,
  rather than failing the whole run.

### Changed
- Bumped to 0.2.0 to align with the `@spaceis/sdk` / `@spaceis/react` /
  `@spaceis/vue` 0.2.0 release trio.

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
