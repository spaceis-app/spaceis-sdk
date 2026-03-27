import type { RequestFn } from "../http";
import type {
  IndexShopProduct,
  ShowShopProduct,
  PackageRecommendation,
  PaginatedResponse,
  GetProductsParams,
} from "../types";

/**
 * Products API module.
 *
 * Provides methods to browse the shop catalog — listing, detail view,
 * and package recommendations for a given product.
 *
 * @example
 * ```ts
 * const products = await client.products.list({ page: 1, category_slug: 'vip' });
 * const product  = await client.products.get('vip-rank');
 * const recs     = await client.products.recommendations('vip-rank');
 * ```
 */
export class ProductsModule {
  /** @internal */
  constructor(private request: RequestFn) {}

  /**
   * Get a paginated list of products.
   *
   * @param params - Optional filters (page, category, sale, etc.)
   * @returns Paginated response with product data and pagination metadata
   *
   * @example
   * ```ts
   * // All products, page 1
   * const page1 = await client.products.list({ page: 1 });
   *
   * // Products in a specific category
   * const vip = await client.products.list({ category_slug: 'vip' });
   * ```
   */
  async list(params?: GetProductsParams): Promise<PaginatedResponse<IndexShopProduct>> {
    return this.request("products", { params });
  }

  /**
   * Get full product details by slug or UUID.
   *
   * Returns extended product data including variants, description,
   * images, quantity limits, and related information.
   *
   * @param slugOrUuid - Product slug (e.g. `"vip-rank"`) or UUID
   * @returns Full product details
   *
   * @example
   * ```ts
   * const product = await client.products.get('vip-rank');
   * console.log(product.name, product.variants);
   * ```
   */
  async get(slugOrUuid: string): Promise<ShowShopProduct> {
    const res = await this.request<{ data: ShowShopProduct }>(
      `products/${encodeURIComponent(slugOrUuid)}`
    );
    return res.data;
  }

  /**
   * Get package recommendations for a product.
   *
   * Returns packages that contain this product, useful for
   * "save more with a bundle" upsell suggestions.
   *
   * @param slugOrUuid - Product slug or UUID
   * @returns Array of package recommendations
   */
  async recommendations(slugOrUuid: string): Promise<PackageRecommendation[]> {
    const res = await this.request<{ data: PackageRecommendation[] }>(
      `products/${encodeURIComponent(slugOrUuid)}/package-recommendations`
    );
    return res.data;
  }
}
