# CLAUDE.md — SpaceIS SDK

## Overview

JavaScript SDK for the SpaceIS shop platform. Zero runtime dependencies, works in browsers and Node.js.

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

## Examples

Examples live in `examples/` at the monorepo root (not inside packages/sdk):

- `examples/vanilla/` — complete store UI using only HTML + vanilla JS + the SDK
- `examples/react/` — Next.js App Router store using `@spaceis/react` hooks + SSR
- `examples/vue/` — Nuxt 4 store using `@spaceis/vue` composables + SSR
- `examples/php/` — PHP SSR store with client-side SDK for cart and interactivity

## Testing

Tests use vitest. Test files in `src/__tests__/*.test.ts`.

```bash
pnpm test        # run once
pnpm test:watch  # watch mode
```
