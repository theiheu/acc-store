"use client";

import { useState, useEffect } from "react";
import type { ProductOption } from "@/src/core/products";

interface ProductOptionsProps {
  options: ProductOption[];
  onSelectionChange: (selectedOption: ProductOption | null) => void;
}

export default function ProductOptions({
  options,
  onSelectionChange,
}: ProductOptionsProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");

  // Initialize with first available option
  useEffect(() => {
    if (options.length > 0 && !selectedOptionId) {
      const firstAvailable = options.find((opt) => opt.stock > 0) || options[0];
      setSelectedOptionId(firstAvailable.id);
      onSelectionChange(firstAvailable);
    }
  }, [options, selectedOptionId, onSelectionChange]);

  const handleSelectionChange = (optionId: string) => {
    setSelectedOptionId(optionId);
    const selectedOption = options.find((opt) => opt.id === optionId) || null;
    onSelectionChange(selectedOption);
  };

  if (!options || options.length === 0) {
    return null;
  }

  const formatOptionLabel = (option: ProductOption) => {
    let label = `${option.label}`;

    if (option.stock === 0) {
      label += " (Hết hàng)";
    } else if (option.stock <= 5) {
      label += ` (Còn ${option.stock})`;
    }

    return label;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="product-options"
          className="block text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          Chọn loại sản phẩm
        </label>
        <div className="relative">
          <select
            id="product-options"
            value={selectedOptionId}
            onChange={(e) => handleSelectionChange(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 pr-10 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-all duration-200 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md"
          >
            {options.map((option) => (
              <option
                key={option.id}
                value={option.id}
                disabled={option.stock === 0}
              >
                {formatOptionLabel(option)}
              </option>
            ))}
          </select>
          {/* Dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="h-4 w-4 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
