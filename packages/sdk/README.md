# @spaceis/sdk

[![npm](https://img.shields.io/npm/v/@spaceis/sdk)](https://www.npmjs.com/package/@spaceis/sdk)
[![license](https://img.shields.io/npm/l/@spaceis/sdk)](./LICENSE)

Official JavaScript SDK for the **SpaceIS** shop platform.

- Zero runtime dependencies
- Works in browsers, Node.js, Deno, Bun
- Full TypeScript support
- Reactive cart with auto-persistence
- reCAPTCHA v3 built-in

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [Products](#products)
  - [Categories](#categories)
  - [Cart (CartManager)](#cart-reactive)
  - [Low-level Cart API](#low-level-cart-api)
  - [Checkout & reCAPTCHA](#checkout)
  - [Orders](#orders)
  - [Vouchers & Daily Rewards](#vouchers--daily-rewards)
  - [Sales, Goals, Packages](#sales-goals-packages)
  - [Rankings](#rankings)
  - [Content (CMS)](#content-cms)
  - [Shop Config](#shop-config)
- [Prices & Quantities](#prices--quantities)
- [Error Handling](#error-handling)
- [Configuration Options](#configuration-options)
- [TypeScript](#typescript)
- [Browser Support](#browser-support)
- [Related Packages](#related-packages)
- [License](#license)

---

## Installation

```bash
npm install @spaceis/sdk
```

Or via CDN (browser `<script>` tag):

```html
<!-- unpkg -->
<script src="https://unpkg.com/@spaceis/sdk/dist/spaceis.global.js"></script>

<!-- jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/@spaceis/sdk/dist/spaceis.global.js"></script>
```

---

## Quick start

### ESM / TypeScript

```js
import { createSpaceIS } from "@spaceis/sdk";

const client = createSpaceIS({
  baseUrl: "https://storefront-api.spaceis.app",
  shopUuid: "YOUR_SHOP_UUID",
  lang: "en",
});
```

### CDN (browser global)

```js
const client = SpaceIS.createSpaceIS({
  baseUrl: "https://storefront-api.spaceis.app",
  shopUuid: "YOUR_SHOP_UUID",
  lang: "en",
});
```

---

## API reference

### Products

```js
// List with pagination
const result = await client.products.list({ page: 1, category_uuid: "..." });
// result.data  — IndexShopProduct[]
// result.meta  — { current_page, last_page, total, per_page }

// Single product
const product = await client.products.get("product-slug");

// Recommendations
const recs = await client.products.recommendations("product-slug");
```

### Categories

```js
const categories = await client.categories.list();
// Recursive tree — each category has .children[]
```

### Cart (reactive)

Use `CartManager` for reactive cart state with auto-persistence:

```js
const cart = client.createCartManager();

// Listen to changes
const unsubscribe = cart.onChange((data) => {
  console.log(cart.items);
  console.log(cart.formatPrice());
});

// Mutate
await cart.add("variant-uuid", 2);
await cart.increment("variant-uuid");
await cart.decrement("variant-uuid");
await cart.setQuantity("variant-uuid", 5);
await cart.remove("variant-uuid");

// Discount codes
await cart.applyDiscount("CODE123");
await cart.removeDiscount();

// Read state (synchronous)
cart.items;           // CartItem[]
cart.itemCount;       // unique line items
cart.totalQuantity;   // total qty (human-readable)
cart.finalPrice;      // cents (after discounts)
cart.regularPrice;    // cents (before discounts)
cart.discount;        // { code, percentage_discount } | null
cart.isEmpty;         // boolean
cart.isLoading;       // boolean

// Lookup
cart.findItem("variant-uuid");   // CartItem | null
cart.hasItem("variant-uuid");    // boolean
cart.getQuantity("variant-uuid"); // human-readable qty

// Cleanup
cart.clear();
unsubscribe();
```

> Cart token is auto-generated on first mutation and persisted in `localStorage`.

#### CartManager Options

Pass options to `createCartManager()` to customize behavior:

```js
const cart = client.createCartManager({
  autoLoad: true,
  storagePrefix: "my_app_cart_",
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `autoLoad` | `boolean` | `false` | Auto-load cart from server on creation |
| `storagePrefix` | `string` | `"spaceis_cart_"` | localStorage key prefix |

#### Low-level Cart API

For direct API calls without reactive state, use `client.cart` directly:

```js
const cart = await client.cart.get();
await client.cart.addItem({ variant_uuid: "...", quantity: 1000 });
```

> Note: quantities in the low-level API use **thousandths** (1 item = 1000). `CartManager` handles this conversion automatically.

### Checkout

```js
const methods    = await client.checkout.paymentMethods();
const agreements = await client.checkout.agreements();

// reCAPTCHA v3 (loads script automatically)
const token = await client.recaptcha.execute("checkout");

const result = await client.checkout.placeOrder({
  email: "player@example.com",
  first_name: "Steve",
  payment_method_uuid: methods[0].uuid,
  "g-recaptcha-response": token,
  agreements: [agreements[0].uuid],
});

if (result.redirect_url) {
  window.location.href = result.redirect_url;
}
```

### Orders

```js
const order = await client.orders.summary("ORDER_CODE");
// order.status           — "pending" | "completed" | "cancelled"
// order.items            — OrderSummaryItem[]
// order.final_total_price — cents
```

### Vouchers & Daily Rewards

```js
const token = await client.recaptcha.execute("voucher");
await client.vouchers.redeem({
  nick: "Steve",
  code: "FREE-VIP",
  "g-recaptcha-response": token,
});

const token2 = await client.recaptcha.execute("daily_reward");
await client.dailyRewards.claim({
  nick: "Steve",
  "g-recaptcha-response": token2,
});
```

### Sales, Goals, Packages

```js
await client.sales.list({ sort: "-percentage_discount" });
await client.goals.list();
await client.packages.list({ page: 1 });
```

### Rankings

```js
await client.rankings.top({ limit: 10, sort: "-total_spent" });
await client.rankings.latest({ limit: 10, sort: "-completed_at" });
```

### Content (CMS)

```js
await client.content.pages();
await client.content.page("about-us");
await client.content.statute();
```

### Shop config

```js
const config = await client.shop.config();
// config.app_name, config.description, config.logo, config.sections, ...
```

---

## Prices & Quantities

All prices are in **cents** (grosze). All API quantities are in **thousandths** (1 item = 1000).

`CartManager` handles conversion automatically. For raw API data use helpers:

| Helper | Example | Result |
|---|---|---|
| `formatPrice(cents, currency?)` | `formatPrice(1299)` | `"12,99 zl"` |
| `centsToAmount(cents)` | `centsToAmount(1299)` | `12.99` |
| `fromApiQty(apiQty)` | `fromApiQty(2000)` | `2` |
| `toApiQty(qty)` | `toApiQty(2)` | `2000` |
| `getItemQty(item)` | `getItemQty(cartItem)` | `2` |
| `getProductLimits(product)` | `getProductLimits(p)` | `{ min: 1, max: 64, step: 1 }` |
| `snapQuantity(qty, limits)` | `snapQuantity(5, { min: 1, max: 64, step: 2 })` | `5` |
| `getCartItemImage(item)` | `getCartItemImage(i)` | `"https://..." \| null` |
| `escapeHtml(str)` | `escapeHtml("<b>")` | `"&lt;b&gt;"` |

### Quantity snapping

When users input custom quantities, use `snapQuantity` to round to the nearest valid step. This is especially useful for products that must be purchased in fixed increments:

```js
import { getProductLimits, snapQuantity } from "@spaceis/sdk";

const limits = getProductLimits(product); // { min: 3, max: 99, step: 3 }
snapQuantity(5, limits); // 6 (nearest valid: 3, 6, 9...)
snapQuantity(1, limits); // 3 (clamped to min)
snapQuantity(100, limits); // 99 (clamped to max)
```

---

## Error handling

```js
import { SpaceISError } from "@spaceis/sdk";

try {
  await cart.add("invalid-uuid");
} catch (err) {
  if (err instanceof SpaceISError) {
    err.message;        // "The given data was invalid."
    err.status;         // 422
    err.isValidation;   // true
    err.isNotFound;     // false
    err.isRateLimited;  // false
    err.errors;         // { variant_uuid: ["Invalid UUID"] }
    err.fieldError("email");  // "Email is required." | undefined
    err.allFieldErrors();     // ["field: message", ...]
  }
}
```

---

## Configuration options

```js
createSpaceIS({
  baseUrl: "https://storefront-api.spaceis.app",  // required
  shopUuid: "your-uuid",                           // required
  lang: "pl",                                      // optional, default: none
  cartToken: "existing-token",                     // optional, restore session
  timeout: 30000,                                  // optional, ms (default: 30000)
  onRequest: (url, init) => {},                    // optional, before each request
  onResponse: (response) => {},                    // optional, after each response
  onError: (error) => {},                          // optional, on API errors
});

// Runtime updates
client.setLang("en");
client.setCartToken("new-token");
```

### Lifecycle hooks

Use lifecycle hooks to add logging, analytics, or custom error handling:

```js
createSpaceIS({
  baseUrl: "https://storefront-api.spaceis.app",
  shopUuid: "your-uuid",
  onRequest: (url, init) => {
    console.log(`[SpaceIS] ${init.method} ${url}`);
  },
  onResponse: (response) => {
    console.log(`[SpaceIS] ${response.status} ${response.url}`);
  },
  onError: (error) => {
    console.error(`[SpaceIS] ${error.status}: ${error.message}`);
  },
});
```

---

## TypeScript

Full type definitions included:

```typescript
import {
  createSpaceIS,
  SpaceISError,
  type IndexShopProduct,
  type ShowShopProduct,
  type Cart,
  type CartItem,
  type PaymentMethod,
  type Agreement,
} from "@spaceis/sdk";
```

---

## Browser support

Chrome 80+, Firefox 78+, Safari 15+, Edge 80+, Node.js 20+, Deno, Bun.

Requires native `fetch` and `AbortSignal.timeout`.

---

## API Documentation

For the full SpaceIS REST API reference, see [docs.spaceis.app/api](https://docs.spaceis.app/api#/).

## Related Packages

| Package | Description |
|---|---|
| [`@spaceis/react`](../react) | React hooks + Next.js SSR helpers |
| [`@spaceis/vue`](../vue) | Vue 3 composables + Nuxt SSR helpers |

## License

MIT
