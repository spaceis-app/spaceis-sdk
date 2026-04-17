# @spaceis/sdk — agent guidance

> Canonical instruction file for AI coding agents (Claude Code, Cursor,
> Codex, Copilot). Applies when working on this package OR when a consumer
> imports `@spaceis/sdk`.
>
> `CLAUDE.md` in this folder is a thin pointer to this file.

## Overview

Zero-dependency JavaScript SDK for the SpaceIS shop platform. Targets
browsers and Node.js ≥ 20. Three build outputs: ESM (`index.js`), CJS
(`index.cjs`), IIFE (`spaceis.global.js` → `window.SpaceIS`).

## Architecture

```
src/
  index.ts          — Entry point, exports createSpaceIS() factory
  client.ts         — SpaceISClient class, initialises all 14 modules
  http.ts           — Fetch wrapper with auth, lang, error handling, buildUrl
  error.ts          — SpaceISError class with field-level validation helpers
  utils.ts          — Price formatting, qty conversion, HTML escape, limits
  cart-manager.ts   — Reactive cart state with localStorage persistence
  modules/          — API endpoint modules (14 files, one per domain)
  types/            — TypeScript interfaces (17 files), barrel: types/index.ts
```

## Domain conventions — NEVER guess these

### Prices are in **cents** (grosze)
- `1299` = 12.99 PLN
- Display via `formatPrice(cents)` — returns a localised currency string
- Convert to decimal via `centsToAmount(cents)`
- Do NOT divide by 100 manually in app code

### Quantities are in **API thousandths**
- `1000` = 1 item, `2500` = 2.5 items
- Convert from display to API: `toApiQty(1)` → `1000`
- Convert from API to display: `fromApiQty(1000)` → `1`, or `getItemQty(item)`
- Respect `min_quantity` / `max_quantity` / `quantity_step` (all in thousandths)

### `ShowShopProduct.unit` (detail view only)
- Human-readable label: `"szt"` (pieces), `"dni"` (days), `"min"` (minutes), `"godz"` (hours)
- Display next to quantity inputs: `"+1 szt"`, `"-1 dni"`
- **Returned ONLY by `GET /products/{shopProduct}`** — NOT by list, cart, or order endpoints
- If you need it in cart/order UI, cache it when the user is on the product detail page

### Cart token
- UUID v4 stored in localStorage under `spaceis_cart_<shopUuid>`
- Auto-managed by `CartManager` — you should NOT set it manually unless restoring a session
- Created lazily on first mutation (`add` / `setQuantity` / …)
- SSR-safe: `CartManager.storage` getter guards missing `localStorage`

### Payment method commission is a **multiplier**, not a percentage
- `PaymentMethod.commission: number` is the multiplier applied to the base price
- Example: `commission = 1.2` × `base_price = 100 PLN` → `final = 120 PLN` (i.e. a 20% surcharge)
- To display as a percentage surcharge: `(commission - 1) * 100`
- Admin configures this per payment method in the SpaceIS panel

### HTML fields from the API
- `Agreement.content`, `ShopPage.content`, `Statute.content`, `ShowShopProduct.description`
  all contain raw HTML from the admin panel
- **Never** assign to `innerHTML` without sanitisation — risk of stored XSS
- Sanitise with DOMPurify (full) or escape with `escapeHtml()` (text context)

### Query parameters
- `GetProductsParams`, `GetCategoriesParams`, etc. accept known keys + an
  `extraParams?: Record<string, unknown>` field for forward-compat with
  undocumented API params
- Top-level keys win on collision with `extraParams`
- The SDK used to accept `[key: string]: unknown`; removed in 0.2.0 to
  catch typos like `categori_slug` at compile time

## Build / test / typecheck

```bash
pnpm build       # tsup → dist/ (ESM + CJS + IIFE + .d.ts)
pnpm dev         # watch mode
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest run
pnpm test:watch  # vitest in watch mode
```

Tests live in `src/__tests__/*.test.ts`. Run `pnpm -r test` from the monorepo
root for the whole tree.

## Public API surface

From `createSpaceIS({ baseUrl, shopUuid, ... })` you get a `SpaceISClient`
instance exposing 14 API modules: `products`, `categories`, `cart`,
`checkout`, `orders`, `content`, `sales`, `goals`, `packages`, `vouchers`,
`dailyRewards`, `rankings`, `shop`, `recaptcha`.

Reactive cart: `client.createCartManager()` → `CartManager` with
`onChange(fn)` subscription (returns unsubscribe) and getters
`isEmpty` / `totalQuantity` / `finalPrice` / `isLoading` / `error`.

Errors: every rejected promise is a `SpaceISError` with
`status`, `errors`, `fieldError(name)`, `allFieldErrors()`,
`isValidation` / `isNotFound` / `isRateLimited` getters.

## Common mistakes to avoid

- Passing `1` as an API quantity (should be `1000`) — always go through `toApiQty()`
- Rendering `product.description` via `innerHTML` without sanitisation (XSS)
- Writing `innerHTML = page.content` for CMS pages (same XSS vector)
- Calling `cart.load()` before a token exists — returns an empty cart, not an error
- Assuming `PaymentMethod.commission` is a percentage (it's a multiplier)
- Looking for `unit` in list/cart/order responses — only on product detail
- Calling `new CartManager(...)` directly — use `client.createCartManager()` instead
- Using `{ typoo: 'x' }` in query params after 0.2.0 — TS now rejects; use `extraParams`
- Mutating `cart.items` — immutable from consumer perspective; use
  `cart.add` / `remove` / `setQuantity` / `applyDiscount`

## Consumer integration (when working in a downstream project)

If you find `@spaceis/sdk` as a dependency:

1. Look at `node_modules/@spaceis/sdk/dist/index.d.ts` for the full type surface
2. Check if the project runs `npx @tanstack/intent install` — if yes, additional
   SKILL.md files are registered in the project's `AGENTS.md`
3. Prefer the framework bindings when available: `@spaceis/react` for React/Next.js,
   `@spaceis/vue` for Vue/Nuxt. They expose the same modules through hooks/composables
   with TanStack Query integration

## Examples

Live examples are in `examples/` at the monorepo root (not shipped in the
published tarball): `examples/react` (Next.js), `examples/vue` (Nuxt),
`examples/vanilla` (plain HTML + IIFE), `examples/php` (PHP SSR).

## Reference

- API docs: https://docs.spaceis.app/api
- Repository: https://github.com/spaceis-app/spaceis-sdk
- npm: https://www.npmjs.com/package/@spaceis/sdk
