# examples/php — agent guidance

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

Complete shop storefront built with PHP server-side rendering + the SpaceIS
SDK IIFE for client-side interactivity. No framework, no composer deps, no
build step. Same visual design as the React / Vue / vanilla examples.
Consumers download this template via `create-spaceis` as a starting point
for custom PHP storefronts.

## Architecture

```
examples/php/
├── index.php              — Products (SSR: categories + products + community)
├── product.php            — Product detail (SSR + client-side cart ops)
├── packages.php           — Packages listing (SSR)
├── sales.php              — Sales (SSR + client-side countdown timers)
├── cart.php               — Cart page (client-side render via SpaceISApp.cart)
├── checkout.php           — Checkout (SSR payment methods + client-side form)
├── voucher.php            — Voucher redemption (client-side + reCAPTCHA)
├── daily-reward.php       — Daily reward claim (client-side + reCAPTCHA)
├── order.php              — Order summary lookup (client-side)
├── page.php               — CMS pages (SSR + DOMPurify sanitised)
├── statute.php            — Shop terms / statute (SSR + DOMPurify sanitised)
├── includes/
│   ├── header.php         — Shared head + nav + mobile menu
│   ├── footer.php         — Footer HTML + SDK CDN + module loader
│   ├── spaceis-api.php    — PHP API client (file_get_contents + retry)
│   ├── helpers.php        — fp(), fromApiQty(), e(), timeAgo(), placeholderSvg()
│   ├── community.php      — Reusable community section partial
│   └── js/                — Each file is an ES module
│       ├── app.js         — Entry: SDK init, CartManager, SpaceISApp global, spaceis:ready
│       ├── format.js      — fp(), esc(), getErrorMessage(), placeholderSvg()
│       ├── toast.js       — showToast()
│       ├── mobile-menu.js — toggleMobileMenu(), closeMobileMenu()
│       ├── badge.js       — updateBadge(), initBadge(cart)
│       ├── cart-ops.js    — addToCart, removeItem, inc/dec, setItemQty, discount
│       └── cart-drawer.js — renderDrawer(), openDrawer(), closeDrawer()
└── styles.css
```

The SDK loads as an IIFE (`window.SpaceIS`) via a `<script src="cdn.jsdelivr.net/...">`
tag in `includes/footer.php`, followed by a `<script type="application/json"
id="spaceis-config">` config payload and `<script type="module" src="/includes/js/app.js">`.

## Commands

```bash
cp .env.example .env        # Configure shop UUID
php -S localhost:8080       # Start dev server
```

## Domain conventions — PHP-specific

### `.env` exposure via `php -S` docroot

The built-in server serves the project root as docroot, so `.env` /
`.env.local` are readable via `http://localhost:8080/.env`. Development-only.
For production (Apache/Nginx), deny dotfile access — see `README.md`.

### `spaceis:ready` — critical synchronisation point

`includes/footer.php` loads `includes/js/app.js` as `<script type="module">`,
which the browser defers automatically. Per-page `<script>` blocks in
`*.php` files run **before** the module finishes. `SpaceISApp.*` is
`undefined` at that point. `app.js` fires `spaceis:ready` after the global
is set:

```js
window.dispatchEvent(new CustomEvent("spaceis:ready", { detail: { client, cart } }));
```

Per-page top-level calls that touch `SpaceISApp` globals **must** wrap in:

```php
<script>
  window.addEventListener("spaceis:ready", () => {
    // SpaceISApp.client / SpaceISApp.cart are available here
  });
</script>
```

`onclick="SpaceISApp.addToCart(...)"` handlers are safe — they run only on
user interaction, which happens well after the module loads.

### `SpaceISApp` global — exposed by `includes/js/app.js`

| Key | Source |
|---|---|
| `client`, `cart` | SDK + CartManager |
| `fp`, `esc`, `getErrorMessage`, `placeholderSvg` | `format.js` |
| `showToast` | `toast.js` |
| `toggleDrawer`, `openDrawer`, `closeDrawer` | `cart-drawer.js` |
| `toggleMobileMenu`, `closeMobileMenu` | `mobile-menu.js` |
| `addToCart`, `removeItem`, `incrementItem`, `decrementItem` | `cart-ops.js` |
| `setItemQty`, `applyDrawerDiscount`, `removeDiscount` | `cart-ops.js` |

Any new function in `includes/js/` that per-page PHP scripts need **must**
be added to the `window.SpaceISApp = {...}` assignment in `app.js`.

### SDK config via JSON tag

`includes/footer.php` emits `<script type="application/json"
id="spaceis-config">` with `baseUrl` / `shopUuid` from `$api`. `app.js`
parses this on load. Do not read `getenv()` directly from any module — go
through `SpaceISApi` PHP class, which centralises validation (including
the SSRF scheme guard on `SPACEIS_API_URL`).

