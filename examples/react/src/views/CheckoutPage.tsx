"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  useCart,
  useCheckout,
  useRecaptcha,
  getItemQty,
  getCartItemImage,
} from "@spaceis/react";
import { fp, PlaceholderSVG, getErrorMessage } from "@/helpers";
import { QtyInput } from "@/components/QtyInput";
import { toast } from "sonner";

export function CheckoutPage() {
  const {
    items,
    totalQuantity,
    finalPrice,
    regularPrice,
    hasDiscount,
    discount,
    isEmpty,
    isLoading: cartLoading,
    increment,
    decrement,
    remove,
    setQuantity,
    applyDiscount,
    removeDiscount,
  } = useCart();
  const { methods, agreements, placeOrder } = useCheckout();
  const { execute: executeRecaptcha } = useRecaptcha();

  const [nick, setNick] = useState("");
  const [email, setEmail] = useState("");
  const [selectedMethodUuid, setSelectedMethodUuid] = useState<string | null>(
    null
  );
  const [checkedAgreements, setCheckedAgreements] = useState<Set<string>>(
    new Set()
  );
  const [discountCode, setDiscountCode] = useState("");

  // Auto-select first payment method
  useEffect(() => {
    if (methods.data && methods.data.length > 0 && !selectedMethodUuid) {
      setSelectedMethodUuid(methods.data[0].uuid);
    }
  }, [methods.data, selectedMethodUuid]);

  const selectedMethod = methods.data?.find(
    (m) => m.uuid === selectedMethodUuid
  );
  const commission = selectedMethod?.commission ?? 0;
  const commissionAmount =
    commission > 0 ? Math.round((finalPrice * commission) / 100) : 0;
  const totalWithCommission = finalPrice + commissionAmount;
  const discountAmount = regularPrice - finalPrice;

  const handlePlaceOrder = async () => {
    const errors: string[] = [];
    if (!nick.trim()) errors.push("Player nickname is required");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errors.push("Enter a valid email");
    if (!selectedMethodUuid) errors.push("Choose payment method");

    if (errors.length > 0) {
      errors.forEach((e) => toast.error(e));
      return;
    }

    try {
      const recaptchaToken = await executeRecaptcha("checkout");
      const result = await placeOrder.mutateAsync({
        email: email.trim(),
        first_name: nick.trim(),
        payment_method_uuid: selectedMethodUuid!,
        "g-recaptcha-response": recaptchaToken,
        agreements: Array.from(checkedAgreements),
        return_url: process.env.NEXT_PUBLIC_RETURN_URL || undefined,
        cancel_url: process.env.NEXT_PUBLIC_CANCEL_URL || undefined,
      });

      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (cartLoading) {
    return (
      <div className="container" style={{ padding: "60px 0" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="container">
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
    <div className="container">
      <div className="checkout-layout">
        {/* Left: Order summary */}
        <div>
          <h1 className="section-title">Order summary</h1>

          {/* Cart items */}
          <div>
            {items.map((item) => {
              const variantUuid = item.variant?.uuid ?? "";
              const imgSrc = getCartItemImage(item);
              const qty = getItemQty(item);
              const showVariant =
                item.variant &&
                item.shop_product &&
                item.variant.name !== item.shop_product.name;

              return (
                <div key={variantUuid} className="checkout-item">
                  {imgSrc ? (
                    <img
                      className="checkout-item-img"
                      src={imgSrc}
                      alt=""
                    />
                  ) : (
                    <div className="checkout-item-img-placeholder">
                      <PlaceholderSVG size={18} />
                    </div>
                  )}
                  <div className="checkout-item-details">
                    <div className="checkout-item-top">
                      <div className="checkout-item-info">
                        <div className="checkout-item-name">
                          {item.shop_product?.name}
                        </div>
                        {showVariant && (
                          <div className="checkout-item-variant">
                            {item.variant!.name}
                          </div>
                        )}
                        {item.package && (
                          <div className="checkout-item-package">
                            Package: {item.package.name}
                          </div>
                        )}
                      </div>
                      <button
                        className="checkout-item-remove"
                        aria-label="Remove"
                        onClick={() => {
                          remove(variantUuid).catch((err) =>
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
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                    <div className="checkout-item-bottom">
                      <div className="checkout-item-prices">
                        <span className="checkout-item-price">
                          {fp(item.final_price_value)}
                        </span>
                        {item.regular_price_value !==
                          item.final_price_value && (
                          <span className="checkout-item-old-price">
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
                        <QtyInput
                          value={qty}
                          slug={item.shop_product?.slug || item.shop_product?.uuid || ""}
                          onSet={(q) => {
                            setQuantity(variantUuid, q).catch((err) =>
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

          {/* Discount */}
          <div className="checkout-card">
            <div className="checkout-card-title">Discount code</div>
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
          </div>
        </div>

        {/* Right: Form */}
        <div className="checkout-form-col">
          <h1 className="section-title">Transaction details</h1>

          {/* Contact */}
          <div className="checkout-card">
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="checkout-nick">
                  Minecraft username
                </label>
                <input
                  type="text"
                  id="checkout-nick"
                  placeholder="Steve"
                  autoComplete="nickname"
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="checkout-email">
                  Email
                </label>
                <input
                  type="email"
                  id="checkout-email"
                  placeholder="you@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment methods */}
          <div className="checkout-card">
            <div className="checkout-card-title">Payment method</div>
            <div className="payment-methods">
              {methods.isLoading ? (
                <div className="spinner" />
              ) : methods.data && methods.data.length > 0 ? (
                methods.data.map((m) => (
                  <label
                    key={m.uuid}
                    className={`payment-method ${selectedMethodUuid === m.uuid ? "selected" : ""}`}
                    onClick={() => setSelectedMethodUuid(m.uuid)}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={m.uuid}
                      checked={selectedMethodUuid === m.uuid}
                      onChange={() => setSelectedMethodUuid(m.uuid)}
                    />
                    <span className="payment-method-name">{m.name}</span>
                    {m.commission ? (
                      <span className="payment-commission">
                        (+{m.commission}%)
                      </span>
                    ) : null}
                  </label>
                ))
              ) : (
                <p style={{ color: "var(--txt-3)", fontSize: 13 }}>
                  No payment methods available.
                </p>
              )}
            </div>
          </div>

          {/* Agreements */}
          {agreements.data && agreements.data.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="agreements">
                {agreements.data.map((a) => (
                  <label key={a.uuid} className="agreement-item">
                    <input
                      type="checkbox"
                      checked={checkedAgreements.has(a.uuid)}
                      onChange={(e) => {
                        setCheckedAgreements((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) {
                            next.add(a.uuid);
                          } else {
                            next.delete(a.uuid);
                          }
                          return next;
                        });
                      }}
                    />
                    <span>{a.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Price summary */}
          <div className="cart-page-summary">
            <div className="cart-summary-header">Order summary</div>
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
            {commission > 0 && selectedMethod && (
              <div className="cart-summary-row">
                <span>
                  Fee ({selectedMethod.name} +{commission}%)
                </span>
                <span>+{fp(commissionAmount)}</span>
              </div>
            )}
            <div className="cart-summary-total">
              <span>Total</span>
              <span>{fp(totalWithCommission)}</span>
            </div>
          </div>

          <button
            className="place-order-btn"
            disabled={placeOrder.isPending}
            onClick={handlePlaceOrder}
          >
            {placeOrder.isPending
              ? "Processing..."
              : `Place order ${fp(totalWithCommission)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
