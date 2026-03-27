import type { RequestFn } from "../http";
import type {
  TopCustomer,
  LatestOrder,
  GetTopCustomersParams,
  GetLatestOrdersParams,
} from "../types";

/**
 * Rankings API module.
 *
 * Retrieves leaderboards — top customers by total spending
 * and latest purchases for social proof.
 *
 * @example
 * ```ts
 * const top10 = await client.rankings.top({ limit: 10 });
 * const recent = await client.rankings.latest({ limit: 5 });
 * ```
 */
export class RankingsModule {
  /** @internal */
  constructor(private request: RequestFn) {}

  /**
   * Get top customers ranking by total spending.
   *
   * @param params - Optional limit, page, and sort options
   * @returns Array of top customers with username and total amount
   */
  async top(params?: GetTopCustomersParams): Promise<TopCustomer[]> {
    const res = await this.request<{ data: TopCustomer[] }>("customer-rankings/top", { params });
    return res.data;
  }

  /**
   * Get the latest orders/purchases for social proof.
   *
   * @param params - Optional limit and sort options
   * @returns Array of recent orders with username and product info
   */
  async latest(params?: GetLatestOrdersParams): Promise<LatestOrder[]> {
    const res = await this.request<{ data: LatestOrder[] }>("customer-rankings/latest", { params });
    return res.data;
  }
}
