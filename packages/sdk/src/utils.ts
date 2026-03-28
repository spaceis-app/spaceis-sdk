/**
 * SpaceIS SDK utilities.
 *
 * The API uses thousandths for quantities (1 item = 1000)
 * and cents for prices (1 PLN = 100).
 * These helpers convert to/from human-readable values.
 */

const QTY_MULTIPLIER = 1000;

// ── Quantity helpers ──

/**
 * Convert API quantity (thousandths) to display quantity.
 * API returns 1000 for 1 item, 2000 for 2 items, etc.
 *
 * @example
 * ```js
 * SpaceIS.fromApiQty(1000)  // → 1
 * SpaceIS.fromApiQty(2500)  // → 2.5
 * SpaceIS.fromApiQty(500)   // → 0.5
 * ```
 */
export function fromApiQty(apiQuantity: number): number {
  return apiQuantity / QTY_MULTIPLIER;
}

/**
 * Convert display quantity to API quantity (thousandths).
 *
 * @example
 * ```js
 * SpaceIS.toApiQty(1)    // → 1000
 * SpaceIS.toApiQty(2.5)  // → 2500
 * ```
 */
export function toApiQty(displayQuantity: number): number {
  return displayQuantity * QTY_MULTIPLIER;
}

// ── Price helpers ──

/**
 * Format price from cents to a human-readable currency string.
 *
 * @param cents - Price in cents (e.g. 1299 = 12.99)
 * @param currency - Currency code (default: "PLN")
 * @param locale - Locale for formatting (default: "pl")
 * @returns Formatted price string
 *
 * @example
 * ```js
 * SpaceIS.formatPrice(1299)              // → "12,99 zł"
 * SpaceIS.formatPrice(1299, 'EUR', 'de') // → "12,99 €"
 * SpaceIS.formatPrice(0)                 // → "0,00 zł"
 * ```
 */
export function formatPrice(cents: number, currency = "PLN", locale = "pl"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * Convert cents to decimal amount (e.g. 1299 → 12.99).
 *
 * @example
 * ```js
 * SpaceIS.centsToAmount(1299)  // → 12.99
 * SpaceIS.centsToAmount(100)   // → 1
 * SpaceIS.centsToAmount(50)    // → 0.5
 * ```
 */
export function centsToAmount(cents: number): number {
  return cents / 100;
}

// ── Cart item helpers ──

/**
 * Get the display image URL for a cart item.
 * Falls back: variant image → product image → null.
 */
export function getCartItemImage(item: {
  variant?: { image?: string | null } | null;
  shop_product?: { image?: string | null } | null;
}): string | null {
  return item.variant?.image || item.shop_product?.image || null;
}

/**
 * Get the display quantity of a cart item (human-readable).
 *
 * @example
 * ```js
 * // item.quantity = 2000 (API format)
 * SpaceIS.getItemQty(item)  // → 2
 * ```
 */
export function getItemQty(item: { quantity: number }): number {
  return fromApiQty(item.quantity);
}

// ── Product helpers ──

export interface ProductLimits {
  /** Minimum quantity (human-readable, e.g. 1) */
  min: number;
  /** Maximum quantity (human-readable, e.g. 64) */
  max: number;
  /** Quantity step (human-readable, e.g. 1) */
  step: number;
}

/**
 * Get human-readable quantity limits from a product.
 * Converts API thousandths to display values.
 *
 * @example
 * ```js
 * var product = await client.products.get('vip');
 * var limits = SpaceIS.getProductLimits(product);
 * // { min: 1, max: 64, step: 1 }
 * ```
 */
export function getProductLimits(product: {
  min_quantity?: number | null;
  max_quantity?: number | null;
  quantity_step?: number | null;
}): ProductLimits {
  return {
    min: fromApiQty(product.min_quantity ?? 1000),
    max: fromApiQty(product.max_quantity ?? 99000),
    step: fromApiQty(product.quantity_step ?? 1000),
  };
}

/**
 * Snap a quantity to the nearest valid value respecting min, max, and step.
 *
 * @param qty - Desired quantity (human-readable)
 * @param limits - Product limits from `getProductLimits()`
 * @returns Snapped quantity clamped to [min, max] and rounded to nearest step
 *
 * @example
 * ```js
 * const limits = { min: 1, max: 64, step: 2 };
 * snapQuantity(3, limits) // → 4
 * snapQuantity(0, limits) // → 1
 * snapQuantity(99, limits) // → 64
 * ```
 */
export function snapQuantity(qty: number, limits: ProductLimits): number {
  const { min, max, step } = limits;
  if (qty < min) return min;
  if (qty > max) return max;
  const snapped = Math.round((qty - min) / step) * step + min;
  return Math.max(min, Math.min(max, snapped));
}

// ── HTML helpers ──

/**
 * Escape HTML special characters to prevent XSS.
 *
 * @example
 * ```js
 * SpaceIS.escapeHtml('<script>alert("xss")</script>')
 * // → "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
 * ```
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}
