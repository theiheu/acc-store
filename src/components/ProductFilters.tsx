"use client";

import { memo, useCallback } from "react";

interface ProductFiltersProps {
  sortBy: "price" | "title" | "createdAt";
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: "price" | "title" | "createdAt", sortOrder: "asc" | "desc") => void;
  totalCount: number;
  className?: string;
}

const ProductFilters = memo(function ProductFilters({
  sortBy,
  sortOrder,
  onSortChange,
  totalCount,
  className = "",
}: ProductFiltersProps) {
  const handleSortChange = useCallback((newSortBy: "price" | "title" | "createdAt") => {
    // If same sort field, toggle order; otherwise use default order
    const newSortOrder = sortBy === newSortBy && sortOrder === "asc" ? "desc" : "asc";
    onSortChange(newSortBy, newSortOrder);
  }, [sortBy, sortOrder, onSortChange]);

  const getSortIcon = useCallback((field: "price" | "title" | "createdAt") => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortOrder === "asc" ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  }, [sortBy, sortOrder]);

  const getSortLabel = useCallback((field: "price" | "title" | "createdAt") => {
    const labels = {
      price: "Giá",
      title: "Tên",
      createdAt: "Mới nhất",
    };
    return labels[field];
  }, []);

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium">{totalCount}</span> sản phẩm
      </div>

      {/* Sort options */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
          Sắp xếp:
        </span>
        <div className="flex items-center gap-1">
          {(["price", "title", "createdAt"] as const).map((field) => (
            <button
              key={field}
              onClick={() => handleSortChange(field)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                sortBy === field
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {getSortLabel(field)}
              {getSortIcon(field)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

export default ProductFilters;
