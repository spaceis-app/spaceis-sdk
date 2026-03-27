import type { RequestFn } from "../http";
import type { PaymentMethod, Agreement, CheckoutRequest, CheckoutResponse } from "../types";

/**
 * Checkout API module.
 *
 * Handles the checkout flow: fetching payment methods, required agreements,
 * and placing orders. After `placeOrder()`, redirect the user to the
 * returned payment URL.
 *
 * @example
 * ```ts
 * const methods = await client.checkout.paymentMethods();
 * const agreements = await client.checkout.agreements();
 * const result = await client.checkout.placeOrder({
 *   username: 'Steve',
 *   email: 'steve@example.com',
 *   payment_method_uuid: methods[0].uuid,
 *   agreements: agreements.map(a => a.uuid),
 * });
 * window.location.href = result.redirect_url;
 * ```
 */
export class CheckoutModule {
  /** @internal */
  constructor(private request: RequestFn) {}

  /**
   * Place an order and get the payment redirect URL.
   *
   * @param data - Checkout data (username, email, payment method, agreements, etc.)
   * @returns Response containing the redirect URL for payment
   * @throws {@link SpaceISError} with status 422 if validation fails
   */
  async placeOrder(data: CheckoutRequest): Promise<CheckoutResponse> {
    return this.request("cart/checkout", { method: "POST", body: data });
  }

  /**
   * Get all active payment methods available for checkout.
   *
   * @returns Array of payment methods with name, commission, and type
   */
  async paymentMethods(): Promise<PaymentMethod[]> {
    const res = await this.request<{ data: PaymentMethod[] }>("payment-methods", {
      params: { active: true },
    });
    return res.data;
  }

  /**
   * Get required agreements/consents that must be accepted during checkout.
   *
   * @returns Array of agreements with name and HTML content
   */
  async agreements(): Promise<Agreement[]> {
    const res = await this.request<{ data: Agreement[] }>("agreements");
    return res.data;
  }
}
