/** Individual pagination link (prev/next/numbered page) */
export interface PaginationLink {
  /** Full URL for this page, or `null` for disabled links */
  url: string | null;
  /** Display label (e.g. `"1"`, `"2"`, `"Next"`, `"Previous"`) */
  label: string;
  /** Page number, or `null` for separator/label links */
  page?: number | null;
  /** Whether this is the currently active page */
  active: boolean;
}

/** Top-level pagination navigation links */
export interface PaginationLinks {
  /** URL to the first page */
  first: string | null;
  /** URL to the last page */
  last: string | null;
  /** URL to the previous page, or `null` on first page */
  prev: string | null;
  /** URL to the next page, or `null` on last page */
  next: string | null;
}

/** Pagination metadata */
export interface PaginationMeta {
  /** Current page number (1-based) */
  current_page: number;
  /** Index of the first item on this page, or `null` if empty */
  from: number | null;
  /** Total number of pages */
  last_page: number;
  /** Array of page links for building pagination UI */
  links: PaginationLink[];
  /** Base API path */
  path: string | null;
  /** Number of items per page */
  per_page: number;
  /** Index of the last item on this page, or `null` if empty */
  to: number | null;
  /** Total number of items across all pages */
  total: number;
}

/**
 * Paginated API response wrapper.
 *
 * @typeParam T - Type of items in the `data` array
 *
 * @example
 * ```ts
 * const response: PaginatedResponse<IndexShopProduct> = await client.products.list();
 * console.log(response.data);        // IndexShopProduct[]
 * console.log(response.meta.total);  // Total number of products
 * console.log(response.links.next);  // URL to next page
 * ```
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[];
  /** Navigation links (first, last, prev, next) */
  links: PaginationLinks;
  /** Pagination metadata (current page, total, per page, etc.) */
  meta: PaginationMeta;
}
