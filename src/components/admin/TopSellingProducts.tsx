"use client";

import { memo } from "react";
import { formatCurrency } from "@/src/core/admin";

export interface TopSellingProductItem {
  productId: string;
  productTitle: string;
  salesCount: number;
  revenue: number;
}

interface TopSellingProductsProps {
  items: TopSellingProductItem[];
}

function TopSellingProducts({ items }: TopSellingProductsProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Sản phẩm bán chạy
      </h3>
      <div className="space-y-3">
        {items.map((product, index) => (
          <div
            key={product.productId}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-300/10 rounded-lg flex items-center justify-center">
                <span
                  className="text-sm font-bold text-amber-800 dark:text-amber-200"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="sr-only">Xếp hạng</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  {product.productTitle}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {product.salesCount} đã bán
                </p>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(product.revenue)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(TopSellingProducts);
