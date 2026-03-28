import { QueryClient } from "@tanstack/react-query";
import {
  createSpaceIS,
  type SpaceISClient,
  type SpaceISOptions,
  type GetProductsParams,
  type GetCategoriesParams,
  type GetPackagesParams,
  type GetSalesParams,
  type GetGoalsParams,
  type GetPagesParams,
} from "@spaceis/sdk";

// ── Server client factory ─────────────────────────────────────────────────────

/**
 * Create a server-side SpaceIS client for use in Next.js Server Components.
 *
 * Does NOT create a CartManager (cart is always client-side).
 * Does NOT set up any React context — use this only on the server.
 *
 * @example
 * ```tsx
 * // app/products/page.tsx (Server Component)
 * import { createServerClient, prefetchProducts, dehydrate, QueryClient } from '@spaceis/react/server';
 * import { HydrationBoundary } from '@tanstack/react-query';
 *
 * export default async function ProductsPage() {
 *   const client = createServerClient({ baseUrl: process.env.API_URL!, shopUuid: process.env.SHOP_UUID! });
 *   const qc = new QueryClient();
 *   await prefetchProducts(qc, client, { page: 1 });
 *
 *   return (
 *     <HydrationBoundary state={dehydrate(qc)}>
 *       <ProductList />
 *     </HydrationBoundary>
 *   );
 * }
 * ```
 */
export function createServerClient(options: SpaceISOptions): SpaceISClient {
  return createSpaceIS(options);
}

// ── Prefetch helpers ──────────────────────────────────────────────────────────

/**
 * Prefetch product list into a QueryClient for SSR hydration.
 * Query key matches `useProducts()` hook — data will be available immediately on the client.
 */
export async function prefetchProducts(
  qc: QueryClient,
  client: SpaceISClient,
  params?: GetProductsParams
): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "products", params] as const,
    queryFn: () => client.products.list(params),
  });
}

/**
 * Prefetch a single product by slug for SSR hydration.
 * Query key matches `useProduct(slug)` hook.
 */
export async function prefetchProduct(
  qc: QueryClient,
  client: SpaceISClient,
  slug: string
): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "product", slug] as const,
    queryFn: () => client.products.get(slug),
  });
}

/**
 * Prefetch product recommendations by slug for SSR hydration.
 * Query key matches `useProductRecommendations(slug)` hook.
 */
export async function prefetchProductRecommendations(
  qc: QueryClient,
  client: SpaceISClient,
  slug: string
): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "product-recommendations", slug] as const,
    queryFn: () => client.products.recommendations(slug),
  });
}

/**
 * Prefetch categories for SSR hydration.
 * Query key matches `useCategories(params)` hook.
 */
export async function prefetchCategories(
  qc: QueryClient,
  client: SpaceISClient,
  params?: GetCategoriesParams
): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "categories", params] as const,
    queryFn: () => client.categories.list(params),
  });
}

/**
 * Prefetch packages list for SSR hydration.
 * Query key matches `usePackages(params)` hook.
 */
export async function prefetchPackages(
  qc: QueryClient,
  client: SpaceISClient,
  params?: GetPackagesParams
): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "packages", params] as const,
    queryFn: () => client.packages.list(params),
  });
}

/**
 * Prefetch sales list for SSR hydration.
 * Query key matches `useSales(params)` hook.
 */
export async function prefetchSales(
  qc: QueryClient,
  client: SpaceISClient,
  params?: GetSalesParams
): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "sales", params] as const,
    queryFn: () => client.sales.list(params),
  });
}

/**
 * Prefetch goals list for SSR hydration.
 * Query key matches `useGoals(params)` hook.
 */
export async function prefetchGoals(
  qc: QueryClient,
  client: SpaceISClient,
  params?: GetGoalsParams
): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "goals", params] as const,
    queryFn: () => client.goals.list(params),
  });
}

/**
 * Prefetch the shop configuration for SSR hydration.
 * Query key matches `useShopConfig()` hook.
 */
export async function prefetchShopConfig(qc: QueryClient, client: SpaceISClient): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "shop-config"] as const,
    queryFn: () => client.shop.config(),
  });
}

/**
 * Prefetch CMS pages list for SSR hydration.
 * Query key matches `usePages(params)` hook.
 */
export async function prefetchPages(
  qc: QueryClient,
  client: SpaceISClient,
  params?: GetPagesParams
): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "pages", params] as const,
    queryFn: () => client.content.pages(params),
  });
}

/**
 * Prefetch a single CMS page for SSR hydration.
 * Query key matches `usePage(slug)` hook.
 */
export async function prefetchPage(
  qc: QueryClient,
  client: SpaceISClient,
  slug: string
): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "page", slug] as const,
    queryFn: () => client.content.page(slug),
  });
}

/**
 * Prefetch the shop statute for SSR hydration.
 * Query key matches `useStatute()` hook.
 */
export async function prefetchStatute(qc: QueryClient, client: SpaceISClient): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "statute"] as const,
    queryFn: () => client.content.statute(),
  });
}

// ── Re-exports for convenience ────────────────────────────────────────────────

/**
 * Re-exported from `@tanstack/react-query` for convenience.
 * Use `dehydrate(qc)` to serialize prefetched data for `<HydrationBoundary>`.
 */
export { dehydrate, QueryClient, HydrationBoundary } from "@tanstack/react-query";