### SDK IIFE and SRI integrity hash

`includes/footer.php` pins the SDK CDN with an SRI hash. After every SDK
release, from the monorepo root:

```bash
pnpm bump-sri <version>   # e.g. pnpm bump-sri 0.2.0
```

Never edit the `integrity` attribute manually.

### DOMPurify sanitisation

`page.php`, `statute.php`, and `product.php` (for `product.description`)
render raw HTML from the API. Each wraps the raw content in an inert
`<template>` tag — **scripts inside a `<template>` do not execute during
HTML parsing** — and then uses DOMPurify client-side to sanitise before
injecting into the live DOM.

Pages that need DOMPurify set `$loadDOMPurify = true;` before requiring
`includes/header.php`; header.php conditionally loads the CDN script with
an SRI hash. Do not echo `<?= $x['content'] ?>` directly into a live DOM
container — if the admin panel is ever compromised, that is stored XSS.

### Commission is a multiplier, not a percent

API payment methods return `commission` as a **multiplier** (e.g. `1.2` =
20% surcharge). Compute fee amount via:

```js
const fee = commission > 1 ? Math.round(price * commission - price) : 0;
const displayPct = Math.round((commission - 1) * 100);
```

Never render `${commission}%` directly — that shows "1.2%" for a 20% fee.

### `product.unit` for qty steppers

API returns `unit` on products ("szt", "dni", "min"). Render it next to the
qty stepper on the PDP:

```php
<div class="pdp-qty-row">
    <div class="pdp-qty-stepper">...</div>
    <span class="qty-unit"><?= e($product['unit'] ?? 'szt') ?></span>
</div>
```

Cart drawer / cart page / checkout steppers do not show unit because cart
items don't carry `product.unit` in the current API payload — this is a
known limitation.

### Inline `onclick=` handlers

The example uses `onclick="SpaceISApp.method()"` throughout for
pedagogical clarity. A strict `Content-Security-Policy` will block these —
refactor to `addEventListener` if CSP hardening matters for your deployment.

## Common mistakes to avoid

- **Accessing `SpaceISApp` at top level of a per-page `<script>` IIFE**:
  the module has not run yet. Use `spaceis:ready` or put the call inside
  an event handler.

- **Adding a function to `includes/js/` without registering it in
  `SpaceISApp`**: per-page PHP scripts access it via the global — omitting
  the assignment in `app.js` produces `SpaceISApp.myFn is not a function`.

- **Echoing raw API HTML with `<?= $x['content'] ?>` directly into a live
  container**: stored XSS risk. Use the `<template>` + DOMPurify pattern
  from `page.php` / `statute.php` / `product.php`.

- **Treating `commission` as a percentage integer**: multiplier convention;
  see above.

- **Hardcoding `"pcs."` for unit labels**: use `$product['unit']`.

- **Passing raw quantity `1` to `SpaceISApp.cart.add()`**: the SDK layer
  converts, but the API expects thousandths. Use `cart.add(uuid, 1)` and
  let `CartManager` handle it.

- **Committing `.env` / `.env.local`**: `.gitignore` at the project root
  excludes them. Never force-stage.

- **Forgetting `pnpm bump-sri` after an SDK release**: stale SRI hash
  silently blocks the IIFE, breaking every page.

## Consumer integration

For a step-by-step tutorial, see [README.md](./README.md).

After downloading via `create-spaceis`:

1. Copy `.env.example` to `.env`, set `SPACEIS_SHOP_UUID`
2. Start dev server: `php -S localhost:8080`
3. Open `http://localhost:8080/index.php`
4. Customise `styles.css` and page templates as needed
5. Deploy behind Apache/Nginx — see `README.md` security notes

No composer, no npm, no build step. Requires PHP 8.0+ with `allow_url_fopen` enabled.

## Build / commands

| Command | Purpose |
|---|---|
| `php -S localhost:8080` | Serve locally (dev only) |
| `pnpm bump-sri <version>` | Update CDN version + SRI hash in footer.php (monorepo root) |

No TypeScript, no test suite. Verify changes by opening pages in a browser.

## Reference

- API docs: https://docs.spaceis.app/api
- Repository: https://github.com/spaceis-app/spaceis-sdk
- npm: https://www.npmjs.com/package/@spaceis/sdk
- SDK guidance: `packages/sdk/AGENTS.md` or `node_modules/@spaceis/sdk/AGENTS.md`
- Vanilla example: `examples/vanilla/AGENTS.md`
- React bindings: `packages/react/AGENTS.md`
- Vue bindings: `packages/vue/AGENTS.md`
