"use client";

import { useState, useMemo, useEffect } from "react";
import type { ProductOption } from "@/src/core/products";

interface ProductOptionsProps {
  options: ProductOption[];
  onSelectionChange: (
    selections: Record<string, string>,
    totalPriceModifier: number
  ) => void;
}

export default function ProductOptions({
  options,
  onSelectionChange,
}: ProductOptionsProps) {
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    // Khởi tạo với giá trị đầu tiên của mỗi option
    const initial: Record<string, string> = {};
    options.forEach((option) => {
      if (option.values.length > 0) {
        initial[option.id] = option.values[0].id;
      }
    });
    return initial;
  });

  const totalPriceModifier = useMemo(() => {
    return options.reduce((total, option) => {
      const selectedValueId = selections[option.id];
      const selectedValue = option.values.find((v) => v.id === selectedValueId);
      return total + (selectedValue?.priceModifier || 0);
    }, 0);
  }, [options, selections]);

  // Call onSelectionChange with initial values on mount and when selections change
  useEffect(() => {
    onSelectionChange(selections, totalPriceModifier);
  }, [selections, totalPriceModifier]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectionChange = (optionId: string, valueId: string) => {
    const newSelections = { ...selections, [optionId]: valueId };
    setSelections(newSelections);

    // Tính toán lại tổng price modifier
    const newTotalModifier = options.reduce((total, option) => {
      const selectedValueId = newSelections[option.id];
      const selectedValue = option.values.find((v) => v.id === selectedValueId);
      return total + (selectedValue?.priceModifier || 0);
    }, 0);

    onSelectionChange(newSelections, newTotalModifier);
  };

  if (!options || options.length === 0) {
    return null;
  }

  const formatOptionLabel = (value: any) => {
    let label = value.label;

    if (value.priceModifier !== 0) {
      const priceText = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        currencyDisplay: "narrowSymbol",
      }).format(value.priceModifier);

      label += ` (${value.priceModifier > 0 ? "+" : ""}${priceText})`;
    }

    if (value.description) {
      label += ` - ${value.description}`;
    }

    return label;
  };

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <div key={option.id} className="space-y-2">
          <label
            htmlFor={`option-${option.id}`}
            className="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            {option.label}
          </label>
          <div className="relative">
            <select
              id={`option-${option.id}`}
              value={selections[option.id] || ""}
              onChange={(e) => handleSelectionChange(option.id, e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 pr-10 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-all duration-200 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md"
            >
              {option.values.map((value) => (
                <option key={value.id} value={value.id}>
                  {formatOptionLabel(value)}
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
      ))}
    </div>
  );
}
