# SpaceIS SDK — Vanilla JS Integration Guide

## For AI Agents (ChatGPT, Claude, etc.)

This document explains how to integrate SpaceIS shop into any HTML website using the vanilla JS SDK.

---

## Quick Setup (3 steps)

### Step 1: Add SDK script

```html
<script src="https://cdn.jsdelivr.net/npm/@spaceis/sdk/dist/spaceis.global.js"></script>
```

### Step 2: Initialize client

```js
const client = SpaceIS.createSpaceIS({
  baseUrl: "https://storefront-api.spaceis.app", // API URL — always this
  shopUuid: "YOUR_SHOP_UUID", // From SpaceIS panel
  lang: "pl", // pl, en, etc.
});

const cart = client.createCartManager();
```

### Step 3: Use the API

```js
// Get products
const products = await client.products.list({ page: 1 });

// Add to cart (human quantity: 1 = one item)
await cart.add("variant-uuid-here", 1);

// React to cart changes
cart.onChange(function (data) {
  // Update your UI here
  console.log("Cart items:", cart.items);
  console.log("Total:", SpaceIS.formatPrice(cart.finalPrice));
});
```

---

## Available SDK Methods

### Products

```js
// List products (paginated)
client.products.list({ page: 1, category_uuid: "..." });
// Returns: { data: Product[], meta: { current_page, last_page, total, per_page } }

// Get product details (by slug or UUID)
client.products.get("product-slug");
// Returns: { uuid, name, slug, description (HTML), image, base_price,
//            percentage_discount, min_quantity, max_quantity, quantity_step,
//            variants: [{ uuid, name, image, base_price, price, lowest_price_last_30_days }],
//            package }

// Get recommendations for a product
client.products.recommendations("product-slug");
// Returns: [{ shop_product, variant, base_price, price, name }]
```

### Categories

```js
client.categories.list();
// Returns: [{ uuid, name, slug, image, is_active, parent, children: [...recursive] }]
```

### Packages

```js
client.packages.list({ page: 1 });
// Returns: { data: Package[], meta: {...} }
// Package: { shop_product: {uuid,name,slug,image}, package: {uuid,name},
//            percentage_discount, minimal_base_price, minimal_price }
```

### Cart (via CartManager — recommended)

```js
const cart = client.createCartManager();

// Subscribe to changes (fires immediately + on every update)
cart.onChange(function (data) {
  // data = Cart object or null
});

// Operations (all return Promises)
cart.load(); // Load/refresh cart from server
cart.add("variant-uuid", 1); // Add 1 item (SDK handles quantity conversion)
cart.add("variant-uuid", 3); // Add 3 items
cart.remove("variant-uuid"); // Remove all of this variant
cart.remove("variant-uuid", 1); // Remove 1 of this variant
cart.setQuantity("variant-uuid", 5); // Set exact quantity to 5
cart.applyDiscount("CODE123"); // Apply discount code
cart.removeDiscount(); // Remove discount
cart.clear(); // Clear cart (local only)

// Read state (getters — no await needed)
cart.items; // CartItem[] (from API)
cart.itemCount; // Number of unique items
cart.totalQuantity; // Total quantity (already human-readable: 1, 2, 3)
cart.finalPrice; // Price in cents (after discounts)
cart.regularPrice; // Price in cents (before discounts)
cart.discount; // { code, percentage_discount, source } or null
cart.hasDiscount; // boolean
cart.isEmpty; // boolean
cart.isLoading; // boolean
```

### Checkout

```js
// Get payment methods
client.checkout.paymentMethods();
// Returns: [{ uuid, name, commission (percentage), method }]

// Get required agreements
client.checkout.agreements();
// Returns: [{ uuid, name, content }]

// Place order (requires reCAPTCHA token)
const token = await client.recaptcha.execute("checkout");
client.checkout.placeOrder({
  email: "user@email.com",
  first_name: "PlayerNick",
  payment_method_uuid: "method-uuid",
  "g-recaptcha-response": token,
  agreements: ["agreement-uuid-1"],
});
// Returns: { redirect_url } — redirect user to this URL for payment
```

