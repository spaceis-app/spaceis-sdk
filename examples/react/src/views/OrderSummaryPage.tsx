"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSpaceIS, fromApiQty } from "@spaceis/react";
import { fp, getErrorMessage } from "@/helpers";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function OrderSummaryPage({ code: codeFromUrl }: { code?: string }) {
  const { client } = useSpaceIS();

  const [code, setCode] = useState(codeFromUrl || "");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadOrder = async (orderCode: string) => {
    if (!orderCode.trim()) {
      toast.error("Enter order code");
      return;
    }
    setLoading(true);
    try {
      const result = await client.orders.summary(orderCode.trim());
      setOrder(result);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codeFromUrl) {
      loadOrder(codeFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeFromUrl]);

  const status = order?.status || "pending";
  const statusLabel = statusLabels[status] || status;

  return (
    <div className="order-wrapper">
      {/* Code input */}
      <div className="order-card">
        <div className="order-card-title">Check order</div>
        <p
          style={{
            color: "var(--txt-3)",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          Enter an order code to view its status and details.
        </p>
        <div className="order-input-row">
          <input
            type="text"
            placeholder="e.g. ABC123DEF"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadOrder(code);
            }}
          />
          <button disabled={loading} onClick={() => loadOrder(code)}>
            {loading ? "..." : "Check"}
          </button>
        </div>
      </div>

      {/* Order details */}
      {order && (
        <>
          {/* Status alert */}
          <div className={`order-alert order-alert-${status}`}>
            <div className="order-alert-top">
              <span className="order-alert-label">{statusLabel}</span>
              {order.code && (
                <span className="order-alert-code">{order.code}</span>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="order-card">
            <div className="order-card-title">Order items</div>
            {(order.items || []).map((item: any, idx: number) => (
              <div key={idx} className="order-item">
                {item.image && (
                  <img
                    className="order-item-img"
                    src={item.image}
                    alt=""
                  />
                )}
                <div className="order-item-info">
                  <div className="order-item-name">{item.title}</div>
                  {item.subtitle && (
                    <div className="order-item-qty">{item.subtitle}</div>
                  )}
                  <div className="order-item-qty">
                    Quantity: {fromApiQty(item.quantity)}
                  </div>
                </div>
                <div className="order-item-price">
                  {fp(item.final_price)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="order-card">
            <div className="order-card-title">Summary</div>

            {order.regular_total_price !== order.final_total_price && (
              <div className="order-total-row">
                <span>Regular price</span>
                <span style={{ textDecoration: "line-through" }}>
                  {fp(order.regular_total_price)}
                </span>
              </div>
            )}

            {order.discount?.totalDiscountedValue > 0 && (
              <div className="order-total-row discount">
                <span>
                  Discount
                  {order.discount.code
                    ? ` (${order.discount.code})`
                    : ""}
                </span>
                <span>-{fp(order.discount.totalDiscountedValue)}</span>
              </div>
            )}

            {order.sale?.totalDiscountedValue > 0 && (
              <div className="order-total-row discount">
                <span>Sale</span>
                <span>-{fp(order.sale.totalDiscountedValue)}</span>
              </div>
            )}

            {order.package_included?.totalDiscountedValue > 0 && (
              <div className="order-total-row discount">
                <span>Package discount</span>
                <span>
                  -{fp(order.package_included.totalDiscountedValue)}
                </span>
              </div>
            )}

            <div className="order-total-row final">
              <span>Total</span>
              <span>{fp(order.final_total_price)}</span>
            </div>
          </div>

          <Link href="/" className="back-link">
            &larr; Back to shop
          </Link>
        </>
      )}
    </div>
  );
}
