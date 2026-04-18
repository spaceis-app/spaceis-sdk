"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  useCart,
  useCheckout,
  useRecaptcha,
} from "@spaceis/react";
import { fp, getErrorMessage } from "@/lib/helpers";
import { toast } from "sonner";
import { calcPaymentFee, commissionPercent, isSafeRedirect } from "@/features/checkout/checkout-utils";
import { CartItemRow } from "@/features/cart/CartItemRow";
import { DiscountSection } from "@/features/cart/DiscountSection";

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

  // Auto-select first payment method
  useEffect(() => {
    if (methods.data && methods.data.length > 0 && !selectedMethodUuid) {
      setSelectedMethodUuid(methods.data[0].uuid);
    }
  }, [methods.data, selectedMethodUuid]);

  const selectedMethod = methods.data?.find(
    (m) => m.uuid === selectedMethodUuid
  );
  const commission = selectedMethod?.commission ?? 1;
  const commissionAmount = calcPaymentFee(finalPrice, commission);
  const commissionPct = commissionPercent(commission);
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

      if (isSafeRedirect(result.redirect_url)) {
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
            {items.map((item) => (
              <CartItemRow key={item.variant?.uuid} item={item} layout="checkout" />
            ))}
          </div>

          {/* Discount */}
          <div className="checkout-card">
            <div className="checkout-card-title">Discount code</div>
            <DiscountSection />
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
                  maxLength={32}
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
                  maxLength={255}
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
                    {commissionPercent(m.commission) > 0 ? (
                      <span className="payment-commission">
                        (+{commissionPercent(m.commission)}%)
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
            {commissionPct > 0 && selectedMethod && (
              <div className="cart-summary-row">
                <span>
                  Fee ({selectedMethod.name} +{commissionPct}%)
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
