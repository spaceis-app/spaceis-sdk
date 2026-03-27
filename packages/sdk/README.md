# @spaceis/sdk

Official JavaScript SDK for the **SpaceIS** Minecraft shop platform.

- Zero runtime dependencies
- Works in browsers, Node.js, Deno, Bun
- Full TypeScript support
- Reactive cart with auto-persistence
- reCAPTCHA v3 built-in

---

## Installation

```bash
npm install @spaceis/sdk
```

Or via CDN (browser `<script>` tag):

```html
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
| `getCartItemImage(item)` | `getCartItemImage(i)` | `"https://..." \| null` |
| `escapeHtml(str)` | `escapeHtml("<b>")` | `"&lt;b&gt;"` |

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

Chrome 80+, Firefox 78+, Safari 15+, Edge 80+, Node.js 18+, Deno, Bun.

Requires native `fetch` and `AbortSignal.timeout`.

---

## API Documentation

For the full SpaceIS REST API reference, see [docs.spaceis.app/api](https://docs.spaceis.app/api#/).

## License

MIT
