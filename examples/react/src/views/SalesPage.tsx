"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSales } from "@spaceis/react";
import { PlaceholderSVG } from "../helpers";
import { ProductGridSkeleton } from "../components/ProductCard";
import { CommunitySection } from "../components/CommunitySection";

export function SalesPage() {
  const { data, isLoading } = useSales({ sort: "expires_at" });

  const sales = data?.data ?? [];

  return (
    <div className="container">
      <section className="section">
        <h1 className="page-heading">Sales</h1>

        {isLoading ? (
          <ProductGridSkeleton />
        ) : sales.length === 0 ? (
          <div className="empty-state">
            <p>No active sales right now.</p>
          </div>
        ) : (
          <div className="products-grid">
            {sales.map((sale, idx) => (
              <SaleCard key={sale.uuid} sale={sale} index={idx} />
            ))}
          </div>
        )}
      </section>

      <CommunitySection />
    </div>
  );
}

function SaleCard({
  sale,
  index,
}: {
  sale: any;
  index: number;
}) {
  const [countdown, setCountdown] = useState("");
  const endsAt = sale.expires_at || sale.ends_at;

  useEffect(() => {
    if (!endsAt) return;

    function pad(n: number) { return n < 10 ? "0" + n : "" + n; }

    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("Ended");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const parts: string[] = [];
      if (d > 0) parts.push(d + "d");
      parts.push(pad(h) + ":" + pad(m) + ":" + pad(s));
      setCountdown(parts.join(" ") + " left");
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <Link
      href={`/?sale=${sale.slug || sale.uuid}`}
      className="product-card"
      style={{ animationDelay: `${index * 0.04}s`, cursor: "pointer", textDecoration: "none" }}
    >
      <div className="product-img-wrap">
        {sale.image ? (
          <img
            className="product-img"
            src={sale.image}
            alt={sale.name}
            loading="lazy"
          />
        ) : (
          <div className="product-img-placeholder">
            <PlaceholderSVG size={32} />
          </div>
        )}
        {sale.percentage_discount ? (
          <div className="product-discount-badge">
            -{sale.percentage_discount}%
          </div>
        ) : null}
      </div>
      <div className="product-body">
        <div className="product-name">{sale.name}</div>
        <div className="product-footer">
          <div>
            {sale.percentage_discount ? (
              <span className="product-price" style={{ color: "var(--red)" }}>
                -{sale.percentage_discount}%
              </span>
            ) : null}
          </div>
          <span className="view-btn">View</span>
        </div>
        {countdown && (
          <div className="sale-timer">{countdown}</div>
        )}
      </div>
    </Link>
  );
}
