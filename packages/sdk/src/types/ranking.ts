/** Top customer in the spending leaderboard */
export interface TopCustomer {
  /** Minecraft username */
  first_name: string;
  /** Total number of orders placed */
  total_orders: number;
  /** Total unique items purchased */
  total_items: number;
  /** Total item quantity purchased (in API thousandths) */
  total_items_quantity: number;
  /** Total amount spent in cents */
  total_spent: number;
}

/** Recent order for the "latest purchases" feed */
export interface LatestOrder {
  /** Minecraft username of the buyer */
  first_name: string;
  /** Order completion date (ISO 8601) */
  completed_at: string;
}

/** Query parameters for the top customers endpoint */
export interface GetTopCustomersParams {
  /** Maximum number of results */
  limit?: number;
  /** Page number */
  page?: number;
  /** Sort field */
  sort?: string;
  /** Additional query parameters */
  [key: string]: unknown;
}

/** Query parameters for the latest orders endpoint */
export interface GetLatestOrdersParams {
  /** Maximum number of results */
  limit?: number;
  /** Sort field */
  sort?: string;
  /** Additional query parameters */
  [key: string]: unknown;
}
