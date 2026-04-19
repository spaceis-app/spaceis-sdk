"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@spaceis/react";
import { fp } from "@/lib/helpers";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { useCartDrawer } from "@/features/cart/cart-drawer-context";
import { CartItemRow } from "./CartItemRow";
import { DiscountSection } from "./DiscountSection";

export function CartDrawer() {
  const {
    items,
    totalQuantity,
    finalPrice,
    regularPrice,
    hasDiscount,
    discount,
    isEmpty,
    isLoading,
  } = useCart();

  const { isOpen, close } = useCartDrawer();
  const router = useRouter();
  const drawerRef = useFocusTrap<HTMLDivElement>(isOpen);

  const discountAmount = regularPrice - finalPrice;

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, close]);

  return (
    <>
      <div
        className={`overlay ${isOpen ? "open" : ""}`}
        onClick={close}
      />
      <div
        ref={drawerRef}
        className={`drawer ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
      >
        <div className="drawer-header">
          <span className="drawer-title">
            CART{totalQuantity > 0 ? ` (${totalQuantity})` : ""}
          </span>
          <button className="close-btn" onClick={close} aria-label="Close">
            &#10005;
          </button>
        </div>

        <div className="drawer-body">
          {isLoading ? (
            <div className="spinner" />
          ) : isEmpty ? (
            <div className="empty-state">
              <div className="icon">&#128722;</div>
              <p>Your cart is empty</p>
              <button
                className="cart-action-secondary"
                onClick={close}
                style={{ marginTop: 16 }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="cart-items-list">
              {items.map((item) => (
                <CartItemRow key={item.variant?.uuid} item={item} layout="drawer" />
              ))}
            </ul>
          )}
        </div>

        {!isEmpty && !isLoading && (
          <div className="drawer-footer">
            {/* Discount */}
            <DiscountSection />

            {/* Summary */}
            <div className="cart-summary-panel">
              <div className="cart-summary-header">
                Subtotal ({totalQuantity})
              </div>
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>{fp(regularPrice)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="cart-summary-row cart-summary-discount">
                  <span>
                    Discount
                    {hasDiscount && discount
                      ? ` (${discount.percentage_discount}%)`
                      : ""}
                  </span>
                  <span>-{fp(discountAmount)}</span>
                </div>
              )}
              <div className="cart-summary-total">
                <span>Total</span>
                <span>{fp(finalPrice)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="cart-actions">
              <button
                className="cart-action-primary"
                onClick={() => {
                  close();
                  router.push("/checkout");
                }}
              >
                Proceed to checkout <span style={{ marginLeft: 6 }}>&rarr;</span>
              </button>
              <button
                className="cart-action-secondary"
                onClick={() => {
                  close();
                  router.push("/cart");
                }}
              >
                View cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
