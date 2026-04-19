import type { RequestFn } from "../http";
import type { OrderSummary } from "../types";
import type { RawOrderSummary } from "../types/order";

/**
 * Orders API module.
 *
 * Retrieves order summaries after checkout — use to display order
 * confirmation pages with status, items, and payment details.
 *
 * @example
 * ```ts
 * const order = await client.orders.summary('ORD-12345');
 * console.log(order.status); // "pending" | "completed" | "cancelled"
 * ```
 */
export class OrdersModule {
  /** @internal */
  constructor(private request: RequestFn) {}

  /**
   * Get order summary by order code.
   *
   * Normalizes `items` to always return an array (the API may return
   * a single object for single-item orders).
   *
   * @param orderCode - The unique order code (e.g. `"ORD-12345"`)
   * @returns Order summary with status, items, prices, and discount info
   */
  async summary(orderCode: string): Promise<OrderSummary> {
    const res = await this.request<{ data: RawOrderSummary }>(
      `cart/summary/${encodeURIComponent(orderCode)}`
    );
    const raw = res.data;
    // API may return items as single object or array — normalize (immutable)
    const items = Array.isArray(raw.items)
      ? raw.items
      : raw.items
        ? [raw.items]
        : [];
    return { ...raw, items };
  }
}
