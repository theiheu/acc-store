"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

interface ProductImageProps {
  imageUrl?: string;
  imageEmoji?: string;
  title: string;
  className?: string;
}

export default function ProductImage({ 
  imageUrl, 
  imageEmoji, 
  title, 
  className = "" 
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => {
    console.warn("Product image failed to load:", imageUrl);
    setImageError(true);
  }, [imageUrl]);

  const hasValidImage = Boolean(imageUrl) && !imageError;

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col ${className}`}>
      {hasValidImage ? (
        <div className="relative aspect-[16/9] md:aspect-[4/3] lg:aspect-[3/2] h-full">
          <Image
            src={imageUrl!}
            alt={title}
            fill
            sizes="(min-width: 1280px) 50vw, (min-width: 768px) 60vw, 100vw"
            className="object-contain"
            onError={handleImageError}
            priority
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-300/20 dark:to-amber-300/10 flex items-center justify-center">
          <span className="text-7xl" role="img" aria-label={title}>
            {imageEmoji ?? "🛍️"}
          </span>
        </div>
      )}
    </div>
  );
}
