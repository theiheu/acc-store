"use client";

import { useState, useEffect } from "react";
import type { ProductOption } from "@/src/core/products";

interface OptionsEditorProps {
  value: ProductOption[] | undefined;
  onChange: (options: ProductOption[]) => void;
}

// Extended option with base price and profit margin for calculation
interface ExtendedOption extends ProductOption {
  basePrice?: number;
  profitMargin?: number;
}

export default function OptionsEditor({ value, onChange }: OptionsEditorProps) {
  const [local, setLocal] = useState<ExtendedOption[]>([]);

  // Sync local state when value prop changes (e.g., from TAPHOAMMO fetch)
  useEffect(() => {
    if (value && value.length > 0) {
      setLocal(
        value.map((opt) => ({
          ...opt,
          basePrice: opt.basePrice || opt.price, // Preserve existing basePrice if available
          profitMargin: opt.profitMargin || 0, // Preserve existing profitMargin if available
        }))
      );
    }
  }, [value]);

  function commit(next: ExtendedOption[]) {
    console.log("Committing options:", next);
    setLocal(next);
    // Convert back to ProductOption format for parent, but keep basePrice and profitMargin
    const productOptions: ProductOption[] = next.map((opt) => ({
      id: opt.id,
      label: opt.label,
      price: opt.price,
      stock: opt.stock,
      description: opt.description,
      basePrice: opt.basePrice,
      profitMargin: opt.profitMargin,
    }));
    console.log("Sending to parent:", productOptions);
    onChange(productOptions);
  }

  function addOption() {
    const id = `opt_${Date.now().toString(36)}`;
    commit([
      ...local,
      {
        id,
        label: "Tùy chọn mới",
        price: 0,
        stock: 0,
        description: "",
        basePrice: 0,
        profitMargin: 0,
      },
    ]);
  }

  function removeOption(id: string) {
    commit(local.filter((opt) => opt.id !== id));
  }

  function updateOption(id: string, field: string, value: any) {
    commit(
      local.map((opt) => {
        if (opt.id !== id) return opt;

        if (field === "basePrice") {
          const numValue = value === "" ? 0 : Number(value) || 0;
          // Update base price and recalculate selling price if profit margin exists
          if (opt.profitMargin && opt.profitMargin > 0) {
            const newPrice = numValue * (1 + opt.profitMargin / 100);
            return { ...opt, basePrice: numValue, price: Math.round(newPrice) };
          }
          // If no profit margin, just update base price
          return { ...opt, basePrice: numValue };
        }

        if (field === "profitMargin") {
          // Handle empty string properly
          if (value === "" || value === null || value === undefined) {
            return { ...opt, profitMargin: 0 };
          }
          const numValue = Number(value);
          if (isNaN(numValue)) {
            return opt; // Don't update if invalid number
          }

          // Update profit margin and recalculate selling price
          // IMPORTANT: Keep original basePrice, don't change it
          if (opt.basePrice && opt.basePrice > 0) {
            const newPrice = opt.basePrice * (1 + numValue / 100);
            return {
              ...opt,
              profitMargin: numValue,
              price: Math.round(newPrice),
            };
          }
          // If no basePrice, just update profitMargin
          return { ...opt, profitMargin: numValue };
        }

        if (field === "price") {
          const numValue = value === "" ? 0 : Number(value) || 0;
          // When price is manually changed, calculate profit margin if base price exists
          if (opt.basePrice && opt.basePrice > 0) {
            const calculatedMargin =
              ((numValue - opt.basePrice) / opt.basePrice) * 100;
            return {
              ...opt,
              price: numValue,
              profitMargin: Math.round(calculatedMargin * 100) / 100, // Round to 2 decimal places
            };
          }
          return { ...opt, price: numValue };
        }

        if (field === "stock") {
          const numValue = value === "" ? 0 : Number(value) || 0;
          return { ...opt, stock: numValue };
        }

        return { ...opt, [field]: value };
      })
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  // Quick profit margin presets
  const applyProfitMarginToAll = (margin: number) => {
    commit(
      local.map((opt) => {
        const basePrice = opt.basePrice || opt.price || 0;
        if (basePrice > 0) {
          const newPrice = basePrice * (1 + margin / 100);
          return {
            ...opt,
            basePrice: basePrice,
            profitMargin: margin,
            price: Math.round(newPrice),
          };
        }
        return opt;
      })
    );
  };

  if (!local.length) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-sm text-gray-600 dark:text-gray-300">
        <p className="mb-3">Chưa có tùy chọn nào.</p>
        <button
          type="button"
          onClick={addOption}
          className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          + Thêm tùy chọn
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {local.map((option) => (
        <div
          key={option.id}
          className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900"
        >
          {/* Tên tùy chọn */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tên tùy chọn *
            </label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Nhập tên tùy chọn"
              value={option.label}
              onChange={(e) => updateOption(option.id, "label", e.target.value)}
            />
          </div>

          {/* Giá cả */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Giá gốc (VND) *
              </label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
                value={option.basePrice ?? ""}
                onChange={(e) => {
                  console.log(
                    "Base price change:",
                    e.target.value,
                    "for option:",
                    option.id
                  );
                  updateOption(option.id, "basePrice", e.target.value);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lợi nhuận (%)
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="0"
                  value={option.profitMargin ?? ""}
                  onChange={(e) => {
                    console.log(
                      "Profit margin change:",
                      e.target.value,
                      "for option:",
                      option.id
                    );
                    updateOption(option.id, "profitMargin", e.target.value);
                  }}
                />
                {/* Quick margin buttons */}
                <div className="flex flex-wrap gap-1">
                  {[10, 15, 20, 25, 30].map((margin) => (
                    <button
                      key={margin}
                      type="button"
                      onClick={() =>
                        updateOption(option.id, "profitMargin", margin)
                      }
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        option.profitMargin === margin
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-amber-800"
                      }`}
                    >
                      {margin}%
                    </button>
                  ))}
                </div>
              </div>
              {option.basePrice &&
                option.basePrice > 0 &&
                option.profitMargin &&
                option.profitMargin > 0 && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    Lãi: +
                    {formatPrice(
                      (option.basePrice * option.profitMargin) / 100
                    )}{" "}
                    đ
                  </p>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Giá bán (VND) *
              </label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
                value={option.price ?? ""}
                onChange={(e) => {
                  console.log(
                    "Price change:",
                    e.target.value,
                    "for option:",
                    option.id
                  );
                  updateOption(option.id, "price", e.target.value);
                }}
              />
              {option.basePrice && option.basePrice > 0 && (
                <div className="mt-1 space-y-1">
                  {option.profitMargin && option.profitMargin > 0 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Tự động:{" "}
                      {formatPrice(
                        (option.basePrice || 0) *
                          (1 + (option.profitMargin || 0) / 100)
                      )}{" "}
                      đ
                    </p>
                  )}
                  {option.price &&
                    option.price !==
                      option.basePrice *
                        (1 + (option.profitMargin || 0) / 100) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Đã chỉnh sửa thủ công
                      </p>
                    )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tồn kho *
              </label>
              <input
                type="number"
                min="0"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
                value={
                  option.stock !== undefined && option.stock !== null
                    ? option.stock
                    : ""
                }
                onChange={(e) =>
                  updateOption(option.id, "stock", e.target.value)
                }
              />
            </div>
          </div>

          {/* Mô tả và nút xóa */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mô tả (tùy chọn)
              </label>
              <input
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Mô tả chi tiết về tùy chọn này"
                value={option.description || ""}
                onChange={(e) =>
                  updateOption(option.id, "description", e.target.value)
                }
              />
            </div>
            <button
              type="button"
              onClick={() => removeOption(option.id)}
              className="px-3 py-2 rounded-md border border-red-300 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Xóa
            </button>
          </div>
        </div>
      ))}

      {/* Bulk actions */}
      {local.length > 1 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3">
            Áp dụng lợi nhuận cho tất cả
          </h4>
          <div className="flex flex-wrap gap-2">
            {[10, 15, 20, 25, 30, 50].map((margin) => (
              <button
                key={margin}
                type="button"
                onClick={() => applyProfitMarginToAll(margin)}
                className="px-3 py-1.5 rounded-md bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs hover:bg-amber-200 dark:hover:bg-amber-700 transition-colors"
              >
                +{margin}%
              </button>
            ))}
            <button
              type="button"
              onClick={() => applyProfitMarginToAll(0)}
              className="px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Reset (0%)
            </button>
          </div>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            Áp dụng % lợi nhuận cho tất cả tùy chọn có giá gốc
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={addOption}
          className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          + Thêm tùy chọn
        </button>

        {local.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {local.length} tùy chọn
          </span>
        )}
      </div>
    </div>
  );
}
