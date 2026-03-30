"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useCart,
  getItemQty,
  getCartItemImage,
} from "@spaceis/react";
import { fp, PlaceholderSVG, getErrorMessage } from "@/helpers";
import { QtyInput } from "@/components/QtyInput";
import { toast } from "sonner";

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
    increment,
    decrement,
    remove,
    setQuantity,
    applyDiscount,
    removeDiscount,
  } = useCart();
  const [discountCode, setDiscountCode] = useState("");

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
          {items.map((item) => {
            const variantUuid = item.variant?.uuid ?? "";
            const imgSrc = getCartItemImage(item);
            const displayQty = getItemQty(item);
            const showVariant =
              item.variant &&
              item.shop_product &&
              item.variant.name !== item.shop_product.name;

            return (
              <div key={variantUuid} className="cp-item">
                <div className="cp-item-img-wrap">
                  {imgSrc ? (
                    <img className="cp-item-img" src={imgSrc} alt="" />
                  ) : (
                    <div className="cp-item-img cp-item-img-ph">
                      <PlaceholderSVG size={28} />
                    </div>
                  )}
                </div>
                <div className="cp-item-body">
                  <div className="cp-item-top">
                    <div className="cp-item-info">
                      <div className="cp-item-name">
                        {item.shop_product?.name}
                      </div>
                      {showVariant && (
                        <div className="cp-item-variant">
                          {item.variant!.name}
                        </div>
                      )}
                      {item.package && (
                        <div className="cp-item-package">
                          Package: {item.package.name}
                        </div>
                      )}
                      <div className="cp-item-prices">
                        <span className="cp-item-price">
                          {fp(item.final_price_value)}
                        </span>
                        {item.regular_price_value !==
                          item.final_price_value && (
                          <span className="cp-item-price-old">
                            {fp(item.regular_price_value)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="cp-item-remove"
                      aria-label="Remove"
                      onClick={() => {
                        remove(variantUuid).catch((err) =>
                          toast.error(getErrorMessage(err))
                        );
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  <div className="cp-item-bottom">
                    <div className="qty-stepper">
                      <button
                        className="qty-step-btn"
                        onClick={() => {
                          decrement(variantUuid).catch((err) =>
                            toast.error(getErrorMessage(err))
                          );
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <QtyInput
                        value={displayQty}
                        slug={item.shop_product?.slug || item.shop_product?.uuid || ""}
                        onSet={(qty) => {
                          setQuantity(variantUuid, qty).catch((err) =>
                            toast.error(getErrorMessage(err))
                          );
                        }}
                      />
                      <button
                        className="qty-step-btn"
                        onClick={() => {
                          increment(variantUuid).catch((err) =>
                            toast.error(getErrorMessage(err))
                          );
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: sidebar */}
        <div className="cart-page-sidebar">
          {/* Discount */}
          {hasDiscount && discount ? (
            <div className="discount-active">
              <span>
                Code: <strong>{discount.code}</strong>
              </span>
              <span className="discount-active-pct">
                -{discount.percentage_discount}%
              </span>
              <button
                className="discount-remove"
                onClick={() => {
                  removeDiscount().catch((err) =>
                    toast.error(getErrorMessage(err))
                  );
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="discount-row">
              <input
                type="text"
                placeholder="Discount code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    const code = discountCode.trim();
                    if (!code) return;
                    try {
                      await applyDiscount(code);
                      toast.success("Discount applied!");
                      setDiscountCode("");
                    } catch (err) {
                      toast.error(getErrorMessage(err));
                    }
                  }
                }}
              />
              <button
                className="discount-apply"
                onClick={async () => {
                  const code = discountCode.trim();
                  if (!code) return;
                  try {
                    await applyDiscount(code);
                    toast.success("Discount applied!");
                    setDiscountCode("");
                  } catch (err) {
                    toast.error(getErrorMessage(err));
                  }
                }}
              >
                Apply
              </button>
            </div>
          )}

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
