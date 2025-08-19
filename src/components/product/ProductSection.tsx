"use client";

import { useState, useCallback, memo } from "react";
import { useProducts } from "@/src/hooks/useProducts";
import ProductGrid from "./ProductGrid";
import ProductFilters from "../forms/ProductFilters";

interface ProductSectionProps {
  category?: string;
  title?: string;
  limit?: number;
  showFilters?: boolean;
  className?: string;
}

const ProductSection = memo(function ProductSection({
  category,
  title,
  limit,
  showFilters = true,
  className = "",
}: ProductSectionProps) {
  const [sortBy, setSortBy] = useState<"price" | "title" | "createdAt">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { filteredProducts, loading, error, totalCount } = useProducts({
    category,
    limit,
    sortBy,
    sortOrder,
  });

  const handleSortChange = useCallback(
    (
      newSortBy: "price" | "title" | "createdAt",
      newSortOrder: "asc" | "desc"
    ) => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
    },
    []
  );

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Có lỗi xảy ra
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Section header */}
      {title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h2>
        </div>
      )}

      {/* Filters */}
      {showFilters && !loading && filteredProducts.length > 0 && (
        <div className="mb-6">
          <ProductFilters
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            totalCount={totalCount}
          />
        </div>
      )}

      {/* Products grid */}
      <ProductGrid
        products={filteredProducts}
        loading={loading}
        emptyMessage={
          category
            ? `Không có sản phẩm nào trong danh mục này`
            : "Không có sản phẩm nào"
        }
      />
    </div>
  );
});

export default ProductSection;
