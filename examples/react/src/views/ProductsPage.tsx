"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts, useCategories, type ShopCategory } from "@spaceis/react";
import { ProductCard, ProductGridSkeleton } from "@/components/ProductCard";
import { Pagination } from "@/components/Pagination";
import { CommunitySection } from "@/components/CommunitySection";

export function ProductsPage() {
  const searchParams = useSearchParams();
  const saleFilter = searchParams.get("sale") || undefined;

  const [page, setPage] = useState(1);
  const [categoryUuid, setCategoryUuid] = useState<string | null>(null);
  const [subCategoryUuid, setSubCategoryUuid] = useState<string | null>(null);
  const [selectedParent, setSelectedParent] = useState<ShopCategory | null>(
    null
  );

  const activeCategoryUuid = subCategoryUuid ?? categoryUuid ?? undefined;

  const { data: categoriesData } = useCategories();
  const categories = (categoriesData ?? []).filter((c) => c.is_active);

  const { data: productsData, isLoading } = useProducts({
    page,
    category_uuid: activeCategoryUuid,
    sale_slug: saleFilter,
  });

  const selectCategory = useCallback(
    (cat: ShopCategory | null) => {
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
    },
    []
  );

  const selectSubCategory = useCallback((uuid: string | null) => {
    setSubCategoryUuid(uuid);
    setPage(1);
  }, []);

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
              onClick={() => selectSubCategory(null)}
            >
              All
            </button>
            {activeChildren.map((child) => (
              <button
                key={child.uuid}
                className={`cat-btn cat-child ${subCategoryUuid === child.uuid ? "active" : ""}`}
                onClick={() => selectSubCategory(child.uuid)}
              >
                {child.name}
              </button>
            ))}
          </div>
        )}

        {/* Products grid */}
        {isLoading ? (
          <ProductGridSkeleton />
        ) : productsData && productsData.data.length > 0 ? (
          <div className="products-grid">
            {productsData.data.map((product, idx) => (
              <ProductCard
                key={product.uuid}
                product={product}
                index={idx}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No products in this category.</p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          meta={productsData?.meta}
          onPageChange={setPage}
        />
      </section>

      <CommunitySection />
    </div>
  );
}
