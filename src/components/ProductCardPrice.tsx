"use client";

import { useMemo, memo } from "react";
import type { Product } from "@/src/core/products";
import { calculateProductPrice } from "@/src/core/products";

interface ProductCardPriceProps {
  product: Product;
}

const ProductCardPrice = memo(function ProductCardPrice({
  product,
}: ProductCardPriceProps) {
  // Calculate display price using options-first logic
  const displayPrice = useMemo(() => calculateProductPrice(product), [product]);

  // Calculate price range for products with options
  const priceRange = useMemo(() => {
    if (product.options && product.options.length > 0) {
      const prices = product.options.map((opt) => opt.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      return { min: minPrice, max: maxPrice, hasRange: minPrice !== maxPrice };
    }
    return { min: displayPrice, max: displayPrice, hasRange: false };
  }, [product.options, displayPrice]);

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: product.currency,
        currencyDisplay: "narrowSymbol",
      }),
    [product.currency]
  );

  return (
    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between p-2">
        {/* Left: Price group aligned to baseline */}
        <div className="flex items-baseline gap-1.5 sm:gap-2 flex-1 min-w-0 ml-2 justify-center">
          {priceRange.hasRange && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
              Từ
            </span>
          )}
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums leading-none whitespace-nowrap">
            {priceRange.hasRange
              ? fmt.format(priceRange.min)
              : fmt.format(displayPrice)}
          </span>
          {priceRange.hasRange && (
            <span className="text-sm text-gray-500 dark:text-gray-400 leading-none whitespace-nowrap">
              - {fmt.format(priceRange.max)}
            </span>
          )}
        </div>

        {/* Right: Action indicator, center vertically */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors duration-200">
          <svg
            className="w-4 h-4 transform transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
});

export default ProductCardPrice;