### reCAPTCHA (v3, automatic)

```js
// SDK fetches site key from API and loads Google script automatically
await client.recaptcha.load(); // Pre-load (optional)
const token = await client.recaptcha.execute("action_name"); // Get token
```

### Content (CMS Pages, Statute)

```js
client.content.pages(); // All CMS pages
client.content.page("slug"); // Single page by slug
client.content.statute(); // Shop statute/terms
```

### Sales, Goals

```js
client.sales.list({ sort: "-percentage_discount" });
client.goals.list();
```

### Vouchers & Daily Rewards

```js
const token = await client.recaptcha.execute("voucher");
client.vouchers.redeem({ nick: "Player", code: "ABCD", "g-recaptcha-response": token });

const token2 = await client.recaptcha.execute("daily_reward");
client.dailyRewards.claim({ nick: "Player", "g-recaptcha-response": token2 });
```

### Rankings

```js
client.rankings.top({ limit: 10 }); // Top customers
client.rankings.latest({ limit: 10 }); // Latest orders
```

### Orders

```js
client.orders.summary("ORDER_CODE"); // Order summary after payment
```

### Shop Config

```js
client.shop.config();
// Returns: { app_name, description, logo, favicon, footer, sections, meta, og, ... }
```

---

## CRITICAL: Quantity & Price Rules

### Prices are in CENTS (grosze)

```js
// API returns: product.minimal_price = 1299 (meaning 12.99 PLN)
// To display:
SpaceIS.formatPrice(1299); // "12,99 zl"
SpaceIS.formatPrice(1299, "EUR"); // "12,99 €"
SpaceIS.centsToAmount(1299); // 12.99 (raw number)
```

### Quantities are in THOUSANDTHS in raw API data

```js
// API returns item.quantity = 2000 (meaning 2 items)
// CartManager handles conversion automatically:
cart.add("uuid", 1); // SDK sends 1000 to API ✓
cart.totalQuantity; // Already converted: returns 2, not 2000 ✓

// But raw cart items from API have unconverted quantity:
cart.items[0].quantity; // 2000 (raw!) — DON'T display directly
SpaceIS.getItemQty(item); // 2 ✓ — use this instead
SpaceIS.fromApiQty(2000); // 2 ✓ — or this

// Product limits are also in thousandths:
const limits = SpaceIS.getProductLimits(product);
limits.min; // 1 (converted from min_quantity: 1000)
limits.max; // 64 (converted from max_quantity: 64000)
limits.step; // 1 (converted from quantity_step: 1000)
```

---

## Utility Functions

```js
SpaceIS.formatPrice(cents, currency?, locale?)  // 1299 → "12,99 zl"
SpaceIS.centsToAmount(cents)                     // 1299 → 12.99
SpaceIS.fromApiQty(apiQty)                       // 1000 → 1
SpaceIS.toApiQty(displayQty)                     // 1 → 1000
SpaceIS.getItemQty(cartItem)                     // Shortcut for fromApiQty(item.quantity)
SpaceIS.getProductLimits(product)                // { min, max, step } (converted)
SpaceIS.getCartItemImage(cartItem)               // Best image URL or null
SpaceIS.escapeHtml(string)                       // Prevents XSS
```

---

## Error Handling

```js
try {
  await cart.add("invalid-uuid", 1);
} catch (err) {
  if (err instanceof SpaceIS.SpaceISError) {
    err.message; // "The given data was invalid."
    err.status; // 422
    err.isValidation; // true
    err.isNotFound; // false — 404
    err.isRateLimited; // false — 429
    err.errors; // { variant_uuid: ["Invalid UUID"] }
    err.fieldError("email"); // First error for field
    err.allFieldErrors(); // ["field: message", ...]
  }
}
```

---

## Cart Token

The SDK automatically:

1. Generates a UUID cart token on first `cart.add()` call
2. Saves it to `localStorage` (key: `spaceis_cart_{shopUuid}`)
3. Sends it as `X-Cart-Token` header with every request
4. Restores it on page reload

You don't need to manage the token manually.

---

## Example: Minimal Product Listing + Cart

