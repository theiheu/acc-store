"use client";

import { memo } from "react";

interface ProductCardContentProps {
  title: string;
  description: string;
}

const ProductCardContent = memo(function ProductCardContent({
  title,
  description,
}: ProductCardContentProps) {
  return (
    <div className="p-5 flex-1 flex flex-col">
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
    </div>
  );
});

export default ProductCardContent;
