# create-spaceis

[![npm](https://img.shields.io/npm/v/create-spaceis)](https://www.npmjs.com/package/create-spaceis)
[![license](https://img.shields.io/npm/l/create-spaceis)](./LICENSE)

Interactive CLI to quickly scaffold a **SpaceIS** storefront.

## Usage

```bash
# npm
npm create spaceis@latest

# pnpm
pnpm create spaceis@latest

# yarn
yarn create spaceis

# bun
bun create spaceis
```

## Modes

### Example — ready-made project

Copy a complete, working storefront and start customizing it.

```
◆  What do you want to do?
│  ● Example  → copy a ready-made project (React / Vue / Vanilla / PHP)
│  ○ Blank    → install SDK packages into an existing project

◆  Choose an example:
│  ● React     → Next.js App Router + SSR + hooks
│  ○ Vue       → Nuxt 4 + SSR + composables
│  ○ Vanilla   → HTML + vanilla JS + SDK IIFE
│  ○ PHP       → PHP SSR + client-side SDK
```

| Example     | Stack                                      | SSR | Build step |
| ----------- | ------------------------------------------ | --- | ---------- |
| **React**   | Next.js App Router + `@spaceis/react`      | Yes | Yes        |
| **Vue**     | Nuxt 4 + `@spaceis/vue`                    | Yes | Yes        |
| **Vanilla** | HTML + SDK IIFE (`window.SpaceIS`)         | No  | No         |
| **PHP**     | PHP + SDK IIFE on the client               | Yes | No         |

After choosing an example the CLI will:
1. Download the files from the GitHub repository
2. Ask whether to install dependencies
3. Show next steps

### Blank — install into an existing project

Install SpaceIS SDK packages into a project you already have.

```
◆  What do you want to do?
│  ○ Example  → copy a ready-made project (React / Vue / Vanilla / PHP)
│  ● Blank    → install SDK packages into an existing project

◆  Choose packages to install:
│  ◻ @spaceis/sdk    → Core SDK, zero dependencies, everywhere
│  ◻ @spaceis/react  → React hooks, Context Provider, Next.js SSR
│  ◻ @spaceis/vue    → Vue 3 composables, Plugin, Nuxt SSR
```

Multiselect — you can pick multiple packages at once (e.g. `@spaceis/sdk` + `@spaceis/react`).

If you select `@spaceis/react` or `@spaceis/vue` without `@spaceis/sdk`, the CLI will add it automatically.

The CLI auto-detects your package manager (`npm` / `pnpm` / `yarn` / `bun`) and runs the appropriate install command.

## Quick start after installation

```ts
import { createSpaceIS } from "@spaceis/sdk";

const spaceis = createSpaceIS({
  baseUrl: "https://your-shop.spaceis.app",
  shopUuid: "your-shop-uuid",
});

// Fetch products
const products = await spaceis.products.list();

// Reactive cart
const cart = spaceis.createCartManager();
await cart.addItem({ productId: 1, quantity: 1 });
```

## Related packages

| Package | Description |
| --- | --- |
| [`@spaceis/sdk`](https://www.npmjs.com/package/@spaceis/sdk) | Core SDK — zero dependencies |
| [`@spaceis/react`](https://www.npmjs.com/package/@spaceis/react) | React hooks + Provider + SSR (Next.js) |
| [`@spaceis/vue`](https://www.npmjs.com/package/@spaceis/vue) | Vue 3 composables + Plugin + SSR (Nuxt) |

## Links

- [SpaceIS API Docs](https://docs.spaceis.app/api)
- [GitHub — spaceis-sdk](https://github.com/spaceis-app/spaceis-sdk)
- [README (full SDK documentation)](https://github.com/spaceis-app/spaceis-sdk/blob/main/README.md)
- [SDK README](https://github.com/spaceis-app/spaceis-sdk/blob/main/packages/sdk/README.md)
- [React README](https://github.com/spaceis-app/spaceis-sdk/blob/main/packages/react/README.md)
- [Vue README](https://github.com/spaceis-app/spaceis-sdk/blob/main/packages/vue/README.md)

## Requirements

- Node.js >= 20

## License

MIT