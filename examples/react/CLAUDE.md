# CLAUDE.md — SpaceIS React / Next.js Example

## Overview

Complete Next.js App Router storefront using `@spaceis/react` hooks and `@spaceis/sdk`. Demonstrates SSR prefetching, client-only cart management, reCAPTCHA integration, and all shop features (products, packages, sales, checkout, vouchers, daily rewards, CMS pages).

## Structure

```
examples/react/
├── src/
│   ├── app/                    — Next.js App Router pages
│   │   ├── page.tsx            — Products listing (SSR prefetch)
│   │   ├── product/[slug]/     — Product detail (SSR prefetch + SEO)
│   │   ├── packages/           — Package bundles listing
│   │   ├── sales/              — Active sales
│   │   ├── cart/               — Cart page (client-only via dynamic import)
│   │   ├── checkout/           — Checkout (client-only via dynamic import)
│   │   ├── voucher/            — Voucher code redemption
│   │   ├── daily-reward/       — Daily reward claim
│   │   ├── order/[code]/       — Order summary lookup
│   │   ├── page/               — CMS pages list + detail
│   │   ├── statute/            — Shop terms/statute
│   │   ├── layout.tsx          — Root layout with providers
│   │   └── not-found.tsx       — 404 page
│   ├── views/                  — Page view components (business logic)
│   │   ├── ProductsPage.tsx    — Products grid with categories + pagination
│   │   ├── ProductPage.tsx     — Product detail with variants + qty selector
│   │   ├── CartPage.tsx        — Full cart with qty editing + discount
│   │   ├── CheckoutPage.tsx    — Checkout form + payment methods + agreements
│   │   └── ...                 — One view per page
│   ├── components/             — Reusable UI components
│   │   ├── CartDrawer.tsx      — Slide-in cart drawer
│   │   ├── ClientCartDrawer.tsx— Dynamic import wrapper (ssr: false)
│   │   ├── Header.tsx          — Navigation + mobile menu + cart badge
│   │   ├── QtyInput.tsx        — Quantity input with product limits
│   │   ├── Recommendations.tsx — Product recommendations section
│   │   ├── CommunitySection.tsx— Top customers, latest orders, goals
│   │   └── ...
│   ├── providers.tsx           — SpaceISProvider + Sonner toast wrapper
│   ├── helpers.tsx             — fp(), getErrorMessage(), esc()
│   ├── lib/spaceis.ts          — Server-side SDK client factory
│   └── styles.css              — All styles (shared across examples)
├── __tests__/                  — Component + helper tests
├── package.json
├── next.config.ts
└── .env.local.example
```

## Architecture

### Providers

`providers.tsx` wraps the app with `SpaceISProvider` (from `@spaceis/react`) which sets up TanStack QueryClient + SpaceIS context. Cart auto-loads from localStorage.

### SSR Pattern

Server Components prefetch data → dehydrate → HydrationBoundary wraps Client Component:

```tsx
// app/product/[slug]/page.tsx (Server Component)
const queryClient = new QueryClient();
await prefetchProduct(queryClient, client, slug);
return <HydrationBoundary state={dehydrate(queryClient)}><ProductPage slug={slug} /></HydrationBoundary>;
```

### Client-Only Pages

Cart and checkout use `next/dynamic` with `{ ssr: false }` because they depend on `useCart()` which needs localStorage.

### Key Patterns

- **`useCart()`** — reactive cart via `useSyncExternalStore`
- **Data hooks** — `useProducts`, `useProduct`, `useCategories`, etc. (TanStack Query)
- **`useCheckout()`** — payment methods + agreements + `placeOrder` mutation
- **`useRecaptcha()`** — lazy-loaded reCAPTCHA for voucher/daily-reward
- **Sonner** — toast notifications (`toast.success()`, `toast.error()`)
- **SSR prefetch helpers** — `prefetchProducts`, `prefetchProduct`, etc. from `@spaceis/react/server`

## Commands

```bash
pnpm install    # Install dependencies
pnpm dev        # Start dev server (http://localhost:3000)
pnpm build      # Build for production
pnpm start      # Start production server
pnpm test       # Run tests
```

## Environment Variables

```env
NEXT_PUBLIC_SPACEIS_API_URL=https://storefront-api.spaceis.app
NEXT_PUBLIC_SPACEIS_SHOP_UUID=your-shop-uuid-here
```
