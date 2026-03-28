# CLAUDE.md — SpaceIS PHP Example

## Overview

Complete shop storefront using PHP server-side rendering and the SpaceIS SDK IIFE for client-side interactivity. Same visual design as the React/Next.js example.

## Architecture

- **PHP SSR**: Each page fetches data from SpaceIS API server-side and renders HTML
- **Client-side SDK**: IIFE build (`window.SpaceIS`) handles cart, quantity steppers, recaptcha, toasts
- **CartManager**: Created via `client.createCartManager({ autoLoad: true })` — reactive cart with localStorage persistence
- **No build step**: Plain PHP + JS, served with `php -S localhost:8080`

## Structure

```
includes/
  spaceis-api.php    — PHP API client (file_get_contents, .env config)
  helpers.php        — formatPrice, fromApiQty, escapeHtml, timeAgo, placeholderSvg
  header.php         — Shared HTML head + sticky header + nav + mobile menu
  footer.php         — Footer + SDK script + CartManager init + cart drawer JS + toast system
  community.php      — Reusable community section (top customers, latest orders, goals)
index.php            — Products (SSR: categories + products grid + community)
product.php          — Product detail (SSR: product + recommendations, client: variants, qty, add to cart)
packages.php         — Packages (SSR)
sales.php            — Sales with countdown timers (SSR + client-side timer)
cart.php             — Cart page (client-side rendering via CartManager)
checkout.php         — Checkout (SSR: payment methods + agreements, client: cart + form)
voucher.php          — Voucher redemption (client-side + recaptcha)
daily-reward.php     — Daily reward claim (client-side + recaptcha)
order.php            — Order summary lookup (client-side)
page.php             — CMS pages (SSR: list or single via ?slug=)
statute.php          — Terms/statute (SSR)
styles.css           — Same CSS as React example (identical classes)
```

## Commands

```bash
cp .env.example .env        # Configure shop UUID
php -S localhost:8080       # Start dev server
```

## Key Patterns

- **SSR pages** fetch data in PHP, render HTML with same CSS classes as React example
- **Client-only pages** (cart, checkout, order) render via JS innerHTML from CartManager state
- **SpaceISApp** global object exposes: client, cart, fp, esc, showToast, addToCart, removeItem, etc.
- **SpaceISApp is defined in two phases**: core (before onChange) and full (after all functions defined)
- **Qty inputs**: Editable `type="text" inputmode="numeric"`, validated on blur via `fetchProductLimits` + `SpaceIS.snapQuantity`
- **Toast notifications**: Custom toast system (not browser alerts), appended to body
- **reCAPTCHA**: Lazy-loaded via `client.recaptcha.execute()` on form submit
- **Subcategories**: Rendered server-side based on `?category_uuid=` query param
