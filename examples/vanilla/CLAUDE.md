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
├── shared/             — Shared logic split into ES modules
│   ├── main.js         — Entry point: SDK init, cart manager, orchestration, window globals
│   ├── config.js       — SHOP_CONFIG (baseUrl, shopUuid, lang, URLs)
│   ├── format.js       — esc(), fp(), getErrorMessage(), PLACEHOLDER_SVG_*
│   ├── toast.js        — showToast() notification system
│   ├── header.js       — renderHeader(), mobile menu, SHOP_TABS/SHOP_KEYS
│   ├── footer.js       — renderFooter()
│   ├── cart.js         — Cart drawer, renderCartItems(), qty steppers, discount section
│   ├── modal.js        — Product detail modal: open, close, render, variant selection
│   ├── recommendations.js — renderRecsHtml(), attachRecsClickHandler(), loadCartRecommendations()
│   └── community.js    — Top customers, latest orders, community goals
└── styles.css          — All styles (shared across examples)
```

## Architecture

- **SDK IIFE**: Loaded via CDN `<script>` tag (before `shared/main.js`), exposes `window.SpaceIS`
- **`shared/main.js`**: ES module entry point — loaded as `<script type="module" src="shared/main.js">`. Initializes SDK client + CartManager, imports all modules, exposes globals for per-page scripts
- **`window.ShopUI`**: Namespace exposing shared functions for inline page scripts (`openProductModal`, `toggleCart`, etc.)
- **Window globals**: `cartMgr`, `client`, `esc`, `fp`, and other helpers are also set directly on `window` for backward compatibility with per-page `<script>` blocks
- **Per-page `<script>`**: Each HTML file has inline `<script>` for page-specific logic (NOT type="module") — accesses shared state via `window.*` globals
- **CartManager**: `client.createCartManager()` — reactive cart with localStorage persistence, `onChange()` subscriptions

## Key Patterns

- **ES modules**: `shared/` uses native ES module imports/exports — requires HTTP server (not `file://`)
- **Circular dep avoidance**: `cart.js` and `modal.js` use lazy runtime references (`_client`, `_cartMgr` set via `initXxx()`) instead of top-level imports from `main.js`
- **Incremental DOM updates**: Cart drawer and cart page patch only changed qty/prices when items haven't changed (no full rebuild)
- **Event delegation**: Qty stepper clicks and input changes delegated to parent containers
- **Product modal**: Shared modal with variant selection, qty stepper, recommendations
- **Toast notifications**: Custom toast system appended to `#toast-container`
- **Community section**: Top customers, latest orders, community goals (rankings API)

## Key Functions (shared/*)

| Function | Module | Description |
|---|---|---|
| `esc(str)` | format.js | Escape HTML (XSS prevention) |
| `fp(cents)` | format.js | Format price from cents → "12,99 zł" |
| `getErrorMessage(err)` | format.js | Extract user-friendly error from SpaceISError |
| `showToast(msg, type)` | toast.js | Show toast notification |
| `handleQtyStepperClick(e)` | cart.js | Shared click handler for +/− buttons |
| `handleQtyInputChange(e)` | cart.js | Shared change handler for qty text inputs |
| `openProductModal(slug)` | modal.js | Open product detail modal |
| `renderCartItems()` | cart.js | Render cart drawer items (incremental) |
| `renderCartBadge()` | cart.js | Update cart badge count |
| `loadCartRecommendations()` | recommendations.js | Load recommendations in cart drawer |

## Commands

No build step needed. Open any `.html` file in a browser **via HTTP server** (ES modules require HTTP):

```bash
npx serve .     # or python -m http.server 3333
```

## Configuration

Edit `shared/config.js` to set your shop:

```js
export const SHOP_CONFIG = {
  baseUrl: "https://storefront-api.spaceis.app",
  shopUuid: "your-shop-uuid-here",
  lang: "pl",
  returnUrl: "http://localhost:3333/order-summary",
  cancelUrl: "http://localhost:3333/checkout",
};
```
