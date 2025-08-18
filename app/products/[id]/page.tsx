"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { toProductPath, slugify } from "@/src/utils/slug";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { type Product, type ProductOption } from "@/src/core/products";
import { useToastContext } from "@/src/components/ToastProvider";

import ProductDetailSkeleton from "@/src/components/ProductDetailSkeleton";
import ProductInfoTabs from "@/src/components/ProductInfoTabs";
import ProductImage from "@/src/components/ProductImage";
import ProductPurchaseForm from "@/src/components/ProductPurchaseForm";
import { useGlobalLoading } from "@/src/components/GlobalLoadingProvider";
import ConfirmPurchaseModal from "@/src/components/ConfirmPurchaseModal";
import { useDataSync } from "@/src/components/DataSyncProvider";

// Custom hook for product data fetching
function useProductData(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setFetchError(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setFetchError(false);

      const response = await fetch(
        `/api/products/resolve?id=${encodeURIComponent(id)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const resolveData = await response.json();

      if (!resolveData.success || !resolveData.data?.id) {
        throw new Error("Product not found");
      }

      // Now fetch the actual product data
      const productResponse = await fetch(
        `/api/products/${resolveData.data.id}`
      );

      if (!productResponse.ok) {
        throw new Error(`HTTP ${productResponse.status}`);
      }

      const productData = await productResponse.json();

      if (!productData.success || !productData.data) {
        throw new Error("Product data not found");
      }

      setProduct(productData.data);
    } catch (error) {
      console.error("Error fetching product:", error);
      setFetchError(true);
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, isLoading, fetchError, refetch: fetchProduct };
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id)
    ? params?.id[0]
    : (params?.id as string | undefined);

  // Always call ALL hooks at the top in the same order
  const { currentUser } = useDataSync();
  const { hideLoading, showLoading } = useGlobalLoading();
  const { product, isLoading, fetchError } = useProductData(id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { show } = useToastContext();

  // Simplified state for purchase form
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(
    null
  );
  const [qty, setQty] = useState(1);

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

  // Generate canonical URL for SEO
  const canonicalUrl = useMemo(() => {
    if (!product) return "";
    const slug = slugify(product.title);
    return (
      (process.env.NEXT_PUBLIC_SITE_URL || "") +
      toProductPath(product.category, slug)
    );
  }, [product]);

  // Optimized purchase handler
  const handlePurchaseClick = useCallback(() => {
    if (!product) return;

    try {
      // Check stock based on product structure
      let availableStock = 0;
      if (product.options && product.options.length > 0) {
        if (!selectedOption) {
          show("Vui lòng chọn loại sản phẩm");
          return;
        }
        availableStock = selectedOption.stock || 0;
      } else {
        availableStock = product.stock || 0;
      }

      if (qty > availableStock) {
        show(`Chỉ còn ${availableStock} sản phẩm trong kho`);
        return;
      }

      if (!currentUser) {
        show("Vui lòng đăng nhập để mua hàng");
        return;
      }

      if ((currentUser.balance || 0) < currentPrice * qty) {
        show("Số dư không đủ. Vui lòng nạp thêm tiền");
        return;
      }

      setConfirmOpen(true);
    } catch (error) {
      console.error("Error in purchase handler:", error);
      show("Có lỗi xảy ra. Vui lòng thử lại");
    }
  }, [product, selectedOption, qty, currentUser, currentPrice, show]);

  const handleTopUp = useCallback(() => {
    showLoading("Đang chuyển đến nạp tiền...");
    show("Đã chuyển sang trang nạp tiền");
  }, [showLoading, show]);

  // Memoized breadcrumbs (must be before early returns)
  const crumbs = useMemo(() => {
    if (!product) return [];

    const slug = slugify(product.title);
    return [
      { href: "/", label: "Trang chủ" },
      { href: "/products", label: "Sản phẩm" },
      {
        href: toProductPath(product.category, slug),
        label: product.title,
      },
    ];
  }, [product]);

  // Hide loading on mount
  useEffect(() => {
    hideLoading();
  }, [hideLoading]);

  // Handle early returns after all hooks are called
  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  // Only call notFound() after loading is complete and product is still null
  if (!product || fetchError) {
    notFound();
  }

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
              url: canonicalUrl,
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
                item: canonicalUrl,
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
          <ProductImage
            imageUrl={product.imageUrl}
            imageEmoji={product.imageEmoji}
            title={product.title}
          />

          <ProductPurchaseForm
            product={product}
            currentPrice={currentPrice}
            fmt={fmt}
            selectedOption={selectedOption}
            qty={qty}
            onPurchase={handlePurchaseClick}
            onTopUp={handleTopUp}
            onOptionChange={setSelectedOption}
            onQuantityChange={setQty}
          />
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
