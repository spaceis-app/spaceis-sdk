/** Available payment method types */
export type PaymentMethodType =
  | "online_payments"
  | "direct_billing"
  | "paysafecard"
  | "paypal"
  | "blik_level_0"
  | "cash"
  | "game_hosting";

/** Payment method available for checkout */
export interface PaymentMethod {
  /** Unique identifier */
  uuid: string;
  /** Display name (e.g. `"PayPal"`, `"BLIK"`) */
  name: string;
  /** Commission percentage added to the order total (e.g. `5` = 5%) */
  commission: number;
  /** Payment method type identifier */
  method: PaymentMethodType;
}

/** Agreement/consent required during checkout */
export interface Agreement {
  /** Unique identifier */
  uuid: string;
  /** Agreement title */
  name: string;
  /**
   * Agreement body (raw HTML from API).
   *
   * @remarks
   * Sanitize before injecting into the DOM (e.g. with DOMPurify) or render
   * as escaped text via {@link escapeHtml}. Do NOT assign directly to
   * `innerHTML` on untrusted content — risk of stored XSS.
   */
  content: string;
}

/**
 * Request body for placing an order.
 *
 * @example
 * ```ts
 * await client.checkout.placeOrder({
 *   email: 'player@example.com',
 *   first_name: 'Steve',
 *   payment_method_uuid: 'pm-uuid',
 *   'g-recaptcha-response': recaptchaToken,
 *   agreements: ['agreement-uuid-1'],
 * });
 * ```
 */
export interface CheckoutRequest {
  /** Customer email for order confirmation */
  email: string;
  /** Minecraft username */
  first_name: string;
  /** UUID of the selected payment method */
  payment_method_uuid: string;
  /** BLIK code (6 digits) — required only for `blik_level_0` payment method */
  blik_code?: string | null;
  /** Language code for the order (e.g. `"pl"`, `"en"`) */
  lang?: string | null;
  /** reCAPTCHA v3 token */
  "g-recaptcha-response": string;
  /** URL to redirect the user to after a successful payment. The order code is appended as `?order=IS-XXX-XXX-XXX`. */
  return_url?: string | null;
  /** URL to redirect the user to if the payment is cancelled. Redirects to `cancel_url?order=` (empty order param). */
  cancel_url?: string | null;
  /** Array of accepted agreement UUIDs */
  agreements?: string[] | null;
}

/** Response from the checkout endpoint */
export interface CheckoutResponse {
  /** URL to redirect the user to for payment, or `null` for free orders */
  redirect_url: string | null;
}
