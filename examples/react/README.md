# SpaceIS SDK — React / Next.js Integration Guide

Getting started with `@spaceis/react` — copy this example as a template
or follow the steps below to integrate SpaceIS into an existing Next.js App Router project.

> This file is both a human tutorial and reference for AI coding agents
> (Claude Code, Cursor, Codex, Copilot). Agents working in this folder
> should also consult [AGENTS.md in @spaceis/react](../../packages/react/AGENTS.md)
> which documents runtime gotchas and module internals.

---

## Quick Setup (3 steps)

### Step 1: Install dependencies

```bash
pnpm add @spaceis/sdk @spaceis/react @tanstack/react-store sonner
```

### Step 2: Set environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SPACEIS_API_URL=https://storefront-api.spaceis.app
NEXT_PUBLIC_SPACEIS_SHOP_UUID=YOUR_SHOP_UUID
```

### Step 3: Run the dev server

```bash
pnpm dev
```

Open `http://localhost:3000`.

---

## Project Structure

```
examples/react/
├── src/
│   ├── app/
│   │   ├── layout.tsx              — Root layout (Providers + Header + Footer + CartDrawer)
│   │   ├── page.tsx                — Home: products + categories (SSR prefetched)
│   │   ├── packages/page.tsx       — Package bundles (SSR prefetched)
│   │   ├── sales/page.tsx          — Active promotions (SSR prefetched)
│   │   ├── cart/page.tsx           — Full cart page (client-only, dynamic import)
│   │   ├── checkout/page.tsx       — Checkout form (client-only, dynamic import)
│   │   ├── voucher/page.tsx        — Voucher redemption
│   │   ├── daily-reward/page.tsx   — Daily reward claim
│   │   ├── order/[code]/page.tsx   — Order summary after payment
│   │   ├── product/[slug]/page.tsx  — Product detail (SSR + dynamic metadata)
│   │   ├── page/page.tsx           — CMS pages list
│   │   ├── page/[slug]/page.tsx    — Single CMS page
│   │   ├── statute/page.tsx        — Shop terms/statute
│   │   ├── sitemap.ts              — Dynamic sitemap (products + CMS pages)
│   │   ├── robots.ts               — robots.txt
│   │   └── not-found.tsx           — Custom 404 page
│   ├── views/                      — Page-level client components
│   │   ├── ProductsPage.tsx
│   │   ├── ProductPage.tsx
│   │   ├── PackagesPage.tsx
│   │   ├── SalesPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── VoucherPage.tsx
│   │   ├── DailyRewardPage.tsx
│   │   ├── OrderSummaryPage.tsx
│   │   ├── ContentPage.tsx
│   │   └── StatutePage.tsx
│   ├── components/                 — Shared UI components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── ClientCartDrawer.tsx
│   │   ├── ProductCard.tsx
│   │   ├── Pagination.tsx
│   │   ├── CommunitySection.tsx
│   │   └── Recommendations.tsx
│   ├── lib/
│   │   └── server.ts              — Server-side SpaceIS client factory
│   ├── providers.tsx              — SpaceISProvider + Toaster wrapper
│   ├── cart-drawer-context.tsx    — TanStack Store for cart drawer open/close
│   ├── helpers.tsx                — fp(), esc(), getErrorMessage(), PlaceholderSVG
│   └── styles.css
├── package.json
├── next.config.ts
├── tsconfig.json
└── README.md                      — This file
```

---

## How SpaceISProvider Works

`SpaceISProvider` wraps your app with a TanStack Query `QueryClientProvider` and a SpaceIS context. It creates the SDK client and CartManager internally.

```tsx
// src/providers.tsx
"use client";

import { SpaceISProvider } from "@spaceis/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SpaceISProvider
      config={{
        baseUrl: process.env.NEXT_PUBLIC_SPACEIS_API_URL || "https://storefront-api.spaceis.app",
        shopUuid: process.env.NEXT_PUBLIC_SPACEIS_SHOP_UUID || "",
        lang: "pl",
      }}
      cartOptions={{ autoLoad: true }}
    >
      {children}
      <Toaster position="bottom-right" richColors />
    </SpaceISProvider>
  );
}
```

Place it in your root layout:

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

