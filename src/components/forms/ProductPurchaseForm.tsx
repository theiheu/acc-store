"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { type Product, type ProductOption } from "@/src/core/products";
import ProductOptions from "./ProductOptions";

interface ProductPurchaseFormProps {
  product: Product;
  currentPrice: number;
  fmt: Intl.NumberFormat;
  selectedOption: ProductOption | null;
  qty: number;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onOptionChange: (option: ProductOption | null) => void;
  onQuantityChange: (qty: number) => void;
}

export default function ProductPurchaseForm({
  product,
  currentPrice,
  fmt,
  selectedOption,
  qty,
  onAddToCart,
  onBuyNow,
  onOptionChange,
  onQuantityChange,
}: ProductPurchaseFormProps) {
  // Optimized handlers
  const handleQuantityDecrease = useCallback(() => {
    onQuantityChange(Math.max(1, qty - 1));
  }, [qty, onQuantityChange]);

  const handleQuantityIncrease = useCallback(() => {
    onQuantityChange(Math.min(99, qty + 1));
  }, [qty, onQuantityChange]);

  const handleQuantityInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseInt(e.target.value || "1", 10);
      if (!Number.isNaN(v)) onQuantityChange(Math.min(99, Math.max(1, v)));
    },
    [onQuantityChange]
  );

  // Stock display logic
  const stockInfo = useMemo(() => {
    if (selectedOption) {
      return {
        stock: selectedOption.stock || 0,
        isInStock: (selectedOption.stock || 0) > 0,
      };
    }
    return {
      stock: product.stock || 0,
      isInStock: (product.stock || 0) > 0,
    };
  }, [selectedOption, product.stock]);

  return (
    <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      {/* Product Title & Description */}
      <div>
        <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight text-amber-700">
          {product.title}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {product.description}
        </p>
      </div>

      {/* Price & Stock */}
      <div className="space-y-1">
        <div className="text-3xl font-bold tabular-nums">
          {fmt.format(currentPrice)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {stockInfo.isInStock ? (
            <span className="text-green-600 dark:text-green-400">
              Còn {stockInfo.stock} sản phẩm
            </span>
          ) : (
            <span className="text-red-600 dark:text-red-400">Hết hàng</span>
          )}
        </div>
      </div>

      {/* Product Options */}
      {product.options && product.options.length > 0 && (
        <div className="space-y-4">
          <ProductOptions
            options={product.options}
            onSelectionChange={onOptionChange}
          />
        </div>
      )}

      {/* Quantity Selector */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleQuantityDecrease}
          className="h-9 w-9 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          aria-label="Giảm"
        >
          −
        </button>
        <input
          inputMode="numeric"
          value={qty}
          onChange={handleQuantityInputChange}
          className="w-16 text-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 py-2 text-sm tabular-nums"
        />
        <button
          type="button"
          onClick={handleQuantityIncrease}
          className="h-9 w-9 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          aria-label="Tăng"
        >
          +
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onBuyNow}
          disabled={!stockInfo.isInStock}
          className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Mua ngay
        </button>
        <button
          onClick={onAddToCart}
          disabled={!stockInfo.isInStock}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 text-white px-4 py-2.5 text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <span className="text-lg">🛒</span>
          <span>Thêm vào giỏ</span>
        </button>
      </div>

      {/* Warranty Info */}
      <div className="pt-4 text-sm text-gray-600 dark:text-gray-400">
        <ul className="list-disc list-inside space-y-1">
          <li>Bảo hành 7 ngày (áp dụng cho gói phù hợp)</li>
          <li>Hỗ trợ nhanh qua email</li>
          <li>Cập nhật tài khoản tự động sau khi thanh toán</li>
        </ul>
      </div>
    </div>
  );
}
