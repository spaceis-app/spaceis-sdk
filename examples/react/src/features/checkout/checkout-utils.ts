/**
 * Payment method `commission` is a multiplier (e.g. `1.05` = 5% surcharge),
 * not a percent. Convert to an absolute fee in cents.
 *
 * @param base       Final cart price in cents (after discounts, before fee)
 * @param commission Multiplier from `PaymentMethod.commission` (1 = no fee)
 * @returns          Fee in cents, or 0 when commission is ≤ 1
 */
export function calcPaymentFee(base: number, commission: number): number {
  if (!commission || commission <= 1) return 0;
  return Math.round(base * commission - base);
}

/**
 * Percent surcharge for UI rendering — e.g. `1.2` → `20`.
 * Returns 0 when commission is not a real surcharge.
 */
export function commissionPercent(commission: number): number {
  if (!commission || commission <= 1) return 0;
  return Math.round((commission - 1) * 100);
}

/**
 * Guard against open-redirect / javascript:/data: URLs.
 * Relative URLs are resolved against `window.location.origin`.
 */
export function isSafeRedirect(url: unknown): url is string {
  if (typeof url !== "string" || url.length === 0) return false;
  try {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = new URL(url, origin);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
