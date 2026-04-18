# SpaceIS SDK — PHP SSR Example

Getting started with `@spaceis/sdk` (IIFE) and PHP server-side rendering — copy this example as a template
or follow the steps below to integrate SpaceIS into an existing PHP project.

> This file is both a human tutorial and reference for AI coding agents
> (Claude Code, Cursor, Codex, Copilot). Agents working in this folder
> should also consult the SDK-level agent guidance in `packages/sdk/AGENTS.md`.

---

A complete shop storefront built with PHP server-side rendering and the SpaceIS SDK IIFE for client-side interactivity.

## Requirements

- PHP 8.0 or higher
- `allow_url_fopen` enabled in php.ini (for `file_get_contents` to call the API)

## Security notes

- **`.env` / `.env.local` are for development only.** The built-in `php -S` server serves the project root as docroot, so these files are readable via `http://localhost:8080/.env`. When deploying behind Apache/Nginx, deny dotfile access:

  ```nginx
  # Nginx
  location ~ /\. { deny all; }
  ```

  ```apache
  # Apache .htaccess
  <FilesMatch "^\.">
      Require all denied
  </FilesMatch>
  ```

- **`SPACEIS_API_URL` is scheme-validated** (http/https only) in `includes/spaceis-api.php` to prevent SSRF via misconfigured env values.
- **Raw HTML content** (`page.content`, `statute.content`, `product.description`) is rendered inside `<template>` tags so scripts do not execute during parsing, then DOMPurify-sanitised client-side before being placed in the live DOM. DOMPurify is loaded from CDN with an SRI hash.
- **Inline `onclick=` handlers** are used throughout for pedagogical clarity. A strict `Content-Security-Policy` will block them — refactor to `addEventListener` if CSP hardening matters for your deployment.

## Setup

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Edit `.env` and set your shop UUID:

```
SPACEIS_API_URL=https://storefront-api.spaceis.app
SPACEIS_SHOP_UUID=your-shop-uuid-here
```

3. Start the PHP built-in server:

```bash
php -S localhost:8080
```

4. Open `http://localhost:8080/index.php` in your browser.

## Architecture

### Server-side (PHP)

Each page fetches data from the SpaceIS API using the `SpaceISApi` class (`includes/spaceis-api.php`) and renders HTML with the same CSS class names as the React example. This gives you:

- Fast initial page load with fully rendered HTML
- SEO-friendly content (products, categories, pages, statute)
- No JavaScript required for reading content

### Client-side (SDK IIFE)

Interactive features use the SpaceIS SDK loaded via CDN (`window.SpaceIS`):

- **Cart operations**: add, remove, increment, decrement items
- **Cart drawer**: slide-in cart panel with live updates
- **Quantity steppers**: +/- buttons on product and cart pages
- **Discount codes**: apply/remove in cart drawer and checkout
- **Voucher redemption**: form submission via SDK
- **Daily rewards**: claim via SDK
- **Order lookup**: fetch order details via SDK
- **Checkout**: place orders with payment method selection

### File Structure

```
index.php              — Products page (SSR)
product.php            — Product detail (SSR + client-side cart)
packages.php           — Packages page (SSR)
sales.php              — Sales page (SSR + countdown timers)
cart.php               — Cart page (client-side)
checkout.php           — Checkout (SSR payment methods + client-side)
voucher.php            — Voucher form (client-side + reCAPTCHA)
daily-reward.php       — Daily reward form (client-side + reCAPTCHA)
order.php              — Order summary lookup (client-side)
page.php               — CMS pages (SSR + DOMPurify-sanitised content)
statute.php            — Statute page (SSR + DOMPurify-sanitised content)
styles.css             — Shared stylesheet
includes/
  spaceis-api.php      — PHP API client class (retry + SSRF guard + lastFailed flag)
  helpers.php          — Price formatting, HTML escaping, utilities
  header.php           — Shared header (nav, cart icon, mobile menu, optional DOMPurify)
  footer.php           — Footer HTML + SDK CDN + SpaceIS config JSON + ES-module loader
  community.php        — Community section partial (top customers, orders, goals)
  js/                  — Each file is a browser-loaded ES module
    app.js             — Entry: SDK init, SpaceISApp global, spaceis:ready dispatch
    format.js          — fp(), esc(), getErrorMessage(), placeholderSvg()
    toast.js           — showToast()
    mobile-menu.js     — toggleMobileMenu(), closeMobileMenu()
    badge.js           — updateBadge(), initBadge(cart)
    cart-ops.js        — addToCart, removeItem, inc/dec, setItemQty, discount ops
    cart-drawer.js     — renderDrawer() with incremental patching, open/close
```

Per-page PHP scripts access SDK state via the `window.SpaceISApp` global
(client, cart, fp, esc, showToast, addToCart, …). Top-level code that
touches the global must wait for the `spaceis:ready` event — the ES
module is deferred and runs after per-page inline scripts.

## Customization

- **Shop UUID**: Set `SPACEIS_SHOP_UUID` in `.env` — value comes from the SpaceIS admin panel
- **Styling**: Edit `styles.css` — uses CSS variables for easy theming
- **API URL**: Change `SPACEIS_API_URL` in `.env` for custom API endpoints (http/https only)
- **Language**: The API class sends `lang=pl` by default; change in `includes/spaceis-api.php`
- **SDK version**: pinned via CDN + SRI hash in `includes/footer.php`. Run `pnpm bump-sri <version>` from the monorepo root after an SDK release.
- **Client-side behaviour**: edit the ES modules in `includes/js/*.js`. Register any new exports on `window.SpaceISApp` in `app.js` so per-page PHP scripts can reach them.
