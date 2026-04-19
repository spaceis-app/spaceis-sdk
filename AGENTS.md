# AGENTS.md — SpaceIS SDK Monorepo

Canonical agent-guidance for the monorepo root. Sub-packages and examples
have their own `AGENTS.md` — this file covers cross-cutting context.

## Overview

Monorepo for the SpaceIS shop-platform SDK. Provides a JavaScript client
library, React bindings, Vue bindings, and four fully-featured storefront
examples that double as integration tests and documentation.

- **API docs**: https://docs.spaceis.app/api#/
- **npm**: [`@spaceis/sdk`](https://www.npmjs.com/package/@spaceis/sdk),
  [`@spaceis/react`](https://www.npmjs.com/package/@spaceis/react),
  [`@spaceis/vue`](https://www.npmjs.com/package/@spaceis/vue)

## Repository layout

```
├── packages/                      — published to npm
│   ├── sdk/          AGENTS.md   — zero-dep client, 14 API modules, IIFE build
│   ├── react/        AGENTS.md   — TanStack Query hooks + Provider + SSR helpers
│   ├── vue/          AGENTS.md   — TanStack Vue Query composables + Plugin
│   └── create/                   — scaffolding CLI (`npm create spaceis`)
├── examples/                      — NOT in pnpm workspace (standalone installs)
│   ├── vanilla/      AGENTS.md   — HTML + JS modules + SDK IIFE
│   ├── php/          AGENTS.md   — PHP SSR + client-side SDK via IIFE
│   ├── react/        AGENTS.md   — Next.js 16 App Router
│   └── vue/          AGENTS.md   — Nuxt 4
├── .github/workflows/            — ci.yml (build + typecheck + test),
│                                    publish.yml (GitHub Release → npm)
├── CHANGELOG.md
├── CONTRIBUTING.md
└── pnpm-workspace.yaml           — only packages/* are workspace members
```

## Package manager

`pnpm@9.15.0` via corepack. `pnpm-workspace.yaml` includes only `packages/*`,
so `examples/*` must be installed standalone:

```bash
pnpm install                         # root + packages/*
pnpm -C examples/react i --ignore-workspace   # react example
pnpm -C examples/vue   i --ignore-workspace   # vue example
```

Do NOT introduce `package-lock.json` or `bun.lockb` in examples — they will
conflict with the pnpm-flavoured `node_modules/.pnpm/` symlink layout.

## Root commands (apply to `packages/*`)

```bash
pnpm build       # tsup across all packages → ESM + CJS + IIFE + .d.ts
pnpm typecheck   # tsc --noEmit per package
pnpm test        # vitest run (sdk + react + vue + create)
pnpm dev         # tsup watch mode
```

## Domain invariants

These show up everywhere — violate them and something downstream will break
silently.

- **Prices** are integers in **cents** (grosze). `1299` = `12.99 PLN`.
- **Quantities** in the API are **thousandths**. `1000` = 1 item,
  `2500` = 2.5 items. Use `fromApiQty()` / `toApiQty()` /
  `getItemQty(cartItem)` to convert.
- **`PaymentMethod.commission`** is a **multiplier**, NOT a percent.
  `1.05` means "+5 % surcharge". To compute fee in cents:
  `Math.round(base * commission - base)`. To render as percent:
  `Math.round((commission - 1) * 100)`. Only display when
  `commission > 1`.
- **`product.unit`** — human-readable unit label (e.g. `"szt"`, `"pkt"`,
  `"dni"`). Present on the product detail endpoint only; NOT on list/cart
  responses. Default fallback in UI: `"szt"`.
- **Cart token** — UUID in `localStorage`. Identifies a cart session, not a
  user account. Not a secret, but do not leak it into URLs.
- **Shop UUID** — identifies which shop the SDK talks to. Passed via
  `createSpaceIS({ shopUuid })` / `NUXT_PUBLIC_SPACEIS_SHOP_UUID` /
  `NEXT_PUBLIC_SPACEIS_SHOP_UUID`. Public by design — not a secret.

## Raw-HTML fields (XSS surface)

The API returns HTML in three fields: `product.description`,
`content.page.content`, `statute.content`. These are **not pre-sanitised** by
the backend. Examples sanitize on the client:

- **Vanilla / PHP** — DOMPurify loaded via CDN with SRI, wrapped in a
  `<template>` tag (scripts inside `<template>` are inert) then piped
  through `DOMPurify.sanitize()` before placement in the live DOM.
- **React** — `src/components/SafeHtml.tsx` wrapping `isomorphic-dompurify`.
- **Vue** — `v-html="sanitizedContent"` where `sanitizedContent` is a
  `computed()` running `DOMPurify.sanitize()` (also `isomorphic-dompurify`).

Never drop raw HTML into the DOM without one of these paths.

## Open-redirect guard

After `client.checkout.placeOrder()`, the server returns a `redirect_url` for
the payment gateway. All four examples guard it with an `http(s):` allow-list
before assigning to `window.location.href`. Helpers:

- React / Vue: `isSafeRedirect(url)` in `features/checkout/checkout-utils.ts`
  (react) / `utils/checkout-utils.ts` (vue).
- Vanilla: inline `URL` parse + protocol check.
- PHP: same inline check in `checkout.php`.

## Package boundaries

- `@spaceis/sdk` has **zero runtime dependencies**. Do not add any.
- `@spaceis/react` and `@spaceis/vue` depend on `@spaceis/sdk` + their
  respective TanStack Query flavour. Nothing else.
- Examples consume published `@spaceis/*` packages, not workspace paths.
  After bumping an SDK version, examples need a separate
  `package.json` bump (react/vue) or SRI hash update
  (vanilla/php — `pnpm bump-sri <version>` in root).

## Publishing

- Manual: `cd packages/<pkg> && pnpm publish --access public`.
- Automated: create a GitHub Release tagged `@spaceis/<pkg>@X.Y.Z` → the
  `publish.yml` workflow builds and publishes.
- Requires `NPM_TOKEN` secret in repo settings.

## Conventions

- TypeScript strict mode. No `any` in library code; examples accept narrow
  casts where published SDK dist types haven't caught up with source (flag
  each cast with a comment).
- JSDoc on all public APIs with `@example` blocks — shipped as `.d.ts`,
  surfaces in IDEs.
- All type definitions live in `packages/<pkg>/src/types/`, re-exported via
  a barrel `index.ts`.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`, `ci:`).
  Scope in parens for package/example: `feat(sdk):`, `fix(examples/react):`,
  `docs(react,vue):`. Enforced locally via Husky + commitlint
  (`@commitlint/config-conventional`) on `commit-msg`.
- Pre-commit hook runs `lint-staged` (ESLint `--fix` + Prettier) on staged
  files only — no full-repo build/test (that's CI).

## Where to read next

- `packages/sdk/AGENTS.md` — module surface, cart-manager invariants,
  testing strategy.
- `packages/react/AGENTS.md` — Provider lifetime, query-key conventions,
  SSR hydration pattern.
- `packages/vue/AGENTS.md` — plugin/provide-inject shape, composable set,
  Nuxt-specific patterns.
- `examples/<name>/AGENTS.md` — per-example conventions.
