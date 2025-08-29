"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/src/core/products";

interface AddToCartToastProps {
  product: Product;
}

export default function AddToCartToast({ product }: AddToCartToastProps) {
  return (
    <div className="flex items-center gap-4">
      <Image
        src={product.imageUrl || ""}
        alt={product.title}
        width={48}
        height={48}
        className="w-12 h-12 rounded-md object-cover"
      />
      <div className="flex-grow">
        <p className="text-sm font-medium">Đã thêm vào giỏ hàng!</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
          {product.title}
        </p>
      </div>
      <Link
        href="/cart"
        className="ml-4 px-3 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      >
        Xem giỏ hàng
      </Link>
    </div>
  );
}
