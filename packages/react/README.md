# @spaceis/react

React hooks, Context Provider, and Next.js SSR helpers for the [SpaceIS SDK](../sdk).

Wraps `@spaceis/sdk` with a thin React layer — no logic is duplicated.

---

## Installation

```bash
npm install @spaceis/react @spaceis/sdk @tanstack/react-query react
# or
pnpm add @spaceis/react @spaceis/sdk @tanstack/react-query react
```

---

## Quick Start

### 1. Wrap your app with `SpaceISProvider`

```tsx
// app/layout.tsx (or _app.tsx for Pages Router)
import { SpaceISProvider } from "@spaceis/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <SpaceISProvider
          config={{
            baseUrl: process.env.NEXT_PUBLIC_API_URL!,
            shopUuid: process.env.NEXT_PUBLIC_SHOP_UUID!,
            lang: "pl",
          }}
          cartOptions={{ autoLoad: true }}
        >
          {children}
        </SpaceISProvider>
      </body>
    </html>
  );
}
```

> If you already have a `QueryClient` in your app, pass it via the `queryClient` prop to share it.

---

### 2. Use hooks in any Client Component

```tsx
"use client";

import { useProducts, useCart } from "@spaceis/react";

export function ProductList() {
  const { data, isLoading } = useProducts({ page: 1 });
  const { add, itemCount } = useCart();

  if (isLoading) return <p>Loading...</p>;

  return (
    <>
      <p>Cart: {itemCount} items</p>
      <ul>
        {data?.data.map((product) => (
          <li key={product.uuid}>
            {product.name}
            <button onClick={() => add(product.variants[0]!.uuid)}>Add to cart</button>
          </li>
        ))}
      </ul>
    </>
  );
}
```

---

### 3. Next.js App Router SSR (prefetching)

Prefetch data in Server Components and hydrate it on the client so hooks have
immediate data — no loading spinner on first render.

```tsx
// app/products/page.tsx  (Server Component)
import {
  createServerClient,
  prefetchProducts,
  prefetchCategories,
  dehydrate,
  QueryClient,
  HydrationBoundary,
} from "@spaceis/react/server";
import { ProductList } from "./ProductList";

export default async function ProductsPage() {
  const client = createServerClient({
    baseUrl: process.env.API_URL!,
    shopUuid: process.env.SHOP_UUID!,
    lang: "pl",
  });

  const qc = new QueryClient();

  await Promise.all([prefetchProducts(qc, client, { page: 1 }), prefetchCategories(qc, client)]);

  return (
    // HydrationBoundary transfers the server-fetched data to the client
    <HydrationBoundary state={dehydrate(qc)}>
      <ProductList />
    </HydrationBoundary>
  );
}
```

```tsx
// app/products/ProductList.tsx  (Client Component)
"use client";

import { useProducts } from "@spaceis/react";

export function ProductList() {
  // Data is already available from SSR — no spinner
  const { data } = useProducts({ page: 1 });

  return (
    <ul>
      {data?.data.map((p) => (
        <li key={p.uuid}>{p.name}</li>
      ))}
    </ul>
  );
}
```

---

## Hook Examples

### Cart

```tsx
"use client";

import { useCart, formatPrice } from "@spaceis/react";

export function CartSummary() {
  const {
    items,
    itemCount,
    finalPrice,
    hasDiscount,
    discount,
    isLoading,
    remove,
    applyDiscount,
    removeDiscount,
    formatPrice: fmt,
  } = useCart();

  return (
    <div>
      <p>
        {itemCount} items — {fmt()}
      </p>

      {hasDiscount && (
        <p>
          Discount: {discount?.code} (-{formatPrice(discount?.value ?? 0)})
          <button onClick={removeDiscount}>Remove</button>
        </p>
      )}

      <ul>
        {items.map((item) => (
          <li key={item.variant.uuid}>
            {item.product.name} x{item.quantity / 1000}
            <button disabled={isLoading} onClick={() => remove(item.variant.uuid)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Checkout

```tsx
"use client";

import { useCheckout } from "@spaceis/react";

