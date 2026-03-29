# SpaceIS SDK — Vue / Nuxt 4 Integration Guide

## For AI Agents (ChatGPT, Claude, etc.)

This document explains how to integrate SpaceIS shop into a Nuxt 4 project using `@spaceis/vue`.

---

## Quick Setup (3 steps)

### Step 1: Install dependencies

```bash
pnpm add @spaceis/sdk @spaceis/vue isomorphic-dompurify
```

### Step 2: Set environment variables

Create `.env`:

```env
NUXT_PUBLIC_SPACEIS_API_URL=https://storefront-api.spaceis.app
NUXT_PUBLIC_SPACEIS_SHOP_UUID=YOUR_SHOP_UUID
```

### Step 3: Run the dev server

```bash
pnpm dev
```

Open `http://localhost:3000`.

---

## Project Structure

```
examples/vue/
├── nuxt.config.ts              — Nuxt config (runtimeConfig, CSS, fonts)
├── app.vue                     — Root (NuxtLayout + NuxtPage)
├── layouts/default.vue         — Header + main + CartDrawer + Footer + Toasts
├── pages/
│   ├── index.vue               — Products listing with categories
│   ├── product/[slug].vue      — Product detail (SSR + SEO)
│   ├── packages.vue            — Package bundles listing
│   ├── sales.vue               — Active sales with countdown timers
│   ├── cart.vue                — Full cart page (client-only)
│   ├── checkout.vue            — Checkout form (client-only)
│   ├── voucher.vue             — Voucher redemption (reCAPTCHA)
│   ├── daily-reward.vue        — Daily reward (reCAPTCHA)
│   ├── order/[code].vue        — Order lookup
│   ├── page/index.vue          — CMS pages list
│   ├── page/[slug].vue         — Single CMS page
│   └── statute.vue             — Shop terms
├── components/                 — Auto-imported components
│   ├── AppHeader.vue           — Navigation + cart badge
│   ├── AppFooter.vue           — Footer
│   ├── CartDrawer.vue          — Slide-in cart drawer
│   ├── ProductCard.vue         — Product card
│   ├── SaleCard.vue            — Sale card with timer
│   ├── QtyInput.vue            — Quantity input with limits
│   ├── Recommendations.vue     — Product recommendations
│   ├── CommunitySection.vue    — Rankings + goals
│   └── ToastContainer.vue      — Toast notification renderer
├── composables/
│   ├── useCartDrawer.ts        — Cart drawer state
│   └── useToast.ts             — Toast notifications
├── plugins/spaceis.ts   — SpaceIS plugin (client-only)
├── server/utils/spaceis.ts     — Server-side client
├── utils/helpers.ts            — Formatting + error helpers
├── assets/styles.css           — Stylesheet
├── error.vue                   — Error/404 page
├── package.json
├── .env.example
└── INSTRUCTIONS.md             — This file
```

---

## How SpaceISPlugin Works

`SpaceISPlugin` is a Vue plugin that sets up the SpaceIS client, CartManager, and TanStack Vue Query. Install it as a client-only Nuxt plugin:

```ts
// plugins/spaceis.ts
import { SpaceISPlugin } from '@spaceis/vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(SpaceISPlugin, {
    config: {
      baseUrl: useRuntimeConfig().public.spaceisApiUrl || 'https://storefront-api.spaceis.app',
      shopUuid: useRuntimeConfig().public.spaceisShopUuid || '',
      lang: 'pl',
    },
    cartOptions: { autoLoad: true },
  });
});
```

All composables (`useProducts`, `useCart`, `useCheckout`, etc.) must be called inside components rendered after the plugin is installed.

---

## Composable Usage Examples

### useProducts — Paginated product listing

```vue
<script setup>
import { useProducts } from '@spaceis/vue';

const { data, isLoading } = useProducts({ page: 1, category_uuid: '...' });
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-for="p in data?.data" :key="p.uuid">{{ p.name }}</div>
</template>
```

### useCart — Reactive cart with actions

```vue
<script setup>
import { useCart, getItemQty, formatPrice } from '@spaceis/vue';

const {
  items, totalQuantity, finalPrice, isEmpty, isLoading,
  add, remove, increment, decrement, applyDiscount, removeDiscount,
} = useCart();
</script>

<template>
  <div v-if="isLoading">Loading cart...</div>
  <div v-else-if="isEmpty">Cart is empty</div>
  <div v-else>
    <p>{{ totalQuantity }} items - {{ formatPrice(finalPrice) }}</p>
    <div v-for="item in items" :key="item.variant?.uuid">
      {{ item.shop_product?.name }} x{{ getItemQty(item) }}
      <button @click="increment(item.variant!.uuid)">+</button>
      <button @click="decrement(item.variant!.uuid)">-</button>
      <button @click="remove(item.variant!.uuid)">Remove</button>
    </div>
  </div>
</template>
```

### useCheckout — Payment methods, agreements, place order

