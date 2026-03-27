import type { RequestFn } from "../http";
import type { IndexPackage, PaginatedResponse, GetPackagesParams } from "../types";

/**
 * Packages API module.
 *
 * Retrieves product bundles/packages. Packages group multiple products
 * together, typically at a discounted price.
 *
 * @example
 * ```ts
 * const packages = await client.packages.list({ page: 1 });
 * packages.data.forEach(p => console.log(p.name, p.products.length, 'products'));
 * ```
 */
export class PackagesModule {
  /** @internal */
  constructor(private request: RequestFn) {}

  /**
   * Get a paginated list of packages (bundles).
   *
   * @param params - Optional filters and pagination (page, category, sale)
   * @returns Paginated response with package data
   */
  async list(params?: GetPackagesParams): Promise<PaginatedResponse<IndexPackage>> {
    return this.request("packages", { params });
  }
}
