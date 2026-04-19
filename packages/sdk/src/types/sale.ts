/** Active sale/promotion with discount percentage and time range */
export interface Sale {
  /** Unique identifier */
  uuid: string;
  /** Sale display name */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** Sale banner image URL, or `null` */
  image: string | null;
  /** Discount percentage (e.g. `20` = 20% off) */
  percentage_discount: number;
  /** Sale start date (ISO 8601), or `null` for immediate */
  starts_at: string | null;
  /** Sale end date (ISO 8601), or `null` for no expiry */
  expires_at: string | null;
  /** Creation date (ISO 8601) */
  created_at: string;
}

/** Query parameters for the sales list endpoint */
export interface GetSalesParams {
  /** Sort field (e.g. `"expires_at"`, `"created_at"`) */
  sort?: string;
  /** Page number for pagination */
  page?: number;
  /** Number of items per page */
  per_page?: number;
  /**
   * Additional query parameters forwarded to the API. Top-level keys take
   * precedence on name collision. Use for forward-compat with API fields
   * not yet reflected in the SDK types.
   */
  extraParams?: Record<string, unknown>;
}