```vue
<script setup>
import { useCheckout, useRecaptcha } from '@spaceis/vue';

const { methods, agreements, placeOrder } = useCheckout();
const { execute: executeRecaptcha } = useRecaptcha();

async function handleSubmit() {
  const token = await executeRecaptcha('checkout');
  const result = await placeOrder.mutateAsync({
    email: 'user@email.com',
    first_name: 'PlayerNick',
    payment_method_uuid: 'method-uuid',
    'g-recaptcha-response': token,
    agreements: ['agreement-uuid'],
  });
  if (result.redirect_url) {
    window.location.href = result.redirect_url;
  }
}
</script>
```

---

## Available Composables Reference

| Composable | Returns | Purpose |
|---|---|---|
| `useSpaceIS()` | `{ client, cartManager }` | Raw SDK client and CartManager access |
| `useCart()` | Items, totals, loading, `add`/`remove`/`increment`/`decrement`/`applyDiscount`/`removeDiscount` | Reactive cart via shallowRef + onChange |
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

All data composables return standard TanStack Vue Query results (`data`, `isLoading`, `isError`, `error`, etc.).

---

## Server-Side Client

For SSR-only data fetching (e.g., in Nuxt server routes), use `useServerSpaceIS()`:

```ts
// server/utils/spaceis.ts
import { createSpaceIS } from '@spaceis/sdk';

export function useServerSpaceIS() {
  const config = useRuntimeConfig();
  return createSpaceIS({
    baseUrl: config.public.spaceisApiUrl as string,
    shopUuid: config.public.spaceisShopUuid as string,
    lang: 'pl',
  });
}
```

---

## Key Patterns

### Client-only components

Cart and checkout pages use `<ClientOnly>` because they depend on `localStorage`-based cart state:

```vue
<ClientOnly>
  <CartPage />
</ClientOnly>
```

### Teleport for overlays

Mobile menu and other overlays use `<Teleport to="body">` to escape header stacking context:

```vue
<Teleport to="body">
  <div class="mobile-menu-overlay" />
  <nav class="mobile-menu">...</nav>
</Teleport>
```

### HTML sanitization

All HTML content from the API uses `sanitizeHtml()` with DOMPurify:

```vue
<div v-html="sanitizeHtml(product.description)" />
```

### Prices and quantities

- **Prices** are in cents (grosze). Use `formatPrice(1299)` to display `"12,99 zl"`.
- **Quantities** from the API are in thousandths. Use `getItemQty(item)` for display. `useCart()` actions handle conversion automatically.

### SEO metadata

```vue
<script setup>
useHead({ title: 'Products' });

// Dynamic SEO for product pages:
useSeoMeta({
  title: () => product.value?.name || 'Product',
  description: () => product.value?.description?.replace(/<[^>]*>/g, '').slice(0, 160) || '',
  ogImage: () => product.value?.image || '',
});
</script>
```

### Toast notifications

Simple toast system without external dependencies (auto-imported from `composables/useToast.ts`):

```vue
<script setup>
const { success, error } = useToast();

try {
  await someAction();
  success('Done!');
} catch (err) {
  error(getErrorMessage(err));
}
</script>
```

`ToastContainer.vue` is mounted in the default layout and renders toasts via `<Teleport>`.

### Error handling with SpaceISError

```ts
import { SpaceISError } from '@spaceis/vue';

function getErrorMessage(err: unknown): string {
  if (err instanceof SpaceISError) {
    if (err.isValidation) {
      const all = err.allFieldErrors ? err.allFieldErrors() : [];
      if (all.length > 0) return all[0];
    }
    return err.message;
  }
  return err instanceof Error ? err.message : 'An error occurred';
}
```

---

## How to Add a New Page

### 1. Create the page file

```vue
<!-- pages/rankings.vue -->
<script setup lang="ts">
import { useTopCustomers, formatPrice } from '@spaceis/vue';

useHead({ title: 'Rankings' });

const { data: top, isLoading } = useTopCustomers({ limit: 20, sort: '-total_spent' });
</script>

<template>
  <div class="container">
    <h1>Top Customers</h1>
    <div v-if="isLoading" class="spinner" />
    <div v-else v-for="(c, i) in (top as any[])" :key="i">
      #{{ i + 1 }} {{ c.first_name }} -- {{ formatPrice(c.total_spent) }}
    </div>
  </div>
</template>
```

### 2. Add navigation link

Update `AppHeader.vue` to include the new route in `NAV_LINKS`.

### 3. For cart-dependent pages

Wrap cart-dependent content in `<ClientOnly>`:

```vue
<template>
  <ClientOnly>
    <MyCartDependentContent />
  </ClientOnly>
</template>
```

---

## Customization Checklist

To adapt this example to your shop:

1. **`.env`**: Set `NUXT_PUBLIC_SPACEIS_SHOP_UUID` to your shop UUID
2. **`plugins/spaceis.ts`**: Adjust `lang` if needed (default: `"pl"`)
3. **`nuxt.config.ts`**: Update head metadata
4. **`components/AppHeader.vue`**: Change shop name and navigation links
5. **`assets/styles.css`**: Adjust CSS variables for your brand colors/fonts
