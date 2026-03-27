import type { RequestFn } from "../http";
import type {
  Cart,
  CartMutationResponse,
  AddToCartRequest,
  RemoveFromCartRequest,
  UpdateCartItemRequest,
  PackageRecommendation,
} from "../types";

/**
 * Cart API module (low-level).
 *
 * Provides direct API calls for cart operations. For most use cases,
 * prefer {@link CartManager} (via `client.createCartManager()`) which adds
 * reactive state, auto-persistence, and quantity conversion.
 *
 * All quantities in this module use **raw API format** (thousandths: 1 item = 1000).
 *
 * @example
 * ```ts
 * const cart = await client.cart.get();
 * await client.cart.addItem({ variant_uuid: '...', quantity: 1000 });
 * await client.cart.applyDiscount('SUMMER20');
 * ```
 */
export class CartModule {
  /** @internal */
  constructor(private request: RequestFn) {}

  /**
   * Get the current cart contents.
   *
   * Requires a cart token to be set on the client (via `setCartToken()`
   * or the `cartToken` constructor option).
   *
   * @returns Current cart with items, prices, and discount info
   */
  async get(): Promise<Cart> {
    const res = await this.request<{ data: Cart }>("cart");
    return res.data;
  }

  /**
   * Add a product variant to the cart.
   *
   * @param data - Variant UUID and quantity (in API thousandths format)
   * @returns Updated cart state wrapped in a mutation response
   */
  async addItem(data: AddToCartRequest): Promise<CartMutationResponse> {
    return this.request("cart/cart-items/add-item", { method: "POST", body: data });
  }

  /**
   * Remove a variant from the cart or reduce its quantity.
   *
   * @param data - Variant UUID and optional quantity to remove (omit quantity to remove entirely)
   * @returns Updated cart state
   */
  async removeItem(data: RemoveFromCartRequest): Promise<CartMutationResponse> {
    return this.request("cart/cart-items/remove-item", { method: "POST", body: data });
  }

  /**
   * Set the exact quantity for a variant in the cart.
   *
   * @param data - Variant UUID and desired quantity (in API thousandths format)
   * @returns Updated cart state
   */
  async updateQuantity(data: UpdateCartItemRequest): Promise<CartMutationResponse> {
    return this.request("cart/cart-items/update-quantity", { method: "PATCH", body: data });
  }

  /**
   * Apply a discount or creator code to the cart.
   *
   * @param code - Discount code string (e.g. `"SUMMER20"`)
   * @returns Updated cart state with the discount applied
   * @throws {@link SpaceISError} with status 422 if the code is invalid
   */
  async applyDiscount(code: string): Promise<CartMutationResponse> {
    return this.request("cart/cart-discounts", { method: "POST", body: { code } });
  }

  /**
   * Remove the currently active discount from the cart.
   *
   * @returns Updated cart state without the discount
   */
  async removeDiscount(): Promise<CartMutationResponse> {
    return this.request("cart/cart-discounts", { method: "DELETE" });
  }

  /**
   * Get package recommendations based on current cart contents.
   *
   * @returns Array of recommended packages
   */
  async recommendations(): Promise<PackageRecommendation[]> {
    const res = await this.request<{ data: PackageRecommendation[] }>(
      "cart/packages/recommendations"
    );
    return res.data;
  }
}
