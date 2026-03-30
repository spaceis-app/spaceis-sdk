# CLAUDE.md — SpaceIS SDK Vue 3 / Nuxt 4 Example

## Overview

Complete Nuxt 4 storefront example using `@spaceis/vue` composables and `@spaceis/sdk`. Demonstrates SSR data fetching, client-only cart management, reCAPTCHA integration, and all shop features (products, packages, sales, checkout, vouchers, daily rewards, CMS pages).

## Structure

```
examples/vue/
├── nuxt.config.ts              — Nuxt configuration (runtimeConfig, CSS, fonts)
├── app.vue                     — Root app (NuxtLayout + NuxtPage)
├── layouts/
│   └── default.vue             — Header + main slot + CartDrawer + Footer + ToastContainer
├── pages/                      — File-based routing (Nuxt auto-routing)
│   ├── index.vue               — Products listing with categories, subcategories, pagination
│   ├── product/[slug].vue      — Product detail page (SEO via useSeoMeta)
│   ├── packages.vue            — Package bundles listing with categories
│   ├── sales.vue               — Active sales with countdown timers
│   ├── cart.vue                — Full cart page (client-only via <ClientOnly>)
│   ├── checkout.vue            — Checkout form + cart items (client-only)
│   ├── voucher.vue             — Voucher code redemption (reCAPTCHA)
│   ├── daily-reward.vue        — Daily reward claim (reCAPTCHA)
│   ├── order/[code].vue        — Order summary lookup
│   ├── page/index.vue          — CMS pages list
│   ├── page/[slug].vue         — Single CMS page
│   └── statute.vue             — Shop terms/statute
├─��� components/                 — Auto-imported Vue components
│   ├── AppHeader.vue           — Navigation + mobile menu + cart badge
│   ├── AppFooter.vue           — Footer
│   ├── AppPagination.vue       — Pagination controls
│   ├── CartDrawer.client.vue   — Slide-in cart drawer with discount + summary
│   ├── CartContent.client.vue  — Cart page content (client-only)
│   ├── CheckoutContent.client.vue — Checkout page content (client-only)
│   ├── OrderContent.client.vue — Order summary content (client-only)
│   ├── VoucherContent.client.vue — Voucher form content (client-only)
│   ├── DailyRewardContent.client.vue — Daily reward form content (client-only)
│   ├── ProductCard.vue         — Product card for grids
│   ├── ProductGridSkeleton.vue — Loading skeleton for product grids
│   ├── SaleCard.vue            — Sale card with countdown timer
│   ├── QtyInput.vue            ��� Quantity input with product limits
│   ├── Recommendations.vue     — Product recommendations section
│   ├── CommunitySection.vue    — Top customers, latest orders, goals
│   ├── PlaceholderSvg.vue      — Placeholder image SVG
│   └── ToastContainer.vue      — Toast notification renderer
├─�� composables/                — Auto-imported composables
│   ├── useCartDrawer.ts        — Cart drawer open/close state (useState)
│   └── useToast.ts             — Simple toast notification system
├── plugins/
│   └── spaceis.ts              — SpaceIS plugin (SSR + client, CartManager client-only)
├── server/
│   └── utils/spaceis.ts        — Server-side SpaceIS client factory
├── utils/
│   └── helpers.ts              — fp(), esc(), getErrorMessage()
├── assets/
│   └── styles.css              — All styles (shared with React example)
├── error.vue                   — Custom error/404 page
├── package.json
├── tsconfig.json
└── .env.example
```

## Architecture

### Plugin Setup

The SpaceIS plugin runs on both SSR and client (`plugins/spaceis.ts`). CartManager is created only on client. It sets up:
- TanStack Vue Query (`VueQueryPlugin`) for data fetching/caching
- SpaceIS context (`provide/inject`) with the SDK client and CartManager
- Cart auto-loading from localStorage

```ts
// plugins/spaceis.ts
import { SpaceISPlugin } from '@spaceis/vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(SpaceISPlugin, {
    config: {
      baseUrl: useRuntimeConfig().public.spaceisApiUrl as string,
      shopUuid: useRuntimeConfig().public.spaceisShopUuid as string,
      lang: 'pl',
    },
    cartOptions: { autoLoad: true },
  });
});
```

### Server-Side Client

For SSR data fetching that needs to happen outside the Vue plugin context (e.g., in Nuxt server routes or `useAsyncData`), use `useServerSpaceIS()` from `server/utils/spaceis.ts`. This creates a plain `@spaceis/sdk` client without cart/query functionality.

### Data Fetching Patterns

**SSR-compatible pages** (products, packages, sales, CMS pages, statute) use `@spaceis/vue` composables directly. The composables use TanStack Vue Query which handles SSR hydration when the plugin is installed.

**Client-only pages** (cart, checkout, voucher, daily-reward, order) delegate to `.client.vue` components because they depend on:
- `useCart()` which requires localStorage (cart token persistence)
- `useRecaptcha()` which requires the browser environment
- `useSpaceIS()` which is only available after the client plugin installs

### Composables

All composables in `composables/` are auto-imported by Nuxt:

- **`useCartDrawer()`** — SSR-safe shared state via `useState` for cart drawer open/close
- **`useToast()`** — SSR-safe toast system via `useState` with auto-dismiss (3.5s)

### Components

All components in `components/` are auto-imported by Nuxt. Key patterns:

- **`CartDrawer.client.vue`** — uses `useCart()` for reactive cart data and actions
- **`QtyInput.vue`** — fetches product limits via `useProduct()` to validate quantity
- **`Recommendations.vue`** — uses `useProductRecommendations()` composable
- **`CommunitySection.vue`** — uses `useTopCustomers()`, `useLatestOrders()`, `useGoals()`
- **`SaleCard.vue`** — client-side countdown timer with `setInterval`

### Toast System

Simple toast notifications without external dependencies:

```ts
// composables/useToast.ts — shared reactive state
const { success, error } = useToast();
success('Added to cart!');
error('Something went wrong');
```

`ToastContainer.vue` renders toasts using `<Teleport to="body">` with CSS transitions. Mounted in the default layout.

### SEO

- `useHead({ title })` for page titles
- `useSeoMeta()` for Open Graph / description (product detail page)
- API HTML content rendered directly via `v-html` (backend sanitizes before saving)

### Error Handling

- `SpaceISError` from `@spaceis/vue` provides field-level validation errors
- `getErrorMessage()` helper extracts user-friendly messages
- Toast notifications for user-facing errors
- `error.vue` for 404 and server errors

## Key Differences from React Example

1. **Plugin vs Provider** — `app.use(SpaceISPlugin)` instead of `<SpaceISProvider>`
2. **File-based routing** — Nuxt pages in `pages/` instead of Next.js `app/` directory
3. **Auto-imports** — components and composables are auto-imported (no explicit imports needed)
4. **`.client.vue` suffix** — instead of `next/dynamic` with `ssr: false`
5. **`useToast()`** — instead of Sonner's `toast` (no external toast dependency)
6. **`v-html`** — instead of `dangerouslySetInnerHTML`
7. **`<Teleport>`** — instead of React portals
8. **`ref/computed/watch`** — instead of `useState/useMemo/useEffect`

## Commands

```bash
pnpm install    # Install dependencies
pnpm dev        # Start dev server (http://localhost:3000)
pnpm build      # Build for production
pnpm start      # Start production server
pnpm generate   # Generate static site
```

## Environment Variables

```env
NUXT_PUBLIC_SPACEIS_API_URL=https://storefront-api.spaceis.app
NUXT_PUBLIC_SPACEIS_SHOP_UUID=your-shop-uuid-here
```
