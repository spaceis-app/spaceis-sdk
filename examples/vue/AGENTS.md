# examples/vue — agent guidance

> Canonical instruction file for AI coding agents (Claude Code, Cursor,
> Codex, Copilot). Applies when working on this example OR when a consumer
> copies it via `create-spaceis`.
>
> `CLAUDE.md` in this folder is a thin pointer to this file.
>
> For SDK-level domain conventions (prices in cents, qty in thousandths,
> cart token lifecycle, payment commission as a multiplier, XSS on HTML
> fields) see `packages/sdk/AGENTS.md` (monorepo) or
> `node_modules/@spaceis/sdk/AGENTS.md` (downstream). All of those rules
> apply here too.
>
> For Vue binding internals (plugin/provide-inject shape, MaybeRefOrGetter
> params, shallowRef cart state, getCurrentInstance() SSR guard, cartManager
> nullability) see `packages/vue/AGENTS.md`.

## Overview

Complete shop storefront built with Nuxt 4 + `@spaceis/vue` composables.
Demonstrates Nuxt SSR data fetching, client-only cart management, reCAPTCHA
integration, DOMPurify sanitisation, and the full feature set (products,
packages, sales, checkout, vouchers, daily rewards, CMS pages). 79 unit tests.

## Architecture

```
examples/vue/
├── nuxt.config.ts          — runtimeConfig, CSS, fonts, Nitro routeRules
│                              with CSP + security headers,
│                              components: [{ pathPrefix: false }]
├── app.vue                 — Root (NuxtLayout + NuxtPage)
├── layouts/default.vue     — Header + main + CartDrawer + Footer + ToastContainer
├── pages/                  — File-based routing (auto-registered)
│   ├── index.vue           — Products listing + categories
│   ├── product/[slug].vue  — Product detail (SSR + useSeoMeta + DOMPurify)
│   ├── packages.vue        — Package bundles
│   ├── sales.vue           — Active sales with countdown timers
│   ├── cart.vue            — Cart (client-only via <ClientOnly>)
│   ├── checkout.vue        — Checkout (client-only via <ClientOnly>)
│   ├── voucher.vue         — Voucher redemption (reCAPTCHA)
│   ├── daily-reward.vue    — Daily reward (reCAPTCHA)
│   ├── order/index.vue     — Order summary lookup
│   ├── page/index.vue      — CMS pages list
│   ├── page/[slug].vue     — Single CMS page (DOMPurify)
│   └── statute.vue         — Shop terms (DOMPurify)
├── components/             — Feature-based; pathPrefix:false keeps names flat
│   ├── cart/               — CartDrawer.client.vue, CartContent.client.vue,
│   │                          CartItemRow.vue, DiscountSection.vue, QtyInput.vue
│   ├── checkout/           — CheckoutContent.client.vue
│   ├── products/           — ProductCard.vue, ProductGridSkeleton.vue,
│   │                          Recommendations.vue, SaleCard.vue
│   ├── community/          — CommunitySection.vue
│   ├── layout/             — AppHeader.vue, AppFooter.vue, AppPagination.vue,
│   │                          ToastContainer.vue
│   ├── order/              — OrderContent.vue
│   ├── voucher/            — VoucherContent.vue
│   ├── daily-reward/       — DailyRewardContent.vue
│   └── PlaceholderSvg.vue  — Shared SVG placeholder
├── composables/
│   ├── useCartDrawer.ts    — Drawer open/close state (SSR-safe via useState)
│   ├── useToast.ts         — Toast notifications (SSR-safe via useState)
│   └── useFocusTrap.ts     — Dialog focus-trap (Tab/Shift+Tab cycling,
│                              returns focus to trigger on close)
├── utils/
│   ├── helpers.ts          — fp(), esc(), getErrorMessage()
│   ├── checkout-utils.ts   — calcPaymentFee, commissionPercent, isSafeRedirect
│   └── unit-utils.ts       — formatUnitLabel(step, unit)
├── plugins/spaceis.ts      — SpaceISPlugin install (SSR + client, Cart client-only)
├── server/utils/spaceis.ts — Server-side SpaceIS client for SSR routes
├── assets/styles.css       — All styles
├── error.vue               — Custom error / 404 page
└── __tests__/              — vitest + happy-dom + @vue/test-utils
    ├── helpers.test.ts
    ├── components.test.ts
    ├── checkout-utils.test.ts
    ├── unit-utils.test.ts
    ├── CartItemRow.test.ts
    └── useFocusTrap.test.ts
```

