# examples/vanilla — agent guidance

> Canonical instruction file for AI coding agents (Claude Code, Cursor,
> Codex, Copilot). Applies when working on this example OR when a consumer
> copies it via `create-spaceis`.
>
> `CLAUDE.md` in this folder is a thin pointer to this file.
>
> For SDK-level domain conventions (prices in cents, qty in thousandths,
> cart token lifecycle, payment commission as a multiplier, XSS on HTML
> fields) see `packages/sdk/AGENTS.md` (monorepo) or
> `node_modules/@spaceis/sdk/AGENTS.md` (downstream). All of those rules
> apply here too.

## Overview

Complete shop storefront built with plain HTML + vanilla JavaScript + the
SpaceIS SDK IIFE build. No framework, no bundler, no build step. Same visual
design as the React/Vue/PHP examples. Consumers download this template via
`create-spaceis` as a starting point for custom storefronts.

## Architecture

```
examples/vanilla/
├── index.html          — Products listing (categories, subcategories, pagination)
├── packages.html       — Package bundles listing
├── sales.html          — Active sales with countdown timers
├── cart.html           — Full cart page (client-side via CartManager)
├── checkout.html       — Checkout form + payment methods + agreements
├── voucher.html        — Voucher code redemption (reCAPTCHA)
├── daily-reward.html   — Daily reward claim (reCAPTCHA)
├── order-summary.html  — Order summary lookup
├── page.html           — CMS pages list + detail (DOMPurify sanitised)
├── statute.html        — Shop terms/statute (DOMPurify sanitised)
├── shared/             — Each file is an ES module
│   ├── main.js         — SDK init, CartManager, window globals, spaceis:ready dispatch
│   ├── config.js       — SHOP_CONFIG (baseUrl, shopUuid, lang, return/cancel URLs)
│   ├── format.js       — esc(), fp(), getErrorMessage(), PLACEHOLDER_SVG_*
│   ├── toast.js        — showToast()
│   ├── header.js       — renderHeader(), SHOP_TABS, SHOP_KEYS, setToggleCartCallback()
│   ├── footer.js       — renderFooter()
│   ├── cart.js         — Cart drawer, renderCartItems(), qty steppers, initCart()
│   ├── modal.js        — Product detail modal, initModal()
│   ├── recommendations.js — renderRecsHtml(), attachRecsClickHandler(), initRecommendations()
│   └── community.js    — Top customers, latest orders, goals, initCommunity()
└── styles.css
```

The SDK loads as an IIFE (`window.SpaceIS`) via a `<script src="cdn.jsdelivr.net/...">` tag
placed before `<script type="module" src="shared/main.js">`.

## Domain conventions — vanilla-specific

### Requires HTTP server — `file://` does not work

ES modules are blocked by the browser on `file://` URLs. Always serve locally:

```bash
python -m http.server 3333   # or: npx serve .
```

### `spaceis:ready` — critical synchronisation point

`shared/main.js` is loaded as `<script type="module">`, which the browser
defers automatically. Per-page `<script>` blocks (without `type="module"`)
are synchronous and execute **before** the module finishes. All globals set by
`main.js` (`window.client`, `window.cartMgr`, etc.) are `undefined` at that
point. `main.js` fires `spaceis:ready` after all globals are set:

```js
window.dispatchEvent(new CustomEvent("spaceis:ready", { detail: { client, cartMgr } }));
```

Every per-page call that touches a global from `main.js` **must** be wrapped:

```html
<script>
  "use strict";
  window.addEventListener("spaceis:ready", () => {
    renderSkeletons();
    client.products.list({ page: 1 }).then(render);
  });
</script>
```

### Window globals exposed by `shared/main.js`

`main.js` assigns each item below to both `window.*` (flat) and `window.ShopUI.*`
(namespace). Both sets are identical — the flat globals exist for backwards
compatibility with per-page `<script>` blocks.

| Global | Source |
|---|---|
| `client`, `cartMgr`, `SHOP_CONFIG` | SDK + config.js |
| `esc`, `fp`, `getErrorMessage`, `PLACEHOLDER_SVG_SM/MD/LG`, `showToast` | format.js / toast.js |
| `toggleCart`, `clearCart`, `applyDiscountCode`, `removeDiscountCode` | cart.js |
| `renderCartBadge`, `renderCartItems`, `renderCartDrawer`, `renderCartSummary` | cart.js |
| `renderDiscountSection`, `renderSkeletons` | cart.js |
| `handleQtyStepperClick`, `handleQtyInputChange`, `getVariantLimits` | cart.js |
| `loadCartRecommendations`, `renderRecsHtml`, `attachRecsClickHandler` | recommendations.js |
| `openProductModal`, `closeModal` | modal.js |

