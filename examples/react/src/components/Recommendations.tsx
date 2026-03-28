"use client";

import { useState } from "react";
import { useProductRecommendations, useCart, fromApiQty } from "@spaceis/react";
import { fp, PlaceholderSVG, getErrorMessage } from "../helpers";
import { toast } from "sonner";

interface RecommendationsProps {
  slug: string | null;
  title?: string;
}

export function Recommendations({ slug, title = "Recommended" }: RecommendationsProps) {
  const { data: recs } = useProductRecommendations(slug);
  const { add } = useCart();

  if (!recs || recs.length === 0) return null;

  return (
    <div className="recs-section">
      <div className="recs-section-title">{title}</div>
      <div className="recs-grid">
        {recs.map((rec: any) => (
          <RecCard key={rec.variant?.uuid ?? rec.uuid} rec={rec} onAdd={add} />
        ))}
      </div>
    </div>
  );
}

function RecCard({ rec, onAdd }: { rec: any; onAdd: (uuid: string, qty?: number) => Promise<any> }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const minQty = rec.shop_product?.min_quantity
    ? fromApiQty(rec.shop_product.min_quantity)
    : 1;

  const imgSrc = rec.variant?.image || rec.shop_product?.image || null;
  const name = rec.name || rec.shop_product?.name || "";
  const variantUuid = rec.variant?.uuid;
  const hasDiscount = rec.base_price !== rec.price;

  const handleAdd = async () => {
    if (!variantUuid || adding) return;
    setAdding(true);
    try {
      await onAdd(variantUuid, minQty);
      toast.success("Added to cart!");
      setAdded(true);
      setTimeout(() => { setAdded(false); }, 1500);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rec-card">
      {imgSrc ? (
        <img className="rec-img" src={imgSrc} alt="" />
      ) : (
        <div className="rec-img-placeholder">
          <PlaceholderSVG size={16} />
        </div>
      )}
      <div className="rec-info">
        <div className="rec-name">{name}</div>
        <div className="rec-price-row">
          <span className="rec-price">{fp(rec.price * minQty)}</span>
          {hasDiscount && (
            <span className="rec-old-price">{fp(rec.base_price * minQty)}</span>
          )}
          {minQty > 1 && (
            <span className="rec-qty-label">({minQty} pcs.)</span>
          )}
        </div>
      </div>
      <button
        className="rec-add-btn"
        disabled={adding || !variantUuid}
        onClick={handleAdd}
        title="Add to cart"
        aria-label="Add to cart"
      >
        {adding ? "..." : added ? "\u2713" : "+"}
      </button>
    </div>
  );
}
