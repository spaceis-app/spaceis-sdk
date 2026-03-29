# @spaceis/vue

[![npm](https://img.shields.io/npm/v/@spaceis/vue)](https://www.npmjs.com/package/@spaceis/vue)
[![license](https://img.shields.io/npm/l/@spaceis/vue)](./LICENSE)

Vue 3 composables, Plugin, and Nuxt SSR helpers for the [SpaceIS SDK](https://www.npmjs.com/package/@spaceis/sdk).

Wraps `@spaceis/sdk` with a thin Vue layer — no logic is duplicated.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Composable Examples](#composable-examples)
- [Available Composables](#available-composables)
- [Server Helpers](#server-helpers-spaceisviewserver)
- [Utilities Re-exported from SDK](#utilities-re-exported-from-sdk)
- [Query Key Structure](#query-key-structure)
- [Reactive Parameters](#reactive-parameters)
- [Related Packages](#related-packages)
- [License](#license)

---

## Installation

```bash
npm install @spaceis/vue @spaceis/sdk @tanstack/vue-query vue
# or
pnpm add @spaceis/vue @spaceis/sdk @tanstack/vue-query vue
```

---

## Quick Start

### 1. Install the plugin

```ts
// main.ts
import { createApp } from "vue";
import { SpaceISPlugin } from "@spaceis/vue";
import App from "./App.vue";

const app = createApp(App);

app.use(SpaceISPlugin, {
  config: {
    baseUrl: import.meta.env.VITE_API_URL,
    shopUuid: import.meta.env.VITE_SHOP_UUID,
    lang: "pl",
  },
  cartOptions: { autoLoad: true },
});

app.mount("#app");
```

> If you already have a TanStack Vue Query `QueryClient` in your app, pass it via the `queryClient` option to share it.

---

### 2. Use composables in any component

```vue
<script setup>
import { useProducts, useCart } from "@spaceis/vue";

const { data, isLoading } = useProducts({ page: 1 });
const { add, itemCount } = useCart();
</script>

<template>
  <p>Cart: {{ itemCount }} items</p>
  <p v-if="isLoading">Loading...</p>
  <ul v-else>
    <li v-for="product in data?.data" :key="product.uuid">
      {{ product.name }}
      <button @click="add(product.variants[0]!.uuid)">Add to cart</button>
    </li>
  </ul>
</template>
```

---

### 3. Nuxt SSR (prefetching)

Prefetch data on the server so composables have immediate data on the client.

```ts
// plugins/spaceis.ts (Nuxt plugin)
import { SpaceISPlugin } from "@spaceis/vue";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(SpaceISPlugin, {
    config: {
      baseUrl: useRuntimeConfig().public.apiUrl,
      shopUuid: useRuntimeConfig().public.shopUuid,
      lang: "pl",
    },
    cartOptions: { autoLoad: true },
  });
});
```

```vue
<!-- pages/products.vue -->
<script setup>
import { createServerClient, prefetchProducts, prefetchCategories, QueryClient, dehydrate } from "@spaceis/vue/server";
import { useProducts } from "@spaceis/vue";

// Server-side prefetch
const { data: prefetched } = await useAsyncData("products", async () => {
  const client = createServerClient({
    baseUrl: useRuntimeConfig().public.apiUrl,
    shopUuid: useRuntimeConfig().public.shopUuid,
    lang: "pl",
  });
  const qc = new QueryClient();
  await Promise.all([
    prefetchProducts(qc, client, { page: 1 }),
    prefetchCategories(qc, client),
  ]);
  return dehydrate(qc);
});

// Client-side — data is already available from SSR
const { data } = useProducts({ page: 1 });
</script>

<template>
  <ul>
    <li v-for="p in data?.data" :key="p.uuid">{{ p.name }}</li>
  </ul>
</template>
```

---

## Composable Examples

### Cart

```vue
<script setup>
import { useCart, formatPrice } from "@spaceis/vue";

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
</script>

<template>
  <div>
    <p>{{ itemCount }} items — {{ fmt() }}</p>

    <p v-if="hasDiscount">
      Discount: {{ discount?.code }} (-{{ formatPrice(discount?.value ?? 0) }})
      <button @click="removeDiscount">Remove</button>
    </p>

    <ul>
      <li v-for="item in items" :key="item.variant.uuid">
        {{ item.product.name }} x{{ item.quantity / 1000 }}
        <button :disabled="isLoading" @click="remove(item.variant.uuid)">Remove</button>
      </li>
    </ul>
  </div>
</template>
```

### Checkout

```vue
<script setup>
import { useCheckout } from "@spaceis/vue";

const { methods, agreements, placeOrder } = useCheckout();

function handleSubmit() {
  placeOrder.mutate({
    payment_method_id: 1,
    email: "player@example.com",
    username: "Steve",
    agreements: [],
  });
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <label v-for="m in methods.data" :key="m.id">
      <input type="radio" name="payment" :value="m.id" /> {{ m.name }}
    </label>

    <label v-for="a in agreements.data" :key="a.id">
      <input type="checkbox" :required="a.required" /> {{ a.name }}
    </label>

    <button type="submit" :disabled="placeOrder.isPending">
      {{ placeOrder.isPending ? "Processing..." : "Place Order" }}
    </button>
  </form>
</template>
```

### Rankings

```vue
<script setup>
import { useTopCustomers, useLatestOrders } from "@spaceis/vue";

const { data: top } = useTopCustomers({ limit: 10 });
const { data: latest } = useLatestOrders({ limit: 5 });
</script>

<template>
  <div>
    <h2>Top Players</h2>
    <ol>
      <li v-for="c in top" :key="c.username">{{ c.username }}</li>
    </ol>

    <h2>Recent Purchases</h2>
    <ul>
      <li v-for="o in latest" :key="o.uuid">{{ o.username }}</li>
    </ul>
  </div>
</template>
```

### Recommendations

```vue
<script setup>
import { useProductRecommendations } from "@spaceis/vue";

const props = defineProps<{ slug: string }>();
const { data: recommendations, isLoading } = useProductRecommendations(() => props.slug);
</script>

<template>
  <p v-if="isLoading">Loading...</p>
  <ul v-else>
    <li v-for="pkg in recommendations" :key="pkg.uuid">{{ pkg.name }}</li>
  </ul>
</template>
```

---

## Available Composables

| Composable                            | Returns                                               | Description                           |
| ------------------------------------- | ----------------------------------------------------- | ------------------------------------- |
| `useSpaceIS()`                        | `SpaceISContext`                                      | Access client + cartManager           |
| `useCart()`                           | `UseCartReturn`                                       | Reactive cart state + all actions     |
| `useProducts(params?)`                | `UseQueryReturnType<PaginatedResponse<IndexShopProduct>>` | Paginated product list            |
| `useProduct(slug)`                    | `UseQueryReturnType<ShowShopProduct>`                 | Single product by slug or UUID        |
| `useProductRecommendations(slug)`     | `UseQueryReturnType<PackageRecommendation[]>`         | Package recommendations for a product |
| `useCategories(params?)`              | `UseQueryReturnType<ShopCategory[]>`                  | Shop categories                       |
| `usePackages(params?)`                | `UseQueryReturnType<PaginatedResponse<IndexPackage>>` | Paginated packages list               |
| `useSales(params?)`                   | `UseQueryReturnType<PaginatedResponse<Sale>>`         | Active sales / promotions             |
| `useGoals(params?)`                   | `UseQueryReturnType<PaginatedResponse<Goal>>`         | Community goals                       |
| `useTopCustomers(params?)`            | `UseQueryReturnType<TopCustomer[]>`                   | Top customers ranking                 |
| `useLatestOrders(params?)`            | `UseQueryReturnType<LatestOrder[]>`                   | Latest purchases                      |
| `useShopConfig()`                     | `UseQueryReturnType<TemplateConfiguration>`           | Shop template configuration           |
| `usePaymentMethods()`                 | `UseQueryReturnType<PaymentMethod[]>`                 | Available payment methods             |
| `useAgreements()`                     | `UseQueryReturnType<Agreement[]>`                     | Checkout agreements                   |
| `usePlaceOrder()`                     | `UseMutationReturnType<CheckoutResponse, ...>`        | Place order mutation                  |
| `useCheckout()`                       | `{ methods, agreements, placeOrder }`                 | Combined checkout composable          |
| `useRecaptcha()`                      | `{ execute(action) }`                                 | Lazy-loaded reCAPTCHA                 |
| `usePages(params?)`                   | `UseQueryReturnType<ShopPage[]>`                      | CMS page list                         |
| `usePage(slug)`                       | `UseQueryReturnType<ShopPage>`                        | Single CMS page by slug               |
| `useStatute()`                        | `UseQueryReturnType<Statute>`                         | Shop legal statute                    |

## Server Helpers (`@spaceis/vue/server`)

| Export                                             | Description                                        |
| -------------------------------------------------- | -------------------------------------------------- |
| `createServerClient(options)`                      | Create server-side SpaceIS client (no cart, no Vue)|
| `prefetchProducts(qc, client, params?)`            | Prefetch product list                              |
| `prefetchProduct(qc, client, slug)`                | Prefetch single product                            |
| `prefetchProductRecommendations(qc, client, slug)` | Prefetch recommendations                           |
| `prefetchCategories(qc, client, params?)`          | Prefetch categories                                |
| `prefetchPackages(qc, client, params?)`            | Prefetch packages                                  |
| `prefetchSales(qc, client, params?)`               | Prefetch sales                                     |
| `prefetchGoals(qc, client, params?)`               | Prefetch goals                                     |
| `prefetchShopConfig(qc, client)`                   | Prefetch shop config                               |
| `prefetchPages(qc, client, params?)`               | Prefetch CMS pages                                 |
| `prefetchPage(qc, client, slug)`                   | Prefetch single CMS page                           |
| `prefetchStatute(qc, client)`                      | Prefetch statute                                   |
| `prefetchTopCustomers(qc, client, params?)`        | Prefetch top customers ranking                     |
| `prefetchLatestOrders(qc, client, params?)`        | Prefetch latest orders ranking                     |
| `prefetchPaymentMethods(qc, client)`               | Prefetch available payment methods                 |
| `prefetchAgreements(qc, client)`                   | Prefetch checkout agreements                       |
| `dehydrate`                                        | Re-exported from `@tanstack/vue-query`             |
| `QueryClient`                                      | Re-exported from `@tanstack/vue-query`             |

---

## Nuxt SSR with `useAsyncData`

For simpler server-side data fetching in Nuxt 4, you can use `useAsyncData` with a server client utility:

```ts
// server/utils/spaceis.ts
import { createServerClient } from "@spaceis/vue/server";

export function useServerSpaceIS() {
  return createServerClient({
    baseUrl: process.env.NUXT_PUBLIC_API_URL!,
    shopUuid: process.env.NUXT_PUBLIC_SHOP_UUID!,
    lang: "pl",
  });
}
```

```vue
<script setup>
const { data: products } = await useAsyncData('products', () => {
  const client = useServerSpaceIS();
  return client.products.list({ page: 1 });
});
</script>
```

---

## Utilities Re-exported from SDK

The package re-exports commonly used utilities from `@spaceis/sdk` so you only need a single import:

- `formatPrice(cents)` -- format price in cents to a display string
- `snapQuantity(value, step, min, max)` -- snap a quantity value to the nearest valid step within min/max bounds
- `fromApiQty(qty)` / `toApiQty(qty)` -- convert between API thousandths and display quantities
- `getItemQty(item)` / `getProductLimits(product)` -- cart item helpers
- `getCartItemImage(item)` -- resolve image URL for a cart item
- `centsToAmount(cents)` -- convert cents to decimal amount
- `escapeHtml(str)` -- escape HTML entities
- `SpaceISError` -- typed API error class

```ts
import { formatPrice, snapQuantity, fromApiQty } from "@spaceis/vue";
```

---

## Query Key Structure

All composables use query keys starting with `['spaceis', ...]`.
To invalidate all SpaceIS queries at once:

```ts
queryClient.invalidateQueries({ queryKey: ["spaceis"] });
```

---

## Reactive Parameters

All data composables accept `MaybeRef` parameters, so you can pass reactive values:

```vue
<script setup>
import { ref } from "vue";
import { useProducts } from "@spaceis/vue";

const page = ref(1);
// Query automatically re-fetches when page changes
const { data } = useProducts(() => ({ page: page.value }));
</script>
```

---

## Related Packages

| Package | Description |
|---|---|
| [`@spaceis/sdk`](../sdk) | Core SDK (zero dependencies) |
| [`@spaceis/react`](../react) | React hooks + Next.js SSR helpers |

---

## License

MIT
