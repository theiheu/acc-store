"use client";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import type { Product } from "@/src/core/products";
import { useGlobalLoading } from "./GlobalLoadingProvider";

export default function ProductCard({ product }: { product: Product }) {
  const { showLoading } = useGlobalLoading();

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
    <div className="group w-full max-w-[22rem] sm:max-w-none rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="relative aspect-[16/9] md:aspect-[4/3] xl:aspect-[5/4] overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-300/20 dark:to-amber-300/10 flex items-center justify-center">
            <span className="text-5xl">{product.imageEmoji ?? "🛍️"}</span>
          </div>
        )}
        {product.badge && (
          <span
            className={`pointer-events-none absolute right-2 top-2 z-10 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shadow-sm ${
              product.badge === "hot"
                ? "bg-red-100 text-red-900 dark:bg-red-400/20 dark:text-red-100"
                : "bg-emerald-100 text-emerald-900 dark:bg-emerald-300/20 dark:text-emerald-100"
            }`}
          >
            {product.badge === "hot" ? "Hot" : "Mới"}
          </span>
        )}
      </div>

      {/* Price directly under image */}
      <div className="px-4 lg:px-5">
        <div className="text-lg lg:text-xl font-semibold tabular-nums flex justify-end items-center gap-2">
          <span>{fmt.format(product.price)}</span>
        </div>
      </div>

      <div className="p-4 lg:p-5 space-y-3">
        <div>
          <div>
            <Link
              href={`/products/${product.id}`}
              className="hover:underline"
              onClick={() => showLoading("Đang tải sản phẩm...")}
            >
              <h3 className="text-base lg:text-lg font-semibold leading-tight">
                {product.title}
              </h3>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
