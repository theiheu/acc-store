"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { getProductById, type ProductOption } from "@/src/core/products";
import { useToastContext } from "@/src/components/ToastProvider";
import { withUtmQuery } from "@/src/utils/utm";
import ProductDetailSkeleton from "@/src/components/ProductDetailSkeleton";
import ProductOptions from "@/src/components/ProductOptions";
import ProductInfoTabs from "@/src/components/ProductInfoTabs";
import { useGlobalLoading } from "@/src/components/GlobalLoadingProvider";

export default function ProductDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id)
    ? params?.id[0]
    : (params?.id as string | undefined);
  const product = getProductById(id);

  // Always call ALL hooks at the top in the same order
  const { hideLoading, showLoading } = useGlobalLoading();
  const [isLoading, setIsLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(
    null
  );
  const { show } = useToastContext();

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: product?.currency || "VND",
        currencyDisplay: "narrowSymbol",
      }),
    [product?.currency]
  );

  // Calculate current price based on selected option
  const currentPrice = useMemo(() => {
    if (selectedOption) {
      return selectedOption.price;
    }
    return product?.price || 0;
  }, [selectedOption, product?.price]);

  useEffect(() => {
    // Hide any global loading from navigation
    hideLoading();
    // Show skeleton for a brief moment
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [hideLoading]);

  // Handle early returns after all hooks are called
  if (!product) {
    notFound();
  }

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  // Breadcrumbs
  const crumbs = [
    { href: "/", label: "Trang chủ" },
    { href: "/products", label: "Sản phẩm" },
    { href: `/products/${product.id}`, label: product.title },
  ];
  const badge = product.badge;
  const hasThumb = Boolean(product.imageUrl);

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
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
            {hasThumb ? (
              <div className="relative aspect-[16/9] md:aspect-[4/3] lg:aspect-[3/2]">
                <Image
                  src={product.imageUrl!}
                  alt={product.title}
                  fill
                  sizes="(min-width: 1280px) 50vw, (min-width: 768px) 60vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[16/9] bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-300/20 dark:to-amber-300/10 flex items-center justify-center">
                <span className="text-7xl">{product.imageEmoji ?? "🛍️"}</span>
              </div>
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* CTAs (mua ngay, dùng mã) stay in upper half */}
            <div>
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight">
                {product.title}
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {product.description}
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-bold tabular-nums">
                {fmt.format(currentPrice)}
              </div>
              {selectedOption && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedOption.stock > 0 ? (
                    <span className="text-green-600 dark:text-green-400">
                      Còn {selectedOption.stock} sản phẩm
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">
                      Hết hàng
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Product Options */}
            {product.options && product.options.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tùy chọn sản phẩm</h3>
                <ProductOptions
                  options={product.options}
                  onSelectionChange={(option) => {
                    setSelectedOption(option);
                  }}
                />
              </div>
            )}

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
            <div className="flex gap-2 pt-2">
              <button
                onClick={async () => {
                  try {
                    // Check if option is selected and has stock
                    if (product.options && product.options.length > 0) {
                      if (!selectedOption) {
                        show("Vui lòng chọn loại sản phẩm");
                        return;
                      }
                      if (selectedOption.stock === 0) {
                        show("Sản phẩm đã hết hàng");
                        return;
                      }
                      if (selectedOption.stock < qty) {
                        show(`Chỉ còn ${selectedOption.stock} sản phẩm`);
                        return;
                      }
                    }

                    showLoading("Đang xử lý đơn hàng...");
                    const res = await fetch("/api/orders", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        productId: product.id,
                        quantity: qty,
                        selectedOptionId: selectedOption?.id,
                        price: currentPrice,
                      }),
                    });
                    const data = await res.json();
                    if (!data.success) {
                      show(data.error || "Không thể tạo đơn hàng");
                      return;
                    }
                    if (data.data?.credentials) {
                      show(
                        "Mua hàng thành công. Thông tin tài khoản đã sẵn sàng."
                      );
                      // Optionally render credentials; for now just alert count
                      alert(
                        `Nhận được ${data.data.credentials.length} tài khoản.`
                      );
                    } else {
                      show(
                        "Đơn hàng đang được xử lý. Vui lòng kiểm tra lịch sử đơn hàng."
                      );
                    }
                  } catch (e) {
                    console.error(e);
                    show("Có lỗi xảy ra khi tạo đơn hàng");
                  }
                }}
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2.5 text-sm font-medium hover:opacity-90"
              >
                Mua ngay
              </button>
              <Link
                href={{
                  pathname: "/deposit",
                  query: {
                    utm_source: "product-detail",
                    utm_medium: "cta",
                    utm_campaign: product.id,
                    utm_content: "detail-outline",
                  },
                }}
                onClick={() => {
                  showLoading("Đang chuyển đến nạp tiền...");
                  show("Đã chuyển sang trang nạp tiền");
                }}
                className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Nạp thêm
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

        {/* Full-width Info Tabs in bottom half (below image and CTAs) */}
        <div className="mt-8">
          <ProductInfoTabs product={product} />
        </div>
      </div>
    </div>
  );
}
