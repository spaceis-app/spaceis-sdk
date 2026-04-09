/** Possible order statuses */
export type OrderStatus = "pending" | "completed" | "cancelled";

/** Single item in the order summary */
export interface OrderSummaryItem {
  /** Item display title */
  title: string;
  /** Optional subtitle (e.g. variant name) */
  subtitle?: string | null;
  /** Item image URL, or `null` */
  image?: string | null;
  /** Regular price in cents (before discounts) */
  regular_price: number;
  /** Final price in cents (after discounts) */
  final_price: number;
  /** Quantity in API thousandths (1000 = 1 item) */
  quantity: number;
}

/** Discount information in the order summary */
export interface OrderDiscountInfo {
  /** Discount/creator code, or `null` */
  code: string | null;
  /** Total discounted amount in cents */
  totalDiscountedValue: number;
}

/**
 * Raw order summary shape from the API.
 * `items` may be a single object or an array — use `OrderSummary` for the normalized version.
 * @internal
 */
export interface RawOrderSummary {
  /** Unique order code (e.g. `"ORD-12345"`) */
  code: string | null;
  /** Current order status */
  status: OrderStatus;
  /** Total regular price in cents */
  regular_total_price: number;
  /** Total final price in cents */
  final_total_price: number;
  /** Order items (may be single object or array from API) */
  items: OrderSummaryItem | OrderSummaryItem[];
  /** Discount info, or `null` if no discount was applied */
  discount: OrderDiscountInfo | null;
  /** Package discount info, or `null` */
  package_included: OrderDiscountInfo | null;
  /** Sale discount info, or `null` */
  sale: OrderDiscountInfo | null;
}

/**
 * Normalized order summary returned by `client.orders.summary()`.
 * `items` is always an array (normalized by the SDK).
 * Prices are in **cents**.
 */
export interface OrderSummary extends Omit<RawOrderSummary, "items"> {
  /** Order items (always an array — normalized by the SDK) */
  items: OrderSummaryItem[];
}