`components/` is grouped by domain; `pathPrefix: false` in `nuxt.config.ts`
keeps auto-imported names short (`<CartDrawer>` not `<CartCartDrawer>`).

## Commands

```bash
pnpm -C examples/vue i --ignore-workspace   # install (standalone, NOT workspace)
pnpm dev                                     # Nuxt dev server → http://localhost:3000
pnpm build                                   # production build (Nitro)
pnpm start                                   # production server
pnpm generate                                # static site generation
pnpm test                                    # vitest run (79 tests)
```

Run commands from `examples/vue/` or prefix with `-C examples/vue`.

## Environment variables

```env
NUXT_PUBLIC_SPACEIS_API_URL=https://storefront-api.spaceis.app
NUXT_PUBLIC_SPACEIS_SHOP_UUID=your-shop-uuid-here
```

`NUXT_PUBLIC_SPACEIS_SHOP_UUID` ships as a placeholder — do not commit a real UUID.

## Testing

- Runner: `vitest` + `happy-dom` + `@vue/test-utils`
- Tests live in `__tests__/` (flat, by file name)
- `@vitejs/plugin-vue` is pinned to `^5.2` — plugin-vue 6 is ESM-only and
  fails under vitest 2 / Vite 5
- 79 tests across helpers, components, checkout-utils, unit-utils,
  CartItemRow, and useFocusTrap

Add tests for any new utility or component.

## Domain conventions — Vue / Nuxt specific

### Standalone install — `--ignore-workspace`

This example is **not** a pnpm workspace member. Always install with:

```bash
pnpm -C examples/vue i --ignore-workspace
```

Do not add `"workspace:*"` dependencies or `pnpm-workspace.yaml` entries here.

### Plugin install — single call, correct config

`plugins/spaceis.ts` installs `SpaceISPlugin` once via `nuxtApp.vueApp.use()`.
The plugin wires up `VueQueryPlugin` internally and provides the SpaceIS
context. Call `app.use(SpaceISPlugin)` exactly once — a second call is silently
ignored but uses the first call's config.

Config is read from `useRuntimeConfig().public` at plugin install time. Changes
to runtimeConfig after that point are not picked up.

### Cart and checkout pages — `<ClientOnly>`

`cart.vue` and `checkout.vue` wrap their content in `<ClientOnly>` because
`useCart()` depends on `localStorage` for cart token persistence. Rendering on
the server produces a hydration mismatch:

```vue
<template>
  <ClientOnly>
    <CartContent />
  </ClientOnly>
</template>
```

Similarly, `CartDrawer.client.vue`, `CartContent.client.vue`, and
`CheckoutContent.client.vue` use the `.client.vue` suffix so Nuxt skips
server rendering entirely.

### `cartManager` nullability in SSR context

`cartManager` is `null` on the server (no `localStorage`). Guard before use:

```ts
const { cartManager } = useSpaceIS();
if (!cartManager) return; // SSR path
cartManager.add(variantUuid, qty);
```

Do not call `useCart()` from Nuxt server routes or `useAsyncData` server-side
callbacks — the composable depends on `cartManager` being present.

### SSR data fetching — composables, not server routes

SSR-capable pages (products, packages, sales, CMS) call `@spaceis/vue`
composables directly in `<script setup>`. TanStack Vue Query handles
server/client serialization via the plugin's built-in hydration support.
There is no `HydrationBoundary` component in Vue — that is React-specific.

For SSR-only fetching outside the plugin context (e.g. Nuxt server routes),
use `useServerSpaceIS()` from `server/utils/spaceis.ts`:

```ts
// server/utils/spaceis.ts
import { createSpaceIS } from "@spaceis/sdk";
export function useServerSpaceIS() {
  const config = useRuntimeConfig();
  return createSpaceIS({
    baseUrl: config.public.spaceisApiUrl as string,
    shopUuid: config.public.spaceisShopUuid as string,
    lang: "pl",
  });
}
```

### `getCurrentInstance()` guard in composables

Composables that attach lifecycle hooks (`onMounted`, `onUnmounted`) must guard
with `getCurrentInstance()` to stay SSR-safe. This pattern is already applied
in `@spaceis/vue`'s `useCart`. Mirror it in any new composable that needs cleanup:

