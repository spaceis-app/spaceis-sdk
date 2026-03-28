# CLAUDE.md — SpaceIS SDK Monorepo

## Overview

Monorepo for the SpaceIS shop platform SDK. Provides a JavaScript client library and React bindings for building storefronts.

- **API docs**: https://docs.spaceis.app/api#/
- **npm**: [`@spaceis/sdk`](https://www.npmjs.com/package/@spaceis/sdk), [`@spaceis/react`](https://www.npmjs.com/package/@spaceis/react)

## Monorepo Structure

```
├── examples/
│   ├── vanilla/          — Complete store using HTML + vanilla JS + SDK IIFE
│   ├── react/            — Next.js App Router store using @spaceis/react hooks + SSR
│   └── php/              — PHP SSR store with client-side SDK for cart
├── packages/
│   ├── sdk/              — Core JS SDK (zero dependencies)
│   │   ├── src/          — TypeScript source
│   │   └── CLAUDE.md     — SDK-specific AI context
│   └── react/            — React hooks + Provider + SSR helpers for Next.js
├── .github/
│   ├── workflows/ci.yml      — CI: build + typecheck + test (Node 20/22)
│   ├── workflows/publish.yml — Publish to npm on GitHub Release
│   └── ISSUE_TEMPLATE/       — Bug report + feature request forms
├── CHANGELOG.md
├── CONTRIBUTING.md
└── pnpm-workspace.yaml
```

## Commands

Run from root — applies to all packages:

```bash
pnpm install     # install deps
pnpm build       # build all packages (tsup → ESM + CJS + IIFE + types)
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest run (sdk + react)
pnpm dev         # watch mode
```

## Key Domain Concepts

- **Prices** are always in **cents** (grosze). 1299 = 12.99 PLN
- **Quantities** use **thousandths** in API. 1000 = 1 item, 2500 = 2.5 items
- **Cart token** — UUID stored in localStorage, identifies a cart session
- **Shop UUID** — identifies which shop the SDK connects to

## Package Details

### `@spaceis/sdk` (packages/sdk/)

Zero-dependency client for the SpaceIS storefront API. See `packages/sdk/CLAUDE.md` for architecture details.

Entry point: `createSpaceIS({ baseUrl, shopUuid })` → `SpaceISClient`

14 API modules: products, categories, cart, checkout, orders, content, sales, goals, packages, vouchers, dailyRewards, rankings, shop, recaptcha

Key classes:
- `SpaceISClient` — main client, holds all modules
- `CartManager` — reactive cart with localStorage persistence and onChange subscriptions
- `SpaceISError` — API errors with field-level validation

3 build outputs: ESM (`index.js`), CJS (`index.cjs`), IIFE (`spaceis.global.js` → `window.SpaceIS`)

### `@spaceis/react` (packages/react/)

React bindings using TanStack Query.

- `SpaceISProvider` — context provider with built-in QueryClient
- `useCart()` — reactive cart via `useSyncExternalStore`
- Data hooks: `useProducts`, `useProduct`, `useCategories`, `useCheckout`, etc.
- `@spaceis/react/server` — SSR prefetch helpers for Next.js

## Publishing

- Manual: `cd packages/sdk && pnpm publish --access public`
- Automatic: create a GitHub Release → `publish.yml` workflow runs
- Requires `NPM_TOKEN` secret in GitHub repo settings

## Conventions

- TypeScript strict mode
- JSDoc on all public APIs with `@example` blocks
- No runtime dependencies in `@spaceis/sdk`
- Vanilla examples use IIFE build (`window.SpaceIS`)
- All type definitions in `src/types/` directory, re-exported via barrel
