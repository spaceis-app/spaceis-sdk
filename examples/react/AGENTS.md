# examples/react — agent guidance

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
> For React binding internals (Provider lifetime, query-key conventions,
> `useSyncExternalStore` cart, SSR hydration pattern, staleTime defaults)
> see `packages/react/AGENTS.md`.

## Overview

Complete shop storefront built with Next.js 16 App Router + `@spaceis/react`
hooks. Demonstrates SSR prefetching via `HydrationBoundary`, client-only cart
management, reCAPTCHA integration, and the full feature set (products, packages,
sales, checkout, vouchers, daily rewards, CMS pages). 91 unit tests.

## Architecture

```
examples/react/
├── src/
│   ├── app/                    — Next.js App Router routes
│   │   ├── layout.tsx          — Root layout (Providers + Header/Footer + CartDrawer)
│   │   ├── page.tsx            — Products listing (SSR prefetched)
│   │   ├── product/[slug]/     — Product detail (SSR + dynamic metadata)
│   │   ├── packages/           — Package bundles (SSR prefetched)
│   │   ├── sales/              — Active promotions (SSR prefetched)
│   │   ├── cart/               — Cart (client-only, next/dynamic ssr:false)
│   │   ├── checkout/           — Checkout (client-only, next/dynamic ssr:false)
│   │   ├── voucher/            — Voucher redemption
│   │   ├── daily-reward/       — Daily reward claim
│   │   ├── order/              — Order summary lookup
│   │   ├── page/               — CMS pages list + detail
│   │   └── statute/            — Shop terms / statute
│   ├── features/               — Feature-based layout (post-audit refactor)
│   │   ├── cart/               — CartDrawer, CartPage, CartItemRow,
│   │   │                          DiscountSection, ClientCartDrawer,
│   │   │                          QtyInput, cart-drawer-context
│   │   ├── checkout/           — CheckoutPage, checkout-utils
│   │   │                          (calcPaymentFee, commissionPercent, isSafeRedirect)
│   │   ├── products/           — ProductsPage, ProductPage, ProductCard,
│   │   │                          Recommendations, unit-utils
│   │   ├── packages/           — PackagesPage
│   │   ├── sales/              — SalesPage
│   │   ├── content/            — ContentPage, StatutePage
│   │   ├── community/          — CommunitySection
│   │   ├── voucher/            — VoucherPage
│   │   ├── daily-reward/       — DailyRewardPage
│   │   └── order/              — OrderSummaryPage
│   ├── components/             — Cross-feature UI
│   │   ├── layout/             — Header.tsx, Footer.tsx
│   │   ├── Pagination.tsx
│   │   ├── PlaceholderSVG.tsx
│   │   └── SafeHtml.tsx        — isomorphic-dompurify wrapper
│   ├── lib/
│   │   ├── helpers.ts          — fp(), esc(), getErrorMessage()
│   │   ├── server.ts           — Server-side SpaceIS client factory
│   │   └── use-focus-trap.ts   — Dialog focus-trap hook
│   └── providers.tsx           — SpaceISProvider + Sonner Toaster
├── __tests__/                  — vitest + @testing-library/react + jsdom
│   ├── helpers.test.ts
│   ├── components.test.tsx
│   ├── checkout-utils.test.ts
│   ├── unit-utils.test.ts
│   ├── CartItemRow.test.tsx
│   ├── SafeHtml.test.tsx
│   └── use-focus-trap.test.tsx
├── next.config.ts              — Security headers (CSP, X-Frame-Options, etc.)
└── package.json
```

Feature files own their page-level views plus the small primitives only they
use (e.g. `features/cart/QtyInput.tsx`). Cross-feature components go under
`components/`. Pure helpers live in `lib/`; domain-specific helpers in
`features/<name>/*-utils.ts`.

## Commands

```bash
pnpm -C examples/react i --ignore-workspace   # install (standalone, NOT workspace)
pnpm dev                                       # Next.js dev server → http://localhost:3000
pnpm build                                     # production build
pnpm start                                     # production server
pnpm test                                      # vitest run (91 tests)
```

Run commands from `examples/react/` or prefix with `-C examples/react`.

## Environment variables

```env
NEXT_PUBLIC_SPACEIS_API_URL=https://storefront-api.spaceis.app
NEXT_PUBLIC_SPACEIS_SHOP_UUID=your-shop-uuid-here
```

`NEXT_PUBLIC_SPACEIS_SHOP_UUID` ships as a placeholder — do not commit a real UUID.

## Testing

- Runner: `vitest` + `jsdom` + `@testing-library/react`
- Tests live in `__tests__/` (flat, mirroring source files by name)
- No vitest config file — vitest discovers tests via `package.json` defaults
- 91 tests across helpers, components, checkout-utils, unit-utils,
  CartItemRow, SafeHtml, and use-focus-trap

Add tests for any new utility or component; keep feature-specific utils in
`features/<name>/*-utils.test.ts` alongside the source.

## Domain conventions — React / Next.js specific

### Standalone install — `--ignore-workspace`

This example is **not** a pnpm workspace member. Always install with:

```bash
pnpm -C examples/react i --ignore-workspace
```

