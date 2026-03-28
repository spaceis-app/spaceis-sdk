"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, getItemQty, getCartItemImage } from "@spaceis/react";
import { fp, PlaceholderSVG, getErrorMessage } from "../helpers";
import { useCartDrawer } from "../cart-drawer-context";
import { toast } from "sonner";

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
    increment,
    decrement,
    remove,
    applyDiscount,
    removeDiscount,
  } = useCart();

  const { isOpen, close } = useCartDrawer();
  const router = useRouter();

  const [discountCode, setDiscountCode] = useState("");

  const discountAmount = regularPrice - finalPrice;

  const handleApplyDiscount = async () => {
    const code = discountCode.trim();
    if (!code) return;
    try {
      await applyDiscount(code);
      toast.success("Discount applied!");
      setDiscountCode("");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Invalid code");
    }
  };

  const handleRemoveDiscount = async () => {
    try {
      await removeDiscount();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <div
        className={`overlay ${isOpen ? "open" : ""}`}
        onClick={close}
      />
      <div
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
              {items.map((item) => {
                const variantUuid = item.variant?.uuid ?? "";
                const imgSrc = getCartItemImage(item);
                const displayQty = getItemQty(item);
                const showVariant =
                  item.variant &&
                  item.shop_product &&
                  item.variant.name !== item.shop_product.name;

                return (
                  <li key={variantUuid} className="cart-item">
                    <div className="cart-item-img-wrap">
                      {imgSrc ? (
                        <img
                          className="cart-item-img"
                          src={imgSrc}
                          alt=""
                        />
                      ) : (
                        <div className="cart-item-img-placeholder">
                          <PlaceholderSVG size={24} />
                        </div>
                      )}
                    </div>
                    <div className="cart-item-details">
                      <div className="cart-item-top">
                        <div className="cart-item-info">
                          <div className="cart-item-name">
                            {item.shop_product?.name}
                          </div>
                          {showVariant && (
                            <div className="cart-item-variant">
                              {item.variant!.name}
                            </div>
                          )}
                          {item.package && (
                            <div className="cart-item-package">
                              Package: {item.package.name}
                            </div>
                          )}
                        </div>
                        <button
                          className="cart-item-remove"
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
                      <div className="cart-item-bottom">
                        <div className="cart-item-prices">
                          <span className="cart-item-price-current">
                            {fp(item.final_price_value)}
                          </span>
                          {item.regular_price_value !==
                            item.final_price_value && (
                            <span className="cart-item-price-old">
                              {fp(item.regular_price_value)}
                            </span>
                          )}
                        </div>
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
                          <input
                            className="qty-input"
                            type="number"
                            min="1"
                            value={displayQty}
                            readOnly
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
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!isEmpty && !isLoading && (
          <div className="drawer-footer">
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
                  onClick={handleRemoveDiscount}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplyDiscount();
                  }}
                />
                <button
                  className="discount-apply"
                  onClick={handleApplyDiscount}
                >
                  Apply
                </button>
              </div>
            )}

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
