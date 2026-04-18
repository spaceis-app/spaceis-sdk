# SpaceIS SDK — Vanilla JS Integration Guide

Getting started with `@spaceis/sdk` (IIFE via CDN) — copy this example as a template
or follow the steps below to integrate SpaceIS into any HTML website.

> This file is both a human tutorial and reference for AI coding agents
> (Claude Code, Cursor, Codex, Copilot). Agents working in this folder
> should also consult [AGENTS.md](./AGENTS.md) which documents runtime
> gotchas, module internals, and the `spaceis:ready` synchronisation pattern.

---

## Quick Setup (3 steps)

### Step 1: Add SDK script

```html
<script src="https://cdn.jsdelivr.net/npm/@spaceis/sdk@0.2.0/dist/spaceis.global.js"></script>
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
// Returns: { uuid, name, slug, description (raw HTML — sanitise before innerHTML), image,
//            base_price, percentage_discount, min_quantity, max_quantity, quantity_step,
//            unit (string — display unit label like "szt", "dni", "min"),
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
// Returns: [{ uuid, name, commission (multiplier — e.g. 1.2 = +20%), method }]

> `commission` is a **price multiplier**, not a percentage. Final price = `base * commission`. Example: `commission = 1.2` on a 100 PLN order = 120 PLN (20% surcharge). To display as %: `(commission - 1) * 100`.

// Get required agreements
client.checkout.agreements();
// Returns: [{ uuid, name, content (raw HTML — sanitise with DOMPurify before innerHTML) }]

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

> `page.content`, `statute.content`, `agreement.content` are **raw HTML from the API**. Always sanitise with DOMPurify (or escape if you only need text) before writing to `innerHTML`. See `page.html` in this example for the DOMPurify CDN pattern.

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

    <script src="https://cdn.jsdelivr.net/npm/@spaceis/sdk@0.2.0/dist/spaceis.global.js"></script>
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

      // NOTE: inline `onclick` is used for brevity in this minimal example.
      // In production prefer addEventListener/event delegation (see shared/cart.js).

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
├── shared/            — ES modules (shared logic split from old shared.js)
│   ├── main.js        — Entry point: SDK init, orchestration, window globals
│   ├── config.js      — SHOP_CONFIG (baseUrl, shopUuid, lang, URLs)
│   ├── format.js      — esc(), fp(), getErrorMessage(), placeholder SVGs
│   ├── toast.js       — showToast() notifications
│   ├── header.js      — Header + nav + mobile menu
│   ├── footer.js      — renderFooter()
│   ├── cart.js        — Cart drawer, items, qty steppers, discount, summary
│   ├── modal.js       — Product detail modal
│   ├── recommendations.js — Product recommendations
│   └── community.js   — Top customers, latest orders, goals
├── styles.css         — All styling
├── index.html         — Products with categories + subcategories
├── packages.html      — Package bundles
├── sales.html         — Active promotions with countdown
├── cart.html          — Full cart page with qty controls
├── checkout.html      — Payment form + order summary
├── voucher.html       — Voucher redemption
├── daily-reward.html  — Daily reward claim
├── order-summary.html — Order status after payment
├── page.html          — CMS pages (?slug=)
├── statute.html       — Shop terms/statute
├── AGENTS.md          — Reference for AI coding agents
├── CLAUDE.md          — Thin pointer to AGENTS.md
└── README.md          — This file (consumer tutorial)
```

Each HTML page loads shared logic via `<script type="module" src="shared/main.js">`.
The entry point initialises the SDK client, creates the CartManager, wires up all
modules, and exposes helpers on `window` for inline `<script>` blocks.

Because module scripts are deferred, per-page inline scripts that touch `client`
or `cartMgr` at top level MUST wrap that code in
`window.addEventListener("spaceis:ready", ...)`. See [AGENTS.md](./AGENTS.md) for
the full synchronisation pattern.

### Module overview (shared/)

| Module | Key exports | Purpose |
|---|---|---|
| `format.js` | `esc`, `fp`, `getErrorMessage`, `PLACEHOLDER_SVG_*` | Formatting, HTML escape (XSS), placeholders |
| `toast.js` | `showToast` | Toast notification system |
| `header.js` | `renderHeader`, `SHOP_TABS`, `setToggleCartCallback` | Nav + mobile menu |
| `footer.js` | `renderFooter` | Footer |
| `cart.js` | `initCart`, `toggleCart`, `renderCartBadge`, `renderCartItems`, `renderCartDrawer`, `renderCartSummary`, `renderDiscountSection`, `renderSkeletons`, `applyDiscountCode`, `removeDiscountCode`, `handleQtyStepperClick`, `handleQtyInputChange`, `getVariantLimits`, `clearCart` | Everything cart |
| `modal.js` | `initModal`, `openProductModal`, `closeModal` | Product detail modal |
| `recommendations.js` | `initRecommendations`, `renderRecsHtml`, `attachRecsClickHandler`, `loadCartRecommendations` | Recommendations |
| `community.js` | `initCommunity`, `renderCommunitySection`, `loadCommunityData` | Top customers, latest orders, goals |

Page-specific logic is in each HTML's `<script>` tag.

---

## Customization Checklist

To adapt this example to your shop:

1. **`shared/config.js`**: Change `shopUuid` to your shop UUID (from the SpaceIS admin panel). Also set `baseUrl`, `lang`, `returnUrl`, `cancelUrl`.
2. **`shared/header.js`**: Change the shop name in `renderHeader()` (search for the text "SpaceIS" near the logo).
3. **`styles.css`**: Adjust CSS variables in `:root` for colours, fonts, radii.
4. **All HTML files**: Update `<title>` tags (each has a page-specific title).
5. **`checkout.html`**: reCAPTCHA works automatically — site key is fetched from the API.
