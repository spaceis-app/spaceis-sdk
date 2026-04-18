"use client";

import Link from "next/link";
import { useCart } from "@spaceis/react";
import { fp } from "@/lib/helpers";
import { CartItemRow } from "@/features/cart/CartItemRow";
import { DiscountSection } from "@/features/cart/DiscountSection";

export function CartPage() {
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

  const discountAmount = regularPrice - finalPrice;

  if (isLoading) {
    return (
      <div className="container cart-container">
        <div className="spinner" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="container cart-container">
        <div className="empty-state">
          <div className="icon">&#128722;</div>
          <p>Your cart is empty.</p>
          <br />
          <Link href="/" className="back-link">
            &larr; Back to shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-container">
      <h1 className="cart-section-title">
        Your cart ({totalQuantity})
      </h1>

      <div className="cart-page-layout">
        {/* Left: items */}
        <div>
          {items.map((item) => (
            <CartItemRow key={item.variant?.uuid} item={item} layout="cart" />
          ))}
        </div>

        {/* Right: sidebar */}
        <div className="cart-page-sidebar">
          {/* Discount */}
          <DiscountSection />

          {/* Summary */}
          <div className="cart-page-summary">
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
          <div className="cart-page-actions">
            <Link href="/checkout" className="cart-page-checkout-btn">
              Proceed to checkout
            </Link>
            <Link href="/" className="cart-page-continue-btn">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