Any new function in `shared/` that per-page scripts need **must** be added to
both `window.ShopUI` and as a flat `window.*` assignment in `main.js`.

### Circular dependency — lazy init pattern

`cart.js` and `modal.js` need `client` and `cartMgr`, which live in `main.js`
— which also imports those modules. Direct top-level imports would be circular.
Both modules export an `init*()` function instead:

```js
// cart.js
let _client, _cartMgr;
export function initCart(client, cartMgr) { _client = client; _cartMgr = cartMgr; }
```

`main.js` calls `initCart(client, cartMgr)` after creating both. Similarly,
`header.js` uses `setToggleCartCallback(fn)` to receive `toggleCart` without
importing `cart.js` at the top level. Do not replace these patterns with
direct imports — the module graph will load with `undefined` references.

### SDK IIFE and SRI integrity hash

All 10 HTML files pin the SDK version with an SRI hash:

```html
<script src="https://cdn.jsdelivr.net/npm/@spaceis/sdk@0.1.4/dist/spaceis.global.js"
  integrity="sha384-..." crossorigin="anonymous"></script>
```

After every SDK release, update all HTML files from the monorepo root:

```bash
pnpm bump-sri <version>   # e.g. pnpm bump-sri 0.2.0
```

Never edit the `integrity` attribute manually — a hash mismatch silently
blocks the IIFE from loading.

### DOMPurify sanitisation

`page.html` and `statute.html` render raw HTML from the API. Both load
DOMPurify from CDN and call `DOMPurify.sanitize(value)` before assigning to
`innerHTML`. Do not add `innerHTML = apiValue` to other pages without a
sanitiser — `content` and `description` fields are stored XSS vectors.

### SHOP_CONFIG UUID placeholder

`shared/config.js` ships with `shopUuid: "your-shop-uuid-here"`. Consumers
replace this with the UUID from the SpaceIS admin panel. Do not commit a real
UUID to this repository.

## Common mistakes to avoid

- **Accessing `client` / `cartMgr` at top level of a per-page `<script>`**:
  the module has not run yet — both are `undefined`. Wrap in `spaceis:ready`.

- **Adding a function to `shared/` without registering it in `main.js`**:
  per-page scripts access globals via `window.*` — omitting the assignment
  causes `myFn is not defined` at runtime.

- **Running via `file://`**: ES modules require HTTP. Use `python -m http.server 3333`.

- **`innerHTML = page.content` without DOMPurify**: stored XSS. Use
  `DOMPurify.sanitize()` for any CMS field rendered as HTML.

- **Forgetting `pnpm bump-sri` after an SDK release**: stale SRI hash silently
  blocks the IIFE, breaking every page.

- **Passing raw quantity `1` to `client.cart.add()`**: the API expects
  thousandths (`1000`). Use `cartMgr.add(uuid, 1)` — `CartManager` converts
  automatically via `toApiQty()`.

- **Replacing `initCart()` / `setToggleCartCallback()` with top-level imports**:
  circular dep → `undefined` references at load time.

## Consumer integration

After downloading via `create-spaceis`:

1. Start HTTP server: `python -m http.server 3333` (or `npx serve .`)
2. Edit `shared/config.js` — set `shopUuid` from the SpaceIS admin panel
3. Open `http://localhost:3333/index.html`
4. Customise `styles.css` CSS variables and HTML files as needed

No npm install, no build step, no Node.js required at runtime.

## Build / commands

| Command | Purpose |
|---|---|
| `python -m http.server 3333` | Serve locally |
| `npx serve .` | Alternative HTTP server |
| `pnpm bump-sri <version>` | Update CDN version + SRI hash in all HTML files (monorepo root) |

No TypeScript, no test suite. Verify changes by opening pages in a browser.

## Reference

- API docs: https://docs.spaceis.app/api
- Repository: https://github.com/spaceis-app/spaceis-sdk
- npm: https://www.npmjs.com/package/@spaceis/sdk
- SDK guidance: `packages/sdk/AGENTS.md` or `node_modules/@spaceis/sdk/AGENTS.md`
- React bindings: `packages/react/AGENTS.md`
- Vue bindings: `packages/vue/AGENTS.md`
