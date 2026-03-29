import { QueryClient, dehydrate } from "@tanstack/vue-query";
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
  type GetTopCustomersParams,
  type GetLatestOrdersParams,
} from "@spaceis/sdk";

// ── Server client factory ─────────────────────────────────────────────────────

/**
 * Create a server-side SpaceIS client for use in Nuxt server routes or middleware.
 *
 * Does NOT create a CartManager (cart is always client-side).
 * Does NOT set up any Vue context — use this only on the server.
 *
 * @example
 * ```ts
 * // server/api/products.ts (Nuxt server route)
 * import { createServerClient, prefetchProducts } from '@spaceis/vue/server';
 * import { QueryClient, dehydrate } from '@spaceis/vue/server';
 *
 * export default defineEventHandler(async () => {
 *   const client = createServerClient({ baseUrl: process.env.API_URL!, shopUuid: process.env.SHOP_UUID! });
 *   const qc = new QueryClient();
 *   await prefetchProducts(qc, client, { page: 1 });
 *   return dehydrate(qc);
 * });
 * ```
 */
export function createServerClient(options: SpaceISOptions): SpaceISClient {
  return createSpaceIS(options);
}

// ── Prefetch helpers ──────────────────────────────────────────────────────────

/**
 * Prefetch product list into a QueryClient for SSR hydration.
 * Query key matches `useProducts()` composable — data will be available immediately on the client.
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
 * Query key matches `useProduct(slug)` composable.
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
 * Query key matches `useProductRecommendations(slug)` composable.
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
 * Query key matches `useCategories(params)` composable.
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
 * Query key matches `usePackages(params)` composable.
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
 * Query key matches `useSales(params)` composable.
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
 * Query key matches `useGoals(params)` composable.
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
 * Query key matches `useShopConfig()` composable.
 */
export async function prefetchShopConfig(qc: QueryClient, client: SpaceISClient): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "shop-config"] as const,
    queryFn: () => client.shop.config(),
  });
}

/**
 * Prefetch CMS pages list for SSR hydration.
 * Query key matches `usePages(params)` composable.
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
 * Query key matches `usePage(slug)` composable.
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
 * Query key matches `useStatute()` composable.
 */
export async function prefetchStatute(qc: QueryClient, client: SpaceISClient): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "statute"] as const,
    queryFn: () => client.content.statute(),
  });
}

/**
 * Prefetch top customers ranking for SSR hydration.
 * Query key matches `useTopCustomers(params)` composable.
 */
export async function prefetchTopCustomers(
  qc: QueryClient,
  client: SpaceISClient,
  params?: GetTopCustomersParams
): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "rankings", "top", params] as const,
    queryFn: () => client.rankings.top(params),
  });
}

/**
 * Prefetch latest orders ranking for SSR hydration.
 * Query key matches `useLatestOrders(params)` composable.
 */
export async function prefetchLatestOrders(
  qc: QueryClient,
  client: SpaceISClient,
  params?: GetLatestOrdersParams
): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "rankings", "latest", params] as const,
    queryFn: () => client.rankings.latest(params),
  });
}

/**
 * Prefetch available payment methods for SSR hydration.
 * Query key matches `usePaymentMethods()` composable.
 */
export async function prefetchPaymentMethods(qc: QueryClient, client: SpaceISClient): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "payment-methods"] as const,
    queryFn: () => client.checkout.paymentMethods(),
  });
}

/**
 * Prefetch checkout agreements for SSR hydration.
 * Query key matches `useAgreements()` composable.
 */
export async function prefetchAgreements(qc: QueryClient, client: SpaceISClient): Promise<void> {
  await qc.prefetchQuery({
    queryKey: ["spaceis", "agreements"] as const,
    queryFn: () => client.checkout.agreements(),
  });
}

// ── Re-exports for convenience ────────────────────────────────────────────────

/**
 * Re-exported from `@tanstack/vue-query` for convenience.
 * Use `dehydrate(qc)` to serialize prefetched data for hydration.
 */
export { dehydrate, QueryClient } from "@tanstack/vue-query";
