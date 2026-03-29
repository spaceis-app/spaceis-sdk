"use client";

import { useCallback } from "react";
import { useSyncExternalStore } from "react";
import type { Cart, CartItem, CartMutationResponse } from "@spaceis/sdk";
import { useSpaceIS } from "../provider";

export interface UseCartReturn {
  // ── State ────────────────────────────────────────────────────────────────
  /** Current cart data. `null` before first load. */
  cart: Cart | null;
  /** Cart items array. Empty array when cart is not loaded. */
  items: CartItem[];
  /** Number of unique line-items in the cart. */
  itemCount: number;
  /** Total quantity of all items (human-readable: 1, 2, 3...). */
  totalQuantity: number;
  /** Final price in cents (after discounts). */
  finalPrice: number;
  /** Regular price in cents (before discounts). */
  regularPrice: number;
  /** Active discount, or `null` if none applied. */
  discount: Cart["discount"];
  /** `true` if a discount code is applied. */
  hasDiscount: boolean;
  /** `true` if cart has no items. */
  isEmpty: boolean;
  /** `true` while a network request is in progress. */
  isLoading: boolean;
  /** Last error from a cart operation, or `null`. */
  error: unknown;

  // ── Actions ──────────────────────────────────────────────────────────────
  /** Load/refresh cart from the server. */
  load: () => Promise<Cart>;
  /**
   * Add a variant to the cart.
   * @param variantUuid - Variant UUID
   * @param quantity - Human-readable quantity (default: 1)
   */
  add: (variantUuid: string, quantity?: number) => Promise<CartMutationResponse>;
  /**
   * Remove a variant from the cart.
   * @param variantUuid - Variant UUID
   * @param quantity - Number of items to remove (omit to remove all)
   */
  remove: (variantUuid: string, quantity?: number) => Promise<CartMutationResponse>;
  /** Increment quantity by one step. */
  increment: (variantUuid: string) => Promise<CartMutationResponse>;
  /** Decrement quantity by one step. Removes item if it would reach zero. */
  decrement: (variantUuid: string) => Promise<CartMutationResponse>;
  /**
   * Set exact quantity for a variant.
   * @param variantUuid - Variant UUID
   * @param quantity - Desired quantity (human-readable: 1, 2, 3...)
   */
  setQuantity: (variantUuid: string, quantity: number) => Promise<CartMutationResponse>;
  /** Apply a discount code. */
  applyDiscount: (code: string) => Promise<CartMutationResponse>;
  /** Remove the currently applied discount. */
  removeDiscount: () => Promise<CartMutationResponse>;
  /** Clear cart state locally. Does NOT call the API. */
  clear: () => void;

  // ── Helpers ──────────────────────────────────────────────────────────────
  /** Find a cart item by variant UUID, or `null` if not found. */
  findItem: (variantUuid: string) => CartItem | null;
  /** Check if a variant UUID is in the cart. */
  hasItem: (variantUuid: string) => boolean;
  /** Get human-readable quantity for a variant (0 if not in cart). */
  getQuantity: (variantUuid: string) => number;
  /**
   * Format a price in cents to a human-readable string.
   * @param cents - Amount in cents (defaults to `finalPrice`)
   * @param currency - Currency code (default: "PLN")
   * @param locale - Locale string (default: client lang or "pl")
   */
  formatPrice: (cents?: number, currency?: string, locale?: string) => string;
}

/**
 * Reactive cart hook. Subscribes to CartManager state changes and
 * provides actions for all cart operations.
 *
 * Uses `useSyncExternalStore` for safe concurrent rendering.
 *
 * @example
 * ```tsx
 * function CartButton() {
 *   const { itemCount, add, isLoading } = useCart();
 *
 *   return (
 *     <button disabled={isLoading} onClick={() => add('variant-uuid')}>
 *       Cart ({itemCount})
 *     </button>
 *   );
 * }
 * ```
 */
export function useCart(): UseCartReturn {
  const { cartManager } = useSpaceIS();

  // useSyncExternalStore integrates CartManager's observer pattern with React's
  // rendering model, ensuring tearing-free updates during concurrent rendering.
  useSyncExternalStore(
    // subscribe — CartManager.onChange returns the unsubscribe function directly
    useCallback(
      (onStoreChange: () => void) => {
        return cartManager.onChange(() => onStoreChange());
      },
      [cartManager]
    ),
    // getSnapshot — called synchronously by React to read current state
    () => cartManager.cart,
    // getServerSnapshot — during SSR the cart is always null (client-side only)
    () => null
  );

  return {
    // State
    cart: cartManager.cart,
    items: cartManager.items,
    itemCount: cartManager.itemCount,
    totalQuantity: cartManager.totalQuantity,
    finalPrice: cartManager.finalPrice,
    regularPrice: cartManager.regularPrice,
    discount: cartManager.discount,
    hasDiscount: cartManager.hasDiscount,
    isEmpty: cartManager.isEmpty,
    isLoading: cartManager.isLoading,
    error: cartManager.error,

    // Actions (bound to preserve `this`)
    load: cartManager.load.bind(cartManager),
    add: cartManager.add.bind(cartManager),
    remove: cartManager.remove.bind(cartManager),
    increment: cartManager.increment.bind(cartManager),
    decrement: cartManager.decrement.bind(cartManager),
    setQuantity: cartManager.setQuantity.bind(cartManager),
    applyDiscount: cartManager.applyDiscount.bind(cartManager),
    removeDiscount: cartManager.removeDiscount.bind(cartManager),
    clear: cartManager.clear.bind(cartManager),

    // Helpers (bound to preserve `this`)
    findItem: cartManager.findItem.bind(cartManager),
    hasItem: cartManager.hasItem.bind(cartManager),
    getQuantity: cartManager.getQuantity.bind(cartManager),
    formatPrice: cartManager.formatPrice.bind(cartManager),
  };
}