export function CheckoutForm() {
  const { methods, agreements, placeOrder } = useCheckout();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    placeOrder.mutate({
      payment_method_id: 1,
      email: "player@example.com",
      username: "Steve",
      agreements: [],
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {methods.data?.map((m) => (
        <label key={m.id}>
          <input type="radio" name="payment" value={m.id} /> {m.name}
        </label>
      ))}

      {agreements.data?.map((a) => (
        <label key={a.id}>
          <input type="checkbox" required={a.required} /> {a.name}
        </label>
      ))}

      <button type="submit" disabled={placeOrder.isPending}>
        {placeOrder.isPending ? "Processing..." : "Place Order"}
      </button>
    </form>
  );
}
```

### Rankings

```tsx
"use client";

import { useTopCustomers, useLatestOrders } from "@spaceis/react";

export function Leaderboard() {
  const { data: top = [] } = useTopCustomers({ limit: 10 });
  const { data: latest = [] } = useLatestOrders({ limit: 5 });

  return (
    <div>
      <h2>Top Players</h2>
      <ol>
        {top.map((c) => (
          <li key={c.username}>{c.username}</li>
        ))}
      </ol>

      <h2>Recent Purchases</h2>
      <ul>
        {latest.map((o) => (
          <li key={o.uuid}>{o.username}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Recommendations

```tsx
"use client";

import { useProductRecommendations } from "@spaceis/react";

export function Recommendations({ slug }: { slug: string }) {
  const { data: recommendations = [], isLoading } = useProductRecommendations(slug);

  if (isLoading) return <p>Loading...</p>;

  return (
    <ul>
      {recommendations.map((pkg) => (
        <li key={pkg.uuid}>{pkg.name}</li>
      ))}
    </ul>
  );
}
```

---

## Available Hooks

| Hook                              | Returns                                               | Description                           |
| --------------------------------- | ----------------------------------------------------- | ------------------------------------- |
| `useCart()`                       | `UseCartReturn`                                       | Reactive cart state + all actions     |
| `useProducts(params?)`            | `UseQueryResult<PaginatedResponse<IndexShopProduct>>` | Paginated product list                |
| `useProduct(slug)`                | `UseQueryResult<ShowShopProduct>`                     | Single product by slug or UUID        |
| `useProductRecommendations(slug)` | `UseQueryResult<PackageRecommendation[]>`             | Package recommendations for a product |
| `useCategories(params?)`          | `UseQueryResult<ShopCategory[]>`                      | Shop categories                       |
| `usePackages(params?)`            | `UseQueryResult<PaginatedResponse<IndexPackage>>`     | Paginated packages list               |
| `useSales(params?)`               | `UseQueryResult<PaginatedResponse<Sale>>`             | Active sales / promotions             |
| `useGoals(params?)`               | `UseQueryResult<PaginatedResponse<Goal>>`             | Community goals                       |
| `useTopCustomers(params?)`        | `UseQueryResult<TopCustomer[]>`                       | Top customers ranking                 |
| `useLatestOrders(params?)`        | `UseQueryResult<LatestOrder[]>`                       | Latest purchases                      |
| `useShopConfig()`                 | `UseQueryResult<TemplateConfiguration>`               | Shop template configuration           |
| `usePaymentMethods()`             | `UseQueryResult<PaymentMethod[]>`                     | Available payment methods             |
| `useAgreements()`                 | `UseQueryResult<Agreement[]>`                         | Checkout agreements                   |
| `usePlaceOrder()`                 | `UseMutationResult<CheckoutResponse, ...>`            | Place order mutation                  |
| `useCheckout()`                   | `{ methods, agreements, placeOrder }`                 | Combined checkout hook                |
| `useRecaptcha()`                  | `{ execute(action) }`                                 | Lazy-loaded reCAPTCHA                 |
| `usePages(params?)`               | `UseQueryResult<ShopPage[]>`                          | CMS page list                         |
| `usePage(slug)`                   | `UseQueryResult<ShopPage>`                            | Single CMS page by slug               |
| `useStatute()`                    | `UseQueryResult<Statute>`                             | Shop legal statute                    |

## Server Helpers (`@spaceis/react/server`)

| Export                                             | Description                                           |
| -------------------------------------------------- | ----------------------------------------------------- |
| `createServerClient(options)`                      | Create server-side SpaceIS client (no cart, no React) |
| `prefetchProducts(qc, client, params?)`            | Prefetch product list                                 |
| `prefetchProduct(qc, client, slug)`                | Prefetch single product                               |
| `prefetchProductRecommendations(qc, client, slug)` | Prefetch recommendations                              |
| `prefetchCategories(qc, client, params?)`          | Prefetch categories                                   |
| `prefetchPackages(qc, client, params?)`            | Prefetch packages                                     |
| `prefetchSales(qc, client, params?)`               | Prefetch sales                                        |
| `prefetchGoals(qc, client, params?)`               | Prefetch goals                                        |
| `prefetchShopConfig(qc, client)`                   | Prefetch shop config                                  |
| `prefetchPages(qc, client, params?)`               | Prefetch CMS pages                                    |
| `prefetchPage(qc, client, slug)`                   | Prefetch single CMS page                              |
| `prefetchStatute(qc, client)`                      | Prefetch statute                                      |
| `dehydrate`                                        | Re-exported from `@tanstack/react-query`              |
| `QueryClient`                                      | Re-exported from `@tanstack/react-query`              |
| `HydrationBoundary`                                | Re-exported from `@tanstack/react-query`              |

---

## Query Key Structure

All hooks use query keys starting with `['spaceis', ...]`.
To invalidate all SpaceIS queries at once:

```ts
queryClient.invalidateQueries({ queryKey: ["spaceis"] });
```

---

## License

MIT