```html
<!DOCTYPE html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Shop</title>
  </head>
  <body>
    <h1>Products</h1>
    <div id="products"></div>
    <h2>Cart (<span id="count">0</span> items) — <span id="total">0,00 zl</span></h2>
    <div id="cart-items"></div>

    <script src="https://cdn.jsdelivr.net/npm/@spaceis/sdk/dist/spaceis.global.js"></script>
    <script>
      const client = SpaceIS.createSpaceIS({
        baseUrl: "https://storefront-api.spaceis.app",
        shopUuid: "YOUR_SHOP_UUID",
        lang: "pl",
      });
      const cart = client.createCartManager();

      // Load and render products
      client.products.list({ page: 1 }).then(function (result) {
        const container = document.getElementById("products");
        result.data.forEach(function (product) {
          container.innerHTML +=
            "<div>" +
            "<b>" +
            SpaceIS.escapeHtml(product.name) +
            "</b> — " +
            SpaceIS.formatPrice(product.minimal_price) +
            " <button onclick=\"openProduct('" +
            product.slug +
            "')\">View</button>" +
            "</div>";
        });
      });

      // Open product, pick first variant, add to cart
      async function openProduct(slug) {
        const product = await client.products.get(slug);
        if (product.variants.length > 0) {
          await cart.add(product.variants[0].uuid, 1);
        }
      }

      // Update cart UI on every change
      cart.onChange(function () {
        document.getElementById("count").textContent = cart.totalQuantity;
        document.getElementById("total").textContent = SpaceIS.formatPrice(cart.finalPrice);

        let html = "";
        cart.items.forEach(function (item) {
          html +=
            "<div>" +
            SpaceIS.escapeHtml(item.shop_product.name) +
            " x" +
            SpaceIS.getItemQty(item) +
            " — " +
            SpaceIS.formatPrice(item.final_price_value) +
            "</div>";
        });
        document.getElementById("cart-items").innerHTML = html || "Empty";
      });
    </script>
  </body>
</html>
```

---

## File Structure of This Example

```
examples/vanilla/
├── shared.js          — SDK init, nav, cart drawer, product modal, shared helpers
├── styles.css         — All styling (light theme, DM Sans/Mono)
├── index.html         — Products with categories + subcategories
├── packages.html      — Package bundles
├── sales.html         — Active promotions with countdown
├── cart.html           — Full cart page with qty controls + summary
├── checkout.html      — Payment form + order summary sidebar
├── voucher.html       — Voucher redemption
├── daily-reward.html  — Daily reward claim
├── order-summary.html — Order status after payment
├── page.html          — CMS pages (dynamic by ?slug=)
├── statute.html       — Shop terms/statute
└── INSTRUCTIONS.md    — This file
```

Each HTML page includes `shared.js` which handles:

- Navigation rendering (auto-detects active page)
- Cart drawer (reactive, updates on every cart change)
- Product detail modal (variants, quantity, recommendations)
- Community section (top customers, latest orders, goals) on shop pages
- Toast notifications
- All SDK initialization

### Shared helpers in `shared.js`

These reusable functions prevent code duplication across pages:

| Function | Purpose |
|---|---|
| `PLACEHOLDER_SVG_SM/MD/LG` | Image placeholder SVG constants (24/28/32px) |
| `getVariantLimits(uuid)` | Cached product qty limits (min/max/step) |
| `handleQtyStepperClick(e)` | Unified +/- button handler with limits |
| `handleQtyInputChange(e)` | Unified manual qty input handler |
| `renderDiscountSection(el, opts)` | Discount code apply/remove UI |
| `renderCartSummary(el, opts)` | Subtotal + discount + total panel |

Page-specific logic is in each HTML's `<script>` tag.

---

## Customization Checklist

To adapt this example to your shop:

1. **`shared.js` line 8**: Change `shopUuid` to your shop UUID
2. **`shared.js` line 125**: Change `'SpaceIS'` to your shop name
3. **`styles.css`**: Adjust CSS variables in `:root` for colors/fonts
4. **All HTML files**: Update `<title>` tags
5. **`checkout.html`**: reCAPTCHA works automatically (key from API)
