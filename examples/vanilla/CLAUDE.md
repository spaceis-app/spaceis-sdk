# CLAUDE.md — SpaceIS Vanilla JS Example

## Overview

Complete shop storefront using plain HTML + vanilla JavaScript + the SpaceIS SDK IIFE build. No framework, no bundler, no build step — just open in a browser. Same visual design as the React/Vue/PHP examples.

## Structure

```
examples/vanilla/
├── index.html          — Products listing with categories, subcategories, pagination
├── packages.html       — Package bundles listing with categories
├── sales.html          — Active sales with countdown timers
├── cart.html           — Full cart page (client-side via CartManager)
├── checkout.html       — Checkout form + payment methods + agreements
├── voucher.html        — Voucher code redemption (reCAPTCHA)
├── daily-reward.html   — Daily reward claim (reCAPTCHA)
├── order-summary.html  — Order summary lookup
├── page.html           — CMS pages list + detail
├── statute.html        — Shop terms/statute
├── shared.js           — Shared logic: SDK init, helpers, cart drawer, product modal, community
└── styles.css          — All styles (shared across examples)
```

## Architecture

- **SDK IIFE**: Loaded via CDN `<script>` tag, exposes `window.SpaceIS`
- **`shared.js`**: Initializes SDK client + CartManager, defines all shared functions (cart drawer, product modal, toast, qty steppers, community section)
- **Per-page `<script>`**: Each HTML file has inline JS for page-specific logic
- **CartManager**: `client.createCartManager()` — reactive cart with localStorage persistence, `onChange()` subscriptions

## Key Patterns

- **ES2020+**: `const`/`let`, arrow functions, template literals, `async`/`await`, optional chaining (`?.`), nullish coalescing (`??`)
- **Incremental DOM updates**: Cart drawer and cart page patch only changed qty/prices when items haven't changed (no full rebuild)
- **Event delegation**: Qty stepper clicks and input changes delegated to parent containers
- **Product modal**: Shared modal with variant selection, qty stepper, recommendations
- **Toast notifications**: Custom toast system appended to `#toast-container`
- **Community section**: Top customers, latest orders, community goals (rankings API)

## Key Functions (shared.js)

| Function | Description |
|---|---|
| `esc(str)` | Escape HTML (XSS prevention) |
| `fp(cents)` | Format price from cents → "12,99 zł" |
| `getErrorMessage(err)` | Extract user-friendly error from SpaceISError |
| `showToast(msg, type)` | Show toast notification |
| `handleQtyStepperClick(e)` | Shared click handler for +/− buttons |
| `handleQtyInputChange(e)` | Shared change handler for qty text inputs |
| `openProductModal(slug)` | Open product detail modal |
| `renderCartItems()` | Render cart drawer items (incremental) |
| `renderCartBadge()` | Update cart badge count |
| `loadCartRecommendations()` | Load recommendations in cart drawer |

## Commands

No build step needed. Open any `.html` file in a browser, or serve with:

```bash
npx serve .     # or python -m http.server
```

## Configuration

Edit `shared.js` lines 11-15 to set your shop:

```js
const SHOP_CONFIG = {
  baseUrl: "https://storefront-api.spaceis.app",
  shopUuid: "your-shop-uuid-here",
  lang: "pl",
};
```
