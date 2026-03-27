import type { RequestFn } from "../http";
import type { ShopCategory, GetCategoriesParams } from "../types";

/**
 * Categories API module.
 *
 * Retrieves the shop's category tree for navigation and filtering.
 *
 * @example
 * ```ts
 * const categories = await client.categories.list();
 * const active = await client.categories.list({ active: true });
 * ```
 */
export class CategoriesModule {
  /** @internal */
  constructor(private request: RequestFn) {}

  /**
   * Get all shop categories as a tree structure.
   *
   * Categories can be nested — each category may contain `children`.
   *
   * @param params - Optional filters (e.g. `{ active: true }`)
   * @returns Array of top-level categories (with nested children)
   */
  async list(params?: GetCategoriesParams): Promise<ShopCategory[]> {
    const res = await this.request<{ data: ShopCategory[] }>("categories", { params });
    return res.data;
  }
}