Do not add `"workspace:*"` dependencies or `pnpm-workspace.yaml` entries here.

### Cart and checkout pages — `ssr: false`

`cart/page.tsx` and `checkout/page.tsx` use `next/dynamic` with `ssr: false`
because they depend on `useCart()`, which reads the cart token from
`localStorage`. Server-rendering these pages produces a hydration mismatch
(server sees empty cart, client sees persisted cart):

```tsx
// app/cart/page.tsx
"use client";
import dynamic from "next/dynamic";

const CartPage = dynamic(() => import("../../features/cart/CartPage").then((m) => m.CartPage), { ssr: false });

export default function Page() {
  return <CartPage />;
}
```

Never remove `ssr: false` from these pages.

### SSR prefetch pattern

All SSR-capable pages follow the Server Component → `HydrationBoundary` →
Client Component pattern:

```tsx
// app/page.tsx (Server Component)
import { prefetchProducts, dehydrate, QueryClient, HydrationBoundary } from "@spaceis/react/server";
import { getServerClient } from "@/lib/server";
import { ProductsPage } from "@/features/products/ProductsPage";

export default async function Page() {
  const client = getServerClient();
  const qc = new QueryClient();
  await prefetchProducts(qc, client, { page: 1 });
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ProductsPage />
    </HydrationBoundary>
  );
}
```

`getServerClient()` in `src/lib/server.ts` creates a one-shot server-side
client from `NEXT_PUBLIC_SPACEIS_*` env vars. Do not call `createSpaceIS`
directly in page files — go through that factory.

### Provider placement

`SpaceISProvider` lives in `src/providers.tsx` (a `"use client"` module) and
is mounted once in `src/app/layout.tsx`. All hooks must be called inside this
provider. The config object is created **inside `providers.tsx`** — not inlined
at the call site — to avoid triggering the provider's config-identity warning.

### Cart drawer state

`features/cart/cart-drawer-context.tsx` holds drawer open/close state using
`@tanstack/react-store` (`Store` + `useStore`). This avoids Context re-renders
on every cart update. `ClientCartDrawer.tsx` wraps `CartDrawer.tsx` as
`next/dynamic` with `ssr: false` so it is never rendered on the server.

### SafeHtml — raw-HTML sanitisation

`components/SafeHtml.tsx` wraps `isomorphic-dompurify`:

```tsx
import DOMPurify from "isomorphic-dompurify";

export function SafeHtml({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}
```

Use `<SafeHtml html={...} />` for `product.description`, `page.content`,
`statute.content`, and `agreement.content`. Never pass raw API HTML to
`dangerouslySetInnerHTML` directly.

### Open-redirect guard

`features/checkout/checkout-utils.ts` exports `isSafeRedirect(url)`. Always
call it before assigning `result.redirect_url` to `window.location.href` after
`placeOrder.mutateAsync()`. Accepted schemes: `http:` and `https:` only.

### `product.unit` and qty display

`features/products/unit-utils.ts` exports `formatUnitLabel(step, unit)`.
Use it next to qty steppers on the product detail page. Cart items do not carry
`unit` — default to `"szt"` in that context.

### Commission display

`features/checkout/checkout-utils.ts` exports `commissionPercent(commission)`
and `calcPaymentFee(basePrice, commission)`. Never render `${commission}%` — a
`commission` of `1.2` means +20%, not +120%.

### Sonner for toasts

```tsx
import { toast } from "sonner";
toast.success("Added to cart!");
toast.error(getErrorMessage(err));
```

`<Toaster>` is mounted in `providers.tsx`. Do not add a second `<Toaster>`.

## Common mistakes to avoid

- **`useCart()` in a Server Component or without `SpaceISProvider`**: the hook
  throws. Pages that need cart must be client components inside the provider tree.

- **Forgetting `ssr: false` on cart/checkout pages**: causes hydration mismatch
  because the server cannot read `localStorage`.

- **Inline config object in `SpaceISProvider`**: triggers the dev-mode identity
  warning and causes stale-closure bugs. Declare config outside the render function.

- **Importing from `@spaceis/react/server` in a Client Component**: the server
  entry is not bundled for the client. Use `@spaceis/react` (client entry) for
  hooks, `@spaceis/react/server` only in Server Components / server utilities.

- **Rendering HTML fields with `dangerouslySetInnerHTML` without `SafeHtml`**:
  `product.description`, `page.content`, `statute.content` contain raw HTML —
  stored XSS vector if rendered unguarded.

- **Passing raw quantity `1` to `cart.add()`**: `CartManager` converts to
  thousandths automatically. Do not pre-multiply by 1000 at the call site.

- **Adding a new `features/` subdirectory without tests**: add a corresponding
  `__tests__/<feature>-utils.test.ts` (or `.test.tsx`) for any domain utility.

## Reference

- API docs: https://docs.spaceis.app/api
- Repository: https://github.com/spaceis-app/spaceis-sdk
- npm: https://www.npmjs.com/package/@spaceis/react
- Monorepo conventions: `AGENTS.md` (root)
- React bindings internals: `packages/react/AGENTS.md`
- SDK domain invariants: `packages/sdk/AGENTS.md`
- Vue example (for comparison): `examples/vue/AGENTS.md`
