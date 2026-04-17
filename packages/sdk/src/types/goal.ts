/**
 * Community goal with progress tracking.
 *
 * Goals represent shared funding targets that players contribute to
 * through their purchases.
 */
export interface Goal {
  /** Unique identifier */
  uuid: string;
  /** Goal display name */
  name: string;
  /** Target amount in cents, or `null` for no target */
  target: number | null;
  /** Collected amount in cents */
  collected: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Creation date (ISO 8601) */
  created_at: string;
}

/** Query parameters for the goals list endpoint */
export interface GetGoalsParams {
  /** Sort field */
  sort?: string;
  /** Number of items per page */
  per_page?: number;
  /**
   * Additional query parameters forwarded to the API. Top-level keys take
   * precedence on name collision. Use for forward-compat with API fields
   * not yet reflected in the SDK types.
   */
  extraParams?: Record<string, unknown>;
}