All hooks (`useProducts`, `useCart`, `useCheckout`, etc.) must be called inside `SpaceISProvider`.

---

## How SSR Prefetching Works

The pattern uses Next.js Server Components to fetch data on the server, then hydrates the TanStack Query cache on the client so hooks receive data instantly with no loading flash.

### Step-by-step pattern

1. **Server Component** (the `page.tsx` in `app/`) creates a server-side client and a fresh `QueryClient`
2. **Prefetch helpers** populate the QueryClient cache on the server
3. **`dehydrate(qc)`** serializes the cache into a JSON-safe state
4. **`HydrationBoundary`** passes that state to the client, where TanStack Query picks it up
5. **Client Component** (in `views/`) calls the same hooks — data is already there

```tsx
// src/app/page.tsx (Server Component)
import {
  prefetchProducts,
  prefetchCategories,
  dehydrate,
  QueryClient,
  HydrationBoundary,
} from "@spaceis/react/server";
import { getServerClient } from "../lib/server";
import { ProductsPage } from "../views/ProductsPage";

export default async function Page() {
  const client = getServerClient();
  const qc = new QueryClient();

  await Promise.all([
    prefetchProducts(qc, client, { page: 1 }),
    prefetchCategories(qc, client),
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ProductsPage />
    </HydrationBoundary>
  );
}
```

The server client is created in `src/lib/server.ts`:

```tsx
import { createServerClient } from "@spaceis/react/server";

export function getServerClient() {
  return createServerClient({
    baseUrl: process.env.NEXT_PUBLIC_SPACEIS_API_URL || "https://storefront-api.spaceis.app",
    shopUuid: process.env.NEXT_PUBLIC_SPACEIS_SHOP_UUID || "",
    lang: "pl",
  });
}
```

---

## Hook Usage Examples

### useProducts — Paginated product listing

```tsx
"use client";
import { useProducts } from "@spaceis/react";

function ProductList() {
  const { data, isLoading } = useProducts({ page: 1, category_uuid: "..." });

  if (isLoading) return <div>Loading...</div>;
  return data?.data.map((p) => <div key={p.uuid}>{p.name}</div>);
}
```

### useCart — Reactive cart with actions

```tsx
"use client";
import { useCart, formatPrice, getItemQty } from "@spaceis/react";

function CartSummary() {
  const {
    items,
    totalQuantity,
    finalPrice,
    isEmpty,
    isLoading,
    add,
    remove,
    increment,
    decrement,
    applyDiscount,
    removeDiscount,
  } = useCart();

  if (isLoading) return <div>Loading cart...</div>;
  if (isEmpty) return <div>Cart is empty</div>;

  return (
    <div>
      <p>{totalQuantity} items — {formatPrice(finalPrice)}</p>
      {items.map((item) => (
        <div key={item.variant?.uuid}>
          {item.shop_product?.name} x{getItemQty(item)}
          <button onClick={() => increment(item.variant!.uuid)}>+</button>
          <button onClick={() => decrement(item.variant!.uuid)}>-</button>
          <button onClick={() => remove(item.variant!.uuid)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

### useCheckout — Payment methods, agreements, place order

```tsx
"use client";
import { useCheckout, useRecaptcha } from "@spaceis/react";

function CheckoutForm() {
  const { methods, agreements, placeOrder } = useCheckout();
  const { execute: executeRecaptcha } = useRecaptcha();

  const handleSubmit = async () => {
    const token = await executeRecaptcha("checkout");
    const result = await placeOrder.mutateAsync({
      email: "user@email.com",
      first_name: "PlayerNick",
      payment_method_uuid: "method-uuid",
      "g-recaptcha-response": token,
      agreements: ["agreement-uuid"],
    });
    if (result.redirect_url) {
      window.location.href = result.redirect_url;
    }
  };

  return (
    <div>
      {methods.data?.map((m) => <label key={m.uuid}>{m.name}</label>)}
      {agreements.data?.map((a) => <label key={a.uuid}>{a.name}</label>)}
      <button onClick={handleSubmit} disabled={placeOrder.isPending}>
        Place order
      </button>
    </div>
  );
}
```

### useRecaptcha — reCAPTCHA v3

```tsx
import { useRecaptcha } from "@spaceis/react";

