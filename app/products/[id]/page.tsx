"use client";

import { useMemo, useState, useEffect } from "react";
import { toProductPath } from "@/src/utils/slug";
import Link from "next/link";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { type Product, type ProductOption } from "@/src/core/products";
import { useToastContext } from "@/src/components/ToastProvider";
import { withUtmQuery } from "@/src/utils/utm";
import ProductDetailSkeleton from "@/src/components/ProductDetailSkeleton";
import ProductOptions from "@/src/components/ProductOptions";
import ProductInfoTabs from "@/src/components/ProductInfoTabs";
import { useGlobalLoading } from "@/src/components/GlobalLoadingProvider";
import ConfirmPurchaseModal from "@/src/components/ConfirmPurchaseModal";
import { useRouter } from "next/navigation";
import { useDataSync } from "@/src/components/DataSyncProvider";

export default function ProductDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id)
    ? params?.id[0]
    : (params?.id as string | undefined);

  // Always call ALL hooks at the top in the same order
  const router = useRouter();
  const { currentUser } = useDataSync();
  const { hideLoading, showLoading } = useGlobalLoading();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(
    null
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
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

    // Fetch product from API or redirect to canonical slug route if possible
    const fetchProduct = async () => {
      if (!id) {
        console.log("No product ID provided");
        setIsLoading(false);
        setFetchError(true);
        return;
      }

      try {
        // Try to resolve canonical route first for backward compatibility
        const res = await fetch(
          `/api/products/resolve?id=${encodeURIComponent(id)}`
        );
        if (res.ok) {
          const resolved = await res.json();
          const cat = resolved?.data?.category;
          const slug = resolved?.data?.slug;
          if (cat && slug) {
            // Redirect to SEO-friendly URL and stop further work
            router.replace(
              require("@/src/utils/slug").toProductPath(cat, slug)
            );
            return;
          }
        }

        // Fallback: fetch by id directly
        const response = await fetch(`/api/products/${id}`);
        const result = await response.json();

        if (result.success) {
          setProduct(result.data);
          setFetchError(false);
        } else {
          console.error("Failed to fetch product:", result.error);
          setProduct(null);
          setFetchError(true);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
        setFetchError(true);
      } finally {
        // Show skeleton for a brief moment
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    fetchProduct();
  }, [id, hideLoading]);

  // Handle early returns after all hooks are called
  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  // Only call notFound() after loading is complete and product is still null
  if (!product || fetchError) {
    notFound();
  }

  // Breadcrumbs
  const crumbs = [
    { href: "/", label: "Trang chủ" },
    { href: "/products", label: "Sản phẩm" },
    {
      href: toProductPath(product.category, product.title),
      label: product.title,
    },
  ];
  const badge = product.badge;
  const hasThumb = Boolean(product.imageUrl);

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* JSON-LD: Product + Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: product.description,
            image: product.imageUrl ? [product.imageUrl] : undefined,
            sku: product.id,
            category: product.category,
            offers: {
              "@type": "Offer",
              priceCurrency: product.currency,
              price: selectedOption?.price ?? product.price ?? 0,
              availability:
                (selectedOption?.stock ?? product.stock ?? 0) > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              url:
                (process.env.NEXT_PUBLIC_SITE_URL || "") +
                require("@/src/utils/slug").toProductPath(
                  product.category,
                  product.title
                ),
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Trang chủ",
                item: process.env.NEXT_PUBLIC_SITE_URL || "",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Sản phẩm",
                item: (process.env.NEXT_PUBLIC_SITE_URL || "") + "/products",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: product.title,
                item:
                  (process.env.NEXT_PUBLIC_SITE_URL || "") +
                  require("@/src/utils/slug").toProductPath(
                    product.category,
                    product.title
                  ),
              },
            ],
          }),
        }}
      />
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
            {hasThumb && !imageError ? (
              <div className="relative aspect-[16/9] md:aspect-[4/3] lg:aspect-[3/2] h-full">
                <Image
                  src={product.imageUrl!}
                  alt={product.title}
                  fill
                  sizes="(min-width: 1280px) 50vw, (min-width: 768px) 60vw, 100vw"
                  className="object-contain"
                  onError={() => {
                    console.warn(
                      "Product detail image failed to load:",
                      product.imageUrl
                    );
                    setImageError(true);
                  }}
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
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight text-amber-700">
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
              {/* Stock display - options-first approach */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedOption ? (
                  // Show stock from selected option
                  selectedOption.stock > 0 ? (
                    <span className="text-green-600 dark:text-green-400">
                      Còn {selectedOption.stock} sản phẩm
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">
                      Hết hàng
                    </span>
                  )
                ) : product.options && product.options.length > 0 ? (
                  // Product has options but none selected yet
                  <span className="text-gray-500">
                    Chọn loại sản phẩm để xem tồn kho
                  </span>
                ) : // Product without options - show main stock
                product.stock && product.stock > 0 ? (
                  <span className="text-green-600 dark:text-green-400">
                    Còn {product.stock} sản phẩm
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    Hết hàng
                  </span>
                )}
              </div>
            </div>

            {/* Product Options */}
            {product.options && product.options.length > 0 && (
              <div className="space-y-4">
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
                    // Check stock based on product structure
                    if (product.options && product.options.length > 0) {
                      // Product with options - check selected option
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
                    } else {
                      // Product without options - check main product stock
                      if (product.stock === 0) {
                        show("Sản phẩm đã hết hàng");
                        return;
                      }
                      if (product.stock && product.stock < qty) {
                        show(`Chỉ còn ${product.stock} sản phẩm`);
                        return;
                      }
                    }

                    // Open confirmation modal
                    setConfirmOpen(true);
                  } catch (e) {
                    console.error(e);
                    show("Có lỗi xảy ra khi kiểm tra đơn hàng");
                  }
                }}
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2.5 text-sm font-medium hover:opacity-90 cursor-pointer"
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
                <li>Cập nhật tài khoản tự động sau khi thanh toán</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Full-width Info Tabs in bottom half (below image and CTAs) */}
        <div className="mt-8">
          <ProductInfoTabs product={product} />
        </div>
      </div>

      {/* Confirm purchase modal */}
      <ConfirmPurchaseModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          try {
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
            setConfirmOpen(false);
            if (data.data?.credentials) {
              show("Mua hàng thành công. Thông tin tài khoản đã sẵn sàng.");
              // Redirect to orders page
              window.location.href = "/orders";
            } else {
              show(
                "Đơn hàng đang được xử lý. Vui lòng kiểm tra lịch sử đơn hàng."
              );
              window.location.href = "/orders";
            }
          } catch (e) {
            console.error(e);
            show("Có lỗi xảy ra khi tạo đơn hàng");
          }
        }}
        productTitle={product.title}
        quantity={qty}
        unitPrice={currentPrice}
        currency={product.currency}
        balance={currentUser?.balance}
      />
    </div>
  );
}
