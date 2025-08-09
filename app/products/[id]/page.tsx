"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { getProductById } from "@/src/core/products";
import { useToastContext } from "@/src/components/ToastProvider";
import { withUtmQuery } from "@/src/utils/utm";

export default function ProductDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id)
    ? params?.id[0]
    : (params?.id as string | undefined);
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  // Breadcrumbs
  const crumbs = [
    { href: "/", label: "Trang chủ" },
    { href: "/products", label: "Sản phẩm" },
    { href: `/products/${product!.id}`, label: product!.title },
  ];
  const badge = product!.badge;

  const hasThumb = Boolean(product!.imageUrl);

  const [qty, setQty] = useState(1);
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: product!.currency,
        currencyDisplay: "narrowSymbol",
      }),
    [product!.currency]
  );

  const { show } = useToastContext();

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-6xl xl:max-w-7xl px-4 lg:px-6 py-8 space-y-4">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {crumbs.map((c, i) => (
            <span key={c.href}>
              <Link href={c.href} className="hover:underline">
                {c.label}
              </Link>
              {i < crumbs.length - 1 && <span className="mx-1.5">/</span>}
            </span>
          ))}
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            {hasThumb ? (
              <div className="relative aspect-[16/9] md:aspect-[4/3] lg:aspect-[3/2]">
                <Image
                  src={product!.imageUrl!}
                  alt={product!.title}
                  fill
                  sizes="(min-width: 1280px) 50vw, (min-width: 768px) 60vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[16/9] bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-300/20 dark:to-amber-300/10 flex items-center justify-center">
                <span className="text-7xl">{product!.imageEmoji ?? "🛍️"}</span>
              </div>
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div>
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight">
                {product!.title}
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {product!.description}
              </p>
            </div>

            <div className="text-3xl font-bold tabular-nums">
              {fmt.format(product!.price)}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-9 w-9 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                className="w-16 text-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 py-2 text-sm tabular-nums"
              />
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                className="h-9 w-9 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                aria-label="Tăng"
              >
                +
              </button>
            </div>
            {/* Long description & FAQs */}
            {(product!.longDescription || product!.faqs?.length) && (
              <div className="pt-4 space-y-4">
                {product!.longDescription && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p>{product!.longDescription}</p>
                  </div>
                )}
                {product!.faqs?.length ? (
                  <div>
                    <h2 className="text-sm font-semibold mb-2">
                      Câu hỏi thường gặp
                    </h2>
                    <ul className="space-y-2">
                      {product!.faqs!.map((f, idx) => (
                        <li key={idx} className="text-sm">
                          <p className="font-medium">{f.q}</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {f.a}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Link
                href={{
                  pathname: "/checkout",
                  query: withUtmQuery(
                    { productId: product!.id, qty },
                    {
                      utm_source: "product-detail",
                      utm_medium: "cta",
                      utm_campaign: product!.id,
                      utm_content: "detail-primary",
                    }
                  ),
                }}
                onClick={() => show("Đã chuyển sang trang thanh toán")}
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2.5 text-sm font-medium hover:opacity-90"
              >
                Mua ngay
              </Link>
              <Link
                href={{
                  pathname: "/checkout",
                  query: withUtmQuery(
                    { productId: product!.id, coupon: "SAVE10", qty },
                    {
                      utm_source: "product-detail",
                      utm_medium: "cta",
                      utm_campaign: product!.id,
                      utm_content: "detail-outline",
                    }
                  ),
                }}
                onClick={() => show("Đã chuyển sang trang thanh toán")}
                className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Dùng mã -10%
              </Link>
            </div>

            <div className="pt-4 text-sm text-gray-600 dark:text-gray-400">
              <ul className="list-disc list-inside space-y-1">
                <li>Bảo hành 7 ngày (áp dụng cho gói phù hợp)</li>
                <li>Hỗ trợ nhanh qua email</li>
                <li>Giao tài khoản tự động sau khi thanh toán</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