const { execute: executeRecaptcha } = useRecaptcha();
const token = await executeRecaptcha("voucher");
// Pass token as "g-recaptcha-response" to voucher/daily-reward/checkout requests
```

---

## Available Hooks Reference

| Hook | Returns | Purpose |
|---|---|---|
| `useSpaceIS()` | `{ client, cart }` | Raw SDK client and CartManager access |
| `useCart()` | Items, totals, loading, `add`/`remove`/`increment`/`decrement`/`applyDiscount`/`removeDiscount` | Reactive cart via `useSyncExternalStore` |
| `useProducts(params?)` | `{ data, isLoading }` | Paginated product list |
| `useProduct(slug)` | `{ data, isLoading }` | Single product details |
| `useProductRecommendations(slug)` | `{ data }` | Recommended products for a given product |
| `useCategories(params?)` | `{ data }` | Category tree |
| `usePackages(params?)` | `{ data, isLoading }` | Paginated package list |
| `useSales(params?)` | `{ data, isLoading }` | Active sales/promotions |
| `useGoals(params?)` | `{ data }` | Community goals |
| `useTopCustomers(params?)` | `{ data }` | Top customers ranking |
| `useLatestOrders(params?)` | `{ data }` | Latest orders ranking |
| `useShopConfig()` | `{ data }` | Shop configuration (name, logo, footer, etc.) |
| `useCheckout()` | `{ methods, agreements, placeOrder }` | Payment methods, agreements, and order mutation |
| `usePaymentMethods()` | `{ data }` | Payment methods only |
| `useAgreements()` | `{ data }` | Checkout agreements only |
| `usePlaceOrder()` | TanStack mutation | Place order mutation only |
| `useRecaptcha()` | `{ execute }` | Lazy-loaded reCAPTCHA v3 token generator |
| `usePages(params?)` | `{ data }` | CMS pages list |
| `usePage(slug)` | `{ data }` | Single CMS page by slug |
| `useStatute()` | `{ data }` | Shop statute/terms |

All data hooks return standard TanStack Query results (`data`, `isLoading`, `isError`, `error`, etc.).

---

## SSR Prefetch Helpers Reference

Import from `@spaceis/react/server`. Each function takes `(queryClient, serverClient, params?)` and populates the cache to match the corresponding client-side hook.

| Helper | Matches Hook | Params |
|---|---|---|
| `prefetchProducts(qc, client, params?)` | `useProducts` | `{ page, category_uuid, sale_slug, ... }` |
| `prefetchProduct(qc, client, slug)` | `useProduct` | Product slug |
| `prefetchProductRecommendations(qc, client, slug)` | `useProductRecommendations` | Product slug |
| `prefetchCategories(qc, client, params?)` | `useCategories` | Optional filter params |
| `prefetchPackages(qc, client, params?)` | `usePackages` | `{ page, ... }` |
| `prefetchSales(qc, client, params?)` | `useSales` | `{ sort, ... }` |
| `prefetchGoals(qc, client, params?)` | `useGoals` | `{ per_page, ... }` |
| `prefetchShopConfig(qc, client)` | `useShopConfig` | None |
| `prefetchPages(qc, client, params?)` | `usePages` | Optional filter params |
| `prefetchPage(qc, client, slug)` | `usePage` | Page slug |
| `prefetchStatute(qc, client)` | `useStatute` | None |

Also re-exported for convenience: `dehydrate`, `QueryClient`, `HydrationBoundary`.

---

## How to Add a New Page (Step by Step)

Example: adding a `/rankings` page with SSR prefetching.

### 1. Create the view component

```tsx
// src/views/RankingsPage.tsx
"use client";

import { useTopCustomers, useLatestOrders, formatPrice } from "@spaceis/react";

export function RankingsPage() {
  const { data: top } = useTopCustomers({ limit: 20, sort: "-total_spent" });
  const { data: latest } = useLatestOrders({ limit: 20, sort: "-completed_at" });

  return (
    <div className="container">
      <h1>Top Customers</h1>
      {top?.map((c, i) => (
        <div key={i}>#{i + 1} {c.first_name} — {formatPrice(c.total_spent)}</div>
      ))}
      <h1>Latest Orders</h1>
      {latest?.map((o, i) => (
        <div key={i}>{o.first_name}</div>
      ))}
    </div>
  );
}
```

### 2. Create the route with SSR prefetching

```tsx
// src/app/rankings/page.tsx
import {
  dehydrate,
  QueryClient,
  HydrationBoundary,
} from "@spaceis/react/server";
import { getServerClient } from "@/lib/server";
import { RankingsPage } from "@/views/RankingsPage";

