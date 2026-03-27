import type { RequestFn } from "../http";
import type { Sale, PaginatedResponse, GetSalesParams } from "../types";

/**
 * Sales API module.
 *
 * Retrieves active sales and promotions. Each sale has a discount percentage
 * and optionally a time range.
 *
 * @example
 * ```ts
 * const sales = await client.sales.list({ sort: 'expires_at' });
 * sales.data.forEach(s => console.log(s.name, s.percentage_discount + '%'));
 * ```
 */
export class SalesModule {
  /** @internal */
  constructor(private request: RequestFn) {}

  /**
   * Get a paginated list of active sales/promotions.
   *
   * @param params - Optional sorting and pagination options
   * @returns Paginated response with sale data
   */
  async list(params?: GetSalesParams): Promise<PaginatedResponse<Sale>> {
    return this.request("sales", { params });
  }
}
