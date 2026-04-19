/**
 * Product in list/index view.
 *
 * A lightweight representation used in product grids and listings.
 * For full product details (variants, description, limits), use
 * `client.products.get(slug)` which returns {@link ShowShopProduct}.
 */
export interface IndexShopProduct {
  /** Unique product identifier */
  uuid: string;
  /** Display name */
  name: string;
  /** URL-friendly slug (e.g. `"vip-rank"`) */
  slug: string;
  /** Product image URL, or `null` if no image is set */
  image: string | null;
  /** Active sale discount percentage, or `null` if not on sale */
  percentage_discount: number | null;
  /** Lowest variant price in cents (e.g. `1299` = 12.99 PLN) */
  minimal_price: number;
}

/**
 * Product variant with pricing details.
 *
 * Each product has one or more variants (e.g. "30 days", "90 days").
 * Prices are in **cents** (grosze).
 */
export interface ShowShopProductVariant {
  /** Unique variant identifier */
  uuid: string;
  /** Variant name (e.g. `"30 days"`, `"Permanent"`) */
  name: string;
  /** Variant-specific image URL, or `null` to use product image */
  image: string | null;
  /** Original price in cents (before any sale discount) */
  base_price: number;
  /** Current price in cents (after sale discount, if any) */
  price: number;
  /** Lowest price in the last 30 days (EU Omnibus Directive), or `null` */
  lowest_price_last_30_days: number | null;
}

/** Package info nested in product detail (when product belongs to a package) */
export interface ProductPackage {
  /** Package UUID */
  uuid: string;
  /** Package name */
  name: string;
}

/**
 * Full product detail view.
 *
 * Includes variants, description, quantity limits, and package association.
 * Quantity fields (`min_quantity`, `max_quantity`, `quantity_step`) are in
 * **API thousandths format** (1 item = 1000). Use {@link getProductLimits}
 * to convert to human-readable values.
 */
export interface ShowShopProduct {
  /** Unique product identifier */
  uuid: string;
  /** Display name */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /**
   * Product description (raw HTML from API), or `null`.
   *
   * @remarks
   * Sanitize before injecting into the DOM (e.g. with DOMPurify) or render
   * as escaped text via {@link escapeHtml}. Do NOT assign directly to
   * `innerHTML` on untrusted content — risk of stored XSS.
   */
  description: string | null;
  /** Product image URL, or `null` */
  image: string | null;
  /** Active sale discount percentage, or `null` */
  percentage_discount: number | null;
  /** Base price in cents (before sale discount) */
  base_price: number;
  /** Quantity step in API thousandths (e.g. `1000` = step of 1), or `null` for default */
  quantity_step: number | null;
  /** Minimum quantity in API thousandths, or `null` for default (1000 = 1) */
  min_quantity: number | null;
  /** Maximum quantity in API thousandths, or `null` for default */
  max_quantity: number | null;
  /**
   * Human-readable unit label for the product's quantity — e.g. `"szt"`
   * (pieces), `"dni"` (days), `"min"` (minutes), `"godz"` (hours). Used
   * for display only; the SDK does not interpret the value.
   */
  unit: string;
  /** Available variants with pricing */
  variants: ShowShopProductVariant[];
  /** Parent package if product belongs to one, or `null` */
  package: ProductPackage | null;
}

/**
 * Query parameters for the products list endpoint.
 *
 * @example
 * ```ts
 * // Filter by category
 * client.products.list({ category_slug: 'ranks', page: 2 });
 *
 * // Filter by sale
 * client.products.list({ sale_slug: 'summer-sale' });
 * ```
 */
export interface GetProductsParams {
  /** Page number for pagination */
  page?: number;
  /** Filter by category UUID */
  category_uuid?: string;
  /** Filter by category slug */
  category_slug?: string;
  /** Filter by sale UUID */
  sale_uuid?: string;
  /** Filter by sale slug */
  sale_slug?: string;
  /**
   * Additional query parameters forwarded to the API. Top-level keys take
   * precedence on name collision. Use for forward-compat with API fields
   * not yet reflected in the SDK types.
   */
  extraParams?: Record<string, unknown>;
}
