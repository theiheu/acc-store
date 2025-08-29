"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { toProductPath, slugify } from "@/src/utils/slug";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { type Product, type ProductOption } from "@/src/core/products";
import { useToastContext } from "@/src/components/providers/ToastProvider";
import { useCart } from "@/src/components/providers/CartProvider";

import ProductDetailSkeleton from "@/src/components/ui/ProductDetailSkeleton";
import ProductInfoTabs from "@/src/components/product/ProductInfoTabs";
import ProductImage from "@/src/components/product/ProductImage";
import ProductPurchaseForm from "@/src/components/forms/ProductPurchaseForm";
import { useGlobalLoading } from "@/src/components/providers/GlobalLoadingProvider";

import { useDataSync } from "@/src/components/providers/DataSyncProvider";
import { useRealtimeUpdates } from "@/src/hooks/useRealtimeUpdates";

interface Props {
  initialId: string;
}

// Custom hook for product data fetching with real-time updates
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

  // Listen for real-time product updates
  useRealtimeUpdates({
    onProductUpdated: useCallback(
      (data: any) => {
        // Check if this is the product we're currently viewing
        if (product && data.id === product.id) {
          // Convert admin product data to public product format
          const updatedProduct: Product = {
            id: data.id,
            title: data.title,
            description: data.description,
            longDescription: data.longDescription,
            price: data.price,
            currency: data.currency,
            imageEmoji: data.imageEmoji,
            imageUrl: data.imageUrl,
            badge: data.badge,
            category: data.category,
            options: data.options,
            faqs: data.faqs || [],
          };
          setProduct(updatedProduct);
        }
      },
      [product]
    ),
    showNotifications: false,
  });

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, isLoading, fetchError, refetch: fetchProduct };
}

export default function ProductDetailClient({ initialId }: Props) {
  const id = initialId;

  // Always call ALL hooks at the top in the same order
  const { currentUser } = useDataSync();
  const { hideLoading, showLoading } = useGlobalLoading();
  const { product, isLoading, fetchError } = useProductData(id);
  const { dispatch } = useCart();
  const { show } = useToastContext();
  const router = useRouter();

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

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    // Validate that an option is selected if the product has options
    if (product.options && product.options.length > 0 && !selectedOption) {
      show("Vui lòng chọn một loại sản phẩm.");
      return;
    }

    dispatch({
      type: "ADD_ITEM",
      item: { product, option: selectedOption, quantity: qty },
    });
    show(`Đã thêm "${product.title}" vào giỏ hàng!`);
  }, [product, selectedOption, qty, dispatch, show]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;

    // Validate that an option is selected if the product has options
    if (product.options && product.options.length > 0 && !selectedOption) {
      show("Vui lòng chọn một loại sản phẩm.");
      return;
    }

    dispatch({
      type: "ADD_ITEM",
      item: { product, option: selectedOption, quantity: qty },
    });
    router.push("/cart");
  }, [product, selectedOption, qty, dispatch, router, show]);

  // Memoized breadcrumbs (must be before early returns)
  const crumbs = useMemo(() => {
    if (!product) return [] as Array<{ href: string; label: string }>;

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
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onOptionChange={setSelectedOption}
            onQuantityChange={setQty}
          />
        </div>

        {/* Full-width Info Tabs in bottom half (below image and CTAs) */}
        <div className="mt-8">
          <ProductInfoTabs product={product} />
        </div>
      </div>
    </div>
  );
}