export default async function Page() {
  const client = getServerClient();
  const qc = new QueryClient();

  // No built-in prefetchTopCustomers — use qc.prefetchQuery directly:
  await Promise.all([
    qc.prefetchQuery({
      queryKey: ["spaceis", "top-customers", { limit: 20, sort: "-total_spent" }],
      queryFn: () => client.rankings.top({ limit: 20, sort: "-total_spent" }),
    }),
    qc.prefetchQuery({
      queryKey: ["spaceis", "latest-orders", { limit: 20, sort: "-completed_at" }],
      queryFn: () => client.rankings.latest({ limit: 20, sort: "-completed_at" }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <RankingsPage />
    </HydrationBoundary>
  );
}
```

### 3. Add navigation link

Add a link to `Header.tsx` pointing to `/rankings`.

**If the page depends on cart state** (like cart or checkout), use a dynamic import with `ssr: false` instead of the SSR pattern:

```tsx
// src/app/my-cart-page/page.tsx
"use client";

import dynamic from "next/dynamic";

const MyCartPage = dynamic(
  () => import("../../views/MyCartPage").then((m) => m.MyCartPage),
  { ssr: false }
);

export default function Page() {
  return <MyCartPage />;
}
```

---

## Key Patterns

### TanStack Store for UI state

Global UI state (like the cart drawer open/close toggle) uses `@tanstack/react-store` instead of React Context to avoid unnecessary re-renders:

```tsx
import { Store, useStore } from "@tanstack/react-store";

const cartDrawerStore = new Store({ isOpen: false });

export function useCartDrawer() {
  const isOpen = useStore(cartDrawerStore, (s) => s.isOpen);
  return {
    isOpen,
    toggle: () => cartDrawerStore.setState((s) => ({ ...s, isOpen: !s.isOpen })),
    open: () => cartDrawerStore.setState((s) => ({ ...s, isOpen: true })),
    close: () => cartDrawerStore.setState((s) => ({ ...s, isOpen: false })),
  };
}
```

### Sonner for toasts

All user-facing success/error feedback uses Sonner's `toast`:

```tsx
import { toast } from "sonner";

try {
  await cart.add(variantUuid, 1);
  toast.success("Added to cart!");
} catch (err) {
  toast.error(getErrorMessage(err));
}
```

The `<Toaster>` component is mounted in `providers.tsx` inside `SpaceISProvider`.

### Dynamic imports for cart-dependent pages

Cart and checkout pages use `next/dynamic` with `ssr: false` because they depend on `localStorage`-based cart state that does not exist on the server:

```tsx
const CartPage = dynamic(
  () => import("../../views/CartPage").then((m) => m.CartPage),
  { ssr: false }
);
```

This prevents hydration mismatches and avoids server-rendering empty cart states.

### Error handling with SpaceISError

```tsx
import { SpaceISError } from "@spaceis/react";

function getErrorMessage(err: unknown): string {
  if (err instanceof SpaceISError) {
    if (err.isValidation) {
      const all = err.allFieldErrors();
      if (all.length > 0) return all[0];
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "An error occurred";
}
```

### Prices and quantities

Same rules as the vanilla SDK:

- **Prices** are in cents (grosze). Use `formatPrice(1299)` to display `"12,99 zl"`.
- **Quantities** from the API are in thousandths. Use `getItemQty(item)` for display. `useCart()` actions (`add`, `increment`, etc.) handle conversion automatically.

---

## Customization Checklist

To adapt this example to your shop:

1. **`.env.local`**: Set `NEXT_PUBLIC_SPACEIS_SHOP_UUID` to your shop UUID
2. **`src/providers.tsx`**: Adjust `lang` if needed (default: `"pl"`)
3. **`src/app/layout.tsx`**: Update `<title>` and metadata
4. **`src/components/Header.tsx`**: Change shop name and navigation links
5. **`src/styles.css`**: Adjust CSS variables for your brand colors/fonts
