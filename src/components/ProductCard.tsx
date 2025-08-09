"use client";
import { Skeleton, SkeletonText } from "@/src/components/Skeleton";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { Product } from "@/src/core/products";
import { useToastContext } from "@/src/components/ToastProvider";
import { withUtmQuery } from "@/src/utils/utm";

export default function ProductCard({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: product.currency,
        currencyDisplay: "narrowSymbol",
      }),
    [product.currency]
  );

  const { show } = useToastContext();

  function withUtm(query: Record<string, any>, utm_content: string) {
    return withUtmQuery(query, {
      utm_source: "homepage",
      utm_medium: "cta",
      utm_campaign: "buy-now",
      utm_content,
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <div className="relative aspect-[16/9] overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-300/20 dark:to-amber-300/10 flex items-center justify-center">
            <span className="text-5xl">{product.imageEmoji ?? "🛍️"}</span>
          </div>
        )}
      </div>
      {product.badge && (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            product.badge === "hot"
              ? "bg-amber-100 text-amber-900 dark:bg-amber-300/20 dark:text-amber-200"
              : "bg-green-100 text-green-900 dark:bg-green-300/20 dark:text-green-200"
          }`}
        >
          {product.badge === "hot" ? "Hot" : "Mới"}
        </span>
      )}

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/products/${product.id}`} className="hover:underline">
              <h3 className="text-base font-semibold">{product.title}</h3>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {product.description}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold tabular-nums">
              {fmt.format(product.price)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              / tài khoản
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Giảm"
          >
            −
          </button>
          <input
            inputMode="numeric"
            value={qty}
            onChange={(e) => {
              const v = parseInt(e.target.value || "1", 10);
              if (!Number.isNaN(v)) setQty(Math.min(99, Math.max(1, v)));
            }}
            className="w-14 text-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 py-1.5 text-sm tabular-nums"
          />
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Tăng"
          >
            +
          </button>
          <div className="ml-auto text-sm">
            <span className="text-gray-500 dark:text-gray-400">Tổng: </span>
            <span className="font-semibold tabular-nums">
              {fmt.format(product.price * qty)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={{
              pathname: "/checkout",
              query: withUtm({ productId: product.id, qty }, "btn-primary"),
            }}
            onClick={() => show("Đã chuyển sang trang thanh toán")}
            className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-3 py-2 text-sm font-medium hover:opacity-90"
          >
            Mua ngay
          </Link>
          <Link
            href={{
              pathname: "/checkout",
              query: withUtm(
                { productId: product.id, coupon: "SAVE10", qty },
                "btn-outline"
              ),
            }}
            onClick={() => show("Đã chuyển sang trang thanh toán")}
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Dùng mã -10%
          </Link>
        </div>
      </div>
    </div>
  );
}
