"use client";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { Product } from "@/src/core/products";
import { calculateProductPrice } from "@/src/core/products";
import { useGlobalLoading } from "./GlobalLoadingProvider";

export default function ProductCard({ product }: { product: Product }) {
  const { showLoading } = useGlobalLoading();
  const [imageError, setImageError] = useState(false);

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
    <Link
      href={`/products/${product.id}`}
      onClick={() => showLoading("Đang tải sản phẩm...")}
      className="group flex flex-col h-full w-full max-w-[22rem] sm:max-w-none rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl hover:shadow-gray-200/20 dark:hover:shadow-gray-900/20 overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer backdrop-blur-sm"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 dark:bg-gray-800/50">
        {product.imageUrl && !imageError ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-center transition-transform duration-500 ease-out transform-gpu"
            onError={() => {
              console.warn("Image failed to load:", product.imageUrl);
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 dark:from-amber-900/30 dark:via-amber-800/20 dark:to-amber-700/10 flex items-center justify-center">
            <span className="text-6xl opacity-80 transform transition-transform duration-300 ease-out">
              {product.imageEmoji ?? "🛍️"}
            </span>
          </div>
        )}

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-3 right-3 z-10">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-lg backdrop-blur-sm border ${
                product.badge === "hot"
                  ? "bg-red-500/90 text-white border-red-400/50 shadow-red-500/25"
                  : "bg-emerald-500/90 text-white border-emerald-400/50 shadow-emerald-500/25"
              }`}
            >
              {product.badge === "hot" ? "🔥 Hot" : "✨ Mới"}
            </span>
          </div>
        )}

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Container: flexible to push Price Section to bottom */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title and Description (grow to fill) */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
            {product.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Spacer to push actions & price to bottom */}
        <div className="mt-3 sm:mt-4 flex-1" />

        {/* Price at bottom */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            {/* Left: Price group aligned to baseline */}
            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-1 min-w-0">
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
      </div>
    </Link>
  );
}
