import Link from "next/link";
import type { IndexShopProduct } from "@spaceis/react";
import { fp, PlaceholderSVG } from "@/lib/helpers";

interface ProductCardProps {
  product: IndexShopProduct;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const priceField = product.minimal_price;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="product-card"
      style={{ animationDelay: `${index * 0.04}s`, textDecoration: "none" }}
    >
      <div className="product-img-wrap">
        {product.image ? (
          <img
            className="product-img"
            src={product.image}
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <div className="product-img-placeholder">
            <PlaceholderSVG size={32} />
          </div>
        )}
        {product.percentage_discount ? (
          <div className="product-discount-badge">
            -{product.percentage_discount}%
          </div>
        ) : null}
      </div>
      <div className="product-body">
        <div className="product-name">{product.name}</div>
        <div className="product-footer">
          <div>
            <span className="product-price">{fp(priceField)}</span>
          </div>
          <span className="view-btn">View</span>
        </div>
      </div>
    </Link>
  );
}

/** Skeleton grid for loading states */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="products-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-img" />
          <div className="skeleton-body">
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-line price" />
          </div>
        </div>
      ))}
    </div>
  );
}
