"use client";
import Link from "next/link";
import { useMemo, useCallback, memo } from "react";
import { toProductPath, slugify } from "@/src/utils/slug";
import type { Product } from "@/src/core/products";
import { useGlobalLoading } from "../providers/GlobalLoadingProvider";
import ProductCardImage from "./ProductCardImage";
import ProductCardPrice from "./ProductCardPrice";
import ProductCardContent from "./ProductCardContent";

interface ProductCardProps {
  product: Product;
}

const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const { showLoading } = useGlobalLoading();

  // Generate SEO-friendly product path
  const productPath = useMemo(() => {
    const slug = slugify(product.title);
    return toProductPath(product.category, slug);
  }, [product.category, product.title]);

  // Optimized click handler
  const handleClick = useCallback(() => {
    showLoading("Đang tải sản phẩm...");
  }, [showLoading]);

  return (
    <Link
      href={productPath}
      onClick={handleClick}
      className="group flex flex-col h-full w-full max-w-[22rem] sm:max-w-none rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl hover:shadow-gray-200/20 dark:hover:shadow-gray-900/20 overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer backdrop-blur-sm"
    >
      <ProductCardImage
        imageUrl={product.imageUrl}
        imageEmoji={product.imageEmoji}
        title={product.title}
        badge={product.badge}
      />

      <ProductCardContent
        title={product.title}
        description={product.description}
      />

      <ProductCardPrice product={product} />
    </Link>
  );
});

export default ProductCard;