```ts
import { getCurrentInstance, onMounted, onUnmounted } from "vue";
if (getCurrentInstance()) {
  onMounted(() => {
    /* subscribe */
  });
  onUnmounted(() => {
    /* cleanup */
  });
}
```

### DOMPurify sanitisation — `v-html`

`product/[slug].vue`, `page/[slug].vue`, and `statute.vue` render raw HTML from
the API via `v-html`. All three pipe the value through `isomorphic-dompurify`
before binding:

```vue
<div v-html="DOMPurify.sanitize(page.content)" />
```

Never bind `v-html="apiField"` directly — `product.description`,
`page.content`, `statute.content` are stored XSS vectors.

### Open-redirect guard

`utils/checkout-utils.ts` exports `isSafeRedirect(url)`. Always call it before
assigning `result.redirect_url` to `window.location.href` after
`placeOrder.mutateAsync()`. Accepted schemes: `http:` and `https:` only.

### `product.unit` and qty display

`utils/unit-utils.ts` exports `formatUnitLabel(step, unit)`. Use it next to
qty steppers on the product detail page. Cart items do not carry `unit` —
default to `"szt"` in that context.

### Commission display

`utils/checkout-utils.ts` exports `commissionPercent(commission)` and
`calcPaymentFee(basePrice, commission)`. Never render `${commission}%` — a
`commission` of `1.2` means +20%, not +120%.

### Toast system

`composables/useToast.ts` provides `success(msg)` and `error(msg)` backed by
`useState` (SSR-safe). `ToastContainer.vue` renders toasts via
`<Teleport to="body">` with auto-dismiss at 3.5 s. Mounted once in
`layouts/default.vue`. Do not add an external toast library.

### `useCartDrawer` — SSR-safe state

`composables/useCartDrawer.ts` uses Nuxt's `useState` (not a plain `ref`) so
the drawer state is shared across SSR and client without hydration mismatch.

### SEO metadata

```ts
useHead({ title: "Products" });
useSeoMeta({
  title: () => product.value?.name || "Product",
  description: () => product.value?.description?.replace(/<[^>]*>/g, "").slice(0, 160) || "",
});
```

Strip HTML tags from `description` before passing to `useSeoMeta` — the meta
tag must contain plain text.

## Common mistakes to avoid

- **`useCart()` in `useAsyncData` server-side callback**: `cartManager` is null
  on the server — the composable will not update. Move cart logic to client-only
  components.

- **Forgetting `<ClientOnly>` on cart-dependent pages**: `useCart()` reads
  `localStorage` — server render sees an empty cart, client sees the persisted
  one, causing hydration mismatch.

- **Using `ref` instead of `shallowRef` for cart state in new composables**:
  deep reactivity is wasteful for complex nested objects. Follow the existing
  `useCart` pattern.

- **Using `MaybeRef` instead of `MaybeRefOrGetter` for composable params**:
  getter functions (`() => props.slug`) are rejected by `MaybeRef`. Always use
  `MaybeRefOrGetter<T>` and unwrap with `toValue()`.

- **`v-html` without DOMPurify**: `product.description`, `page.content`,
  `statute.content` contain raw HTML — stored XSS if bound directly.

- **Calling `app.use(SpaceISPlugin)` more than once**: second call is silently
  ignored; first-call config wins. Ensure config is correct on first install.

- **Importing server helpers from `@spaceis/vue`** (client entry): server-only
  helpers (`createServerClient`, prefetch helpers) live in `@spaceis/vue/server`.
  There is no `HydrationBoundary` export in `@spaceis/vue` — that is React-specific.

- **Passing raw quantity `1` to `cartManager.add()`**: `CartManager` converts
  to thousandths automatically. Do not pre-multiply by 1000 at the call site.

## Reference

- API docs: https://docs.spaceis.app/api
- Repository: https://github.com/spaceis-app/spaceis-sdk
- npm: https://www.npmjs.com/package/@spaceis/vue
- Monorepo conventions: `AGENTS.md` (root)
- Vue bindings internals: `packages/vue/AGENTS.md`
- SDK domain invariants: `packages/sdk/AGENTS.md`
- React example (for comparison): `examples/react/AGENTS.md`
