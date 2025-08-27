"use client";

import { memo } from "react";

interface ProductCardContentProps {
  title: string;
  description: string;
  soldCount?: number;
}

const ProductCardContent = memo(function ProductCardContent({
  title,
  description,
  soldCount,
}: ProductCardContentProps) {
  return (
    <div className="p-5 pb-0 flex-1 flex flex-col">
      {" "}
      {/* Title and Description (grow to fill) */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>
      {/* Spacer to push actions & price to bottom */}
      <div className="mt-3 sm:mt-4 flex-1" />
      {(soldCount || 0) > 0 && (
        <p className="text-xs flex justify-end text-gray-500 dark:text-gray-400 py-2">
          Đã bán: {soldCount}
        </p>
      )}
    </div>
  );
});

export default ProductCardContent;
