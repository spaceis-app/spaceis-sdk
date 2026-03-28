"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  useProduct,
  useCart,
  getProductLimits,
  snapQuantity,
  type ShowShopProductVariant,
} from "@spaceis/react";
import { fp, PlaceholderSVG, getErrorMessage, sanitizeHtml } from "@/helpers";
import { Recommendations } from "@/components/Recommendations";
import { toast } from "sonner";

export function ProductPage({ slug }: { slug: string }) {
  const { data: product, isLoading } = useProduct(slug);
  const { add } = useCart();

  const [selectedVariant, setSelectedVariant] =
    useState<ShowShopProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [qtyInput, setQtyInput] = useState("1");
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
      const lim = getProductLimits(product);
      setQuantity(lim.min);
      setQtyInput(String(lim.min));
    }
    setAddSuccess(false);
  }, [product]);

  const limits = product
    ? getProductLimits(product)
    : { min: 1, max: 99, step: 1 };

  const handleAdd = useCallback(async () => {
    if (!selectedVariant) return;
    setAdding(true);
    try {
      await add(selectedVariant.uuid, quantity);
      toast.success("Added to cart!");
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 1500);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }, [selectedVariant, quantity, add]);

  if (isLoading) {
    return (
      <div className="container pdp-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container pdp-container">
        <div className="empty-state">
          <p>Product not found.</p>
          <Link href="/" className="back-link">
            &larr; Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = selectedVariant
    ? selectedVariant.price * quantity
    : 0;
  const currentBasePrice = selectedVariant
    ? selectedVariant.base_price * quantity
    : 0;
  const hasDiscount = currentBasePrice > currentPrice;
  const unitPrice = selectedVariant ? selectedVariant.price : 0;

  return (
    <div className="container pdp-container">
      {/* Breadcrumb */}
      <nav className="pdp-breadcrumb">
        <Link href="/">Shop</Link>
        <span className="pdp-breadcrumb-sep">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="pdp-layout">
        {/* Left: Image */}
        <div className="pdp-image-col">
          {product.image ? (
            <img
              className="pdp-image"
              src={product.image}
              alt={product.name}
            />
          ) : (
            <div className="pdp-image-placeholder">
              <PlaceholderSVG size={64} />
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="pdp-details-col">
          <h1 className="pdp-title">{product.name}</h1>

          <div className="pdp-price-block">
            <span className="pdp-price">{fp(currentPrice)}</span>
            {hasDiscount && (
              <span className="pdp-price-old">{fp(currentBasePrice)}</span>
            )}
          </div>

          <div className="pdp-unit-price">
            ({fp(unitPrice)}/{limits.step > 1 ? `${limits.step} pcs.` : "1 pcs."})
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 1 && (
            <div className="pdp-section">
              <div className="pdp-label">Variant</div>
              <div className="variants-grid">
                {product.variants.map((v) => (
                  <button
                    key={v.uuid}
                    className={`variant-btn ${selectedVariant?.uuid === v.uuid ? "active" : ""}`}
                    onClick={() => {
                      setSelectedVariant(v);
                      setQuantity(limits.min);
                      setQtyInput(String(limits.min));
                    }}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="pdp-section">
            <div className="pdp-qty-row">
              <div className="pdp-qty-stepper">
                <button
                  className="qty-step-btn"
                  disabled={quantity <= limits.min}
                  onClick={() => {
                    const q = Math.max(limits.min, quantity - limits.step);
                    setQuantity(q);
                    setQtyInput(String(q));
                  }}
                >
                  -
                </button>
                <input
                  className="pdp-qty-input"
                  type="text"
                  inputMode="numeric"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                  onBlur={() => {
                    let n = parseInt(qtyInput, 10);
                    if (isNaN(n)) n = quantity;
                    n = snapQuantity(n, limits);
                    setQuantity(n);
                    setQtyInput(String(n));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                />
                <button
                  className="qty-step-btn"
                  disabled={quantity >= limits.max}
                  onClick={() => {
                    const q = Math.min(limits.max, quantity + limits.step);
                    setQuantity(q);
                    setQtyInput(String(q));
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Add to cart */}
          <button
            className={`pdp-add-btn ${addSuccess ? "success" : ""}`}
            disabled={adding || !selectedVariant}
            onClick={handleAdd}
          >
            {adding
              ? "Adding..."
              : addSuccess
                ? "Added!"
                : "Add to cart"}
          </button>

          {/* Recommendations */}
          <Recommendations slug={slug} title="Recommended" />

          {/* Description */}
          {product.description && (
            <div className="pdp-description">
              <div className="pdp-label">Description</div>
              <div
                className="pdp-desc-body"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
