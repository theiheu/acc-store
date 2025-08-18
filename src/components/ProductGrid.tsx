"use client";

import { memo, useMemo } from "react";
import type { Product } from "@/src/core/products";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";

interface ProductGridProps {
  products: Product[];
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
}

const ProductGrid = memo(function ProductGrid({
  products,
  className = "",
  emptyMessage = "Không có sản phẩm nào",
  loading = false,
}: ProductGridProps) {
  // Memoize filtered active products
  const activeProducts = useMemo(() => {
    return products.filter((product) => product.isActive !== false);
  }, [products]);

  // Empty state
  const EmptyState = memo(function EmptyState() {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🛍️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Hãy quay lại sau để xem các sản phẩm mới
        </p>
      </div>
    );
  });

  if (loading) {
    return <ProductCardSkeleton className={className} />;
  }

  if (activeProducts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
    >
      {activeProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
});

export default ProductGrid;
