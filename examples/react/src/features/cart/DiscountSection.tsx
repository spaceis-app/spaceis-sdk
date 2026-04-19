"use client";

import { useState } from "react";
import { useCart } from "@spaceis/react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/helpers";

/**
 * Apply / remove cart discount. Used by CartDrawer, CartPage and CheckoutPage —
 * reads cart state + actions from `useCart()` directly so callers need no props.
 */
export function DiscountSection() {
  const { hasDiscount, discount, applyDiscount, removeDiscount } = useCart();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);

  const apply = async () => {
    const trimmed = code.trim();
    if (!trimmed || pending) return;
    setPending(true);
    try {
      await applyDiscount(trimmed);
      toast.success("Discount applied!");
      setCode("");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Invalid code");
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    if (pending) return;
    setPending(true);
    try {
      await removeDiscount();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  if (hasDiscount && discount) {
    return (
      <div className="discount-active">
        <span>
          Code: <strong>{discount.code}</strong>
        </span>
        <span className="discount-active-pct">
          -{discount.percentage_discount}%
        </span>
        <button
          className="discount-remove"
          onClick={remove}
          disabled={pending}
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="discount-row">
      <input
        type="text"
        placeholder="Discount code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") apply();
        }}
        autoComplete="off"
        maxLength={64}
      />
      <button className="discount-apply" onClick={apply} disabled={pending}>
        {pending ? "..." : "Apply"}
      </button>
    </div>
  );
}
