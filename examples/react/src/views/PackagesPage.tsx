"use client";

import { useState } from "react";
import { usePackages, useCategories, type ShopCategory } from "@spaceis/react";
import { ProductCard, ProductGridSkeleton } from "@/components/ProductCard";
import { Pagination } from "@/components/Pagination";
import { CommunitySection } from "@/components/CommunitySection";

export function PackagesPage() {
  const [page, setPage] = useState(1);
  const [categoryUuid, setCategoryUuid] = useState<string | null>(null);
  const [subCategoryUuid, setSubCategoryUuid] = useState<string | null>(null);
  const [selectedParent, setSelectedParent] = useState<ShopCategory | null>(
    null
  );

  const activeCategoryUuid = subCategoryUuid ?? categoryUuid ?? undefined;

  const { data: categoriesData } = useCategories();
  const categories = (categoriesData ?? []).filter((c) => c.is_active);

  const { data: packagesData, isLoading } = usePackages({
    page,
    category_uuid: activeCategoryUuid,
  });

  const selectCategory = (cat: ShopCategory | null) => {
    if (cat === null) {
      setCategoryUuid(null);
      setSubCategoryUuid(null);
      setSelectedParent(null);
    } else {
      setCategoryUuid(cat.uuid);
      setSubCategoryUuid(null);
      setSelectedParent(cat);
    }
    setPage(1);
  };

  const activeChildren = (selectedParent?.children ?? []).filter(
    (c) => c.is_active
  );

  return (
    <div className="container">
      <section className="section">
        {/* Category filters */}
        <div className="categories">
          <button
            className={`cat-btn ${categoryUuid === null ? "active" : ""}`}
            onClick={() => selectCategory(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.uuid}
              className={`cat-btn ${categoryUuid === cat.uuid ? "active" : ""}`}
              onClick={() => selectCategory(cat)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Subcategories */}
        {activeChildren.length > 0 && (
          <div className="categories subcategories">
            <button
              className={`cat-btn cat-child ${subCategoryUuid === null ? "active" : ""}`}
              onClick={() => setSubCategoryUuid(null)}
            >
              All
            </button>
            {activeChildren.map((child) => (
              <button
                key={child.uuid}
                className={`cat-btn cat-child ${subCategoryUuid === child.uuid ? "active" : ""}`}
                onClick={() => {
                  setSubCategoryUuid(child.uuid);
                  setPage(1);
                }}
              >
                {child.name}
              </button>
            ))}
          </div>
        )}

        {/* Packages grid */}
        {isLoading ? (
          <ProductGridSkeleton />
        ) : packagesData && packagesData.data.length > 0 ? (
          <div className="products-grid">
            {packagesData.data.map((pkg, idx) => (
              <ProductCard
                key={pkg.shop_product.uuid}
                product={{
                  ...pkg.shop_product,
                  minimal_price: pkg.minimal_price,
                  minimal_base_price: pkg.minimal_base_price,
                  percentage_discount: pkg.percentage_discount,
                } as any}
                index={idx}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No packages available.</p>
          </div>
        )}

        <Pagination
          meta={packagesData?.meta}
          onPageChange={setPage}
        />
      </section>

      <CommunitySection />
    </div>
  );
}
