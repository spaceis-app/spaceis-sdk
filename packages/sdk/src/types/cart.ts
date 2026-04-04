// ── Response types ──

/** Source of a cart discount — either a creator/affiliate code or a direct discount code */
export type CartDiscountSource = "creator_codes" | "discount_codes";

/** Variant included in a package bundle */
export interface IncludedVariant {
  uuid: string;
  name: string;
  /** Price in cents */
  price: number;
}

/** Product info attached to a cart item */
export interface CartItemShopProduct {
  uuid: string;
  name: string;
  slug: string;
  image: string | null;
  /** Price in cents */
  price: number;
}

/** Variant info attached to a cart item */
export interface CartItemVariant {
  uuid: string;
  name: string;
  image: string | null;
  /** Price in cents */
  price: number;
}

/** Package info when an item was added as part of a package */
export interface CartItemPackage {
  uuid: string;
  name: string;
  /** Variants included in this package */
  included_variants: IncludedVariant[];
}

/** Info about the package this item originated from */
export interface CartItemFromPackage {
  package_uuid: string;
  name: string;
  /** Price in cents */
  price: number;
}

/** Sale applied to a cart item */
export interface CartItemSale {
  name: string;
  /** Discount percentage (e.g. `20` = 20% off) */
  percentage_discount: number;
}

/**
 * A single item in the cart.
 *
 * Prices are in **cents**. Quantity is in **API thousandths** format
 * (1 item = 1000). Use {@link getItemQty} or {@link fromApiQty} to convert.
 */
export interface CartItem {
  /** The product this item refers to */
  shop_product: CartItemShopProduct;
  /** The specific variant added to the cart */
  variant: CartItemVariant;
  /** Package info if this item is part of a package bundle, or `null` */
  package: CartItemPackage | null;
  /** Info about the originating package, or `null` */
  from_package: CartItemFromPackage | null;
  /** Quantity in API thousandths (1000 = 1 item) */
  quantity: number;
  /** Active sale on this item, or `null` */
  cart_item_sale: CartItemSale | null;
  /** Regular unit price in cents (before discounts) */
  regular_price: number;
  /** Regular price * quantity in cents */
  regular_price_value: number;
  /** Final unit price in cents (after discounts, before commission) */
  final_price: number;
  /** Final price * quantity in cents */
  final_price_value: number;
}

/** Active discount applied to the entire cart */
export interface CartDiscount {
  /** The discount/creator code string */
  code: string;
  /** Discount percentage (e.g. `10` = 10% off) */
  percentage_discount: number;
  /** Whether this is a creator/affiliate code or a direct discount code */
  source: CartDiscountSource;
}

/**
 * Cart state returned by the API.
 *
 * Prices are in **cents**.
 */
export interface Cart {
  /** Items currently in the cart */
  items: CartItem[];
  /** Active discount, or `null` if no discount is applied */
  discount: CartDiscount | null;
  /** Total regular price in cents (before discounts) */
  regular_price: number;
  /** Total final price in cents (after discounts, before payment commission) */
  final_price: number;
}

/** Response from cart mutation endpoints (add, remove, update, discount) */
export interface CartMutationResponse {
  /** Success message from the server */
  message: string;
  /** Updated cart data */
  data: {
    cart: Cart;
  };
}

// ── Request types ──

/** Request body for adding an item to the cart */
export interface AddToCartRequest {
  /** UUID of the variant to add */
  variant_uuid: string;
  /** Quantity in API thousandths (1000 = 1 item). Omit for default (min_quantity). */
  quantity?: number | null;
}

/** Request body for removing an item from the cart */
export interface RemoveFromCartRequest {
  /** UUID of the variant to remove */
  variant_uuid: string;
  /** Quantity to remove in API thousandths. Omit to remove the entire item. */
  quantity?: number | null;
}

/** Request body for updating item quantity in the cart */
export interface UpdateCartItemRequest {
  /** UUID of the variant to update */
  variant_uuid: string;
  /** New quantity in API thousandths (1000 = 1 item) */
  quantity: number;
}

/** Request body for applying a discount code */
export interface ApplyDiscountRequest {
  /** Discount or creator code */
  code: string;
}
