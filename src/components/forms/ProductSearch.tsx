"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { useDebounce } from "@/src/hooks/useDebounce";
import type { Product } from "@/src/core/products";

interface ProductSearchProps {
  products: Product[];
  onResults: (results: Product[]) => void;
  placeholder?: string;
  className?: string;
}

const ProductSearch = memo(function ProductSearch({
  products,
  onResults,
  placeholder = "Tìm kiếm sản phẩm...",
  className = "",
}: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized search results
  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return products;
    }

    const term = debouncedSearchTerm.toLowerCase().trim();
    
    return products.filter((product) => {
      // Search in title
      if (product.title.toLowerCase().includes(term)) {
        return true;
      }
      
      // Search in description
      if (product.description?.toLowerCase().includes(term)) {
        return true;
      }
      
      // Search in category
      if (product.category.toLowerCase().includes(term)) {
        return true;
      }
      
      return false;
    });
  }, [products, debouncedSearchTerm]);

  // Update results when search changes
  useMemo(() => {
    onResults(searchResults);
  }, [searchResults, onResults]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Search input */}
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />

        {/* Clear button */}
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Xóa tìm kiếm"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Search results count */}
      {debouncedSearchTerm && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {searchResults.length > 0 ? (
            <span>
              Tìm thấy <span className="font-medium">{searchResults.length}</span> sản phẩm
              {searchResults.length !== products.length && (
                <span> trong tổng số {products.length} sản phẩm</span>
              )}
            </span>
          ) : (
            <span>Không tìm thấy sản phẩm nào phù hợp</span>
          )}
        </div>
      )}
    </div>
  );
});

export default ProductSearch;
