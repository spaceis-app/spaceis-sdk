# CLAUDE.md — SpaceIS SDK

## Overview

JavaScript SDK for the SpaceIS Minecraft shop platform. Zero runtime dependencies, works in browsers and Node.js.

## Architecture

```
src/
  index.ts          — Entry point, exports createSpaceIS()
  client.ts         — SpaceISClient class, initializes all modules
  http.ts           — Fetch wrapper with auth, lang, error handling
  error.ts          — SpaceISError class
  utils.ts          — Price formatting, qty conversion, HTML escape
  cart-manager.ts   — Reactive cart state with localStorage persistence
  modules/          — API endpoint modules (14 files)
    cart.ts, categories.ts, checkout.ts, content.ts,
    daily-rewards.ts, goals.ts, orders.ts, packages.ts,
    products.ts, rankings.ts, recaptcha.ts, sales.ts,
    shop.ts, vouchers.ts
  types/            — TypeScript interfaces (19 files)
```

## Key Concepts

- **Prices** are in **cents** (grosze). `formatPrice(2500)` → `"25,00 zł"`
- **Quantities** use **thousandths** in API. `toApiQty(1)` → `1000`, `fromApiQty(1000)` → `1`
- **CartManager** auto-persists cart token to localStorage, provides reactive `onChange()` callbacks
- **IIFE build** (`spaceis.global.js`) exposes `window.SpaceIS` for vanilla JS usage

## Build

```bash
pnpm build      # tsup → dist/ (ESM + CJS + IIFE + types)
pnpm dev         # watch mode
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest run
```

## Dual output

- **ESM/CJS**: `dist/index.js` / `dist/index.cjs` — for bundlers/Node.js
- **IIFE**: `dist/spaceis.global.js` — browser `<script>` tag, exposes `window.SpaceIS`

## Vanilla example

`examples/vanilla/` — complete store UI using only HTML + vanilla JS + the SDK.

Files:
- `shared.js` — shared logic (header, cart drawer, product modal, helpers)
- `styles.css` — all CSS
- `index.html` — products listing
- `packages.html` — package bundles
- `sales.html` — active sales
- `cart.html` — full cart page
- `checkout.html` — checkout with payment
- `order-summary.html` — order status
- `voucher.html` / `daily-reward.html` — redemption forms
- `page.html` / `statute.html` — CMS content

### Shared helpers in shared.js

Reusable functions to avoid duplication:
- `sanitizeHtml(container)` — DOM-based HTML sanitizer (strips event handlers, javascript: URLs, dangerous elements)
- `PLACEHOLDER_SVG_SM/MD/LG` — image placeholder constants
- `getVariantLimits(uuid)` — cached product qty limits
- `handleQtyStepperClick(e)` — unified +/- click handler
- `handleQtyInputChange(e)` — unified qty input change (validates min/max/step)
- `renderDiscountSection(el, opts)` — discount code UI
- `renderCartSummary(el, opts)` — subtotal/discount/total panel

## Testing

Tests use vitest. Test files in `src/__tests__/*.test.ts`.

```bash
pnpm test        # run once
pnpm test:watch  # watch mode
```
