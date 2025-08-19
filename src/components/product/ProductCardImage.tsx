"use client";

import Image from "next/image";
import { useState, useCallback, memo } from "react";

interface ProductCardImageProps {
  imageUrl?: string;
  imageEmoji?: string;
  title: string;
  badge?: string;
}

const ProductCardImage = memo(function ProductCardImage({
  imageUrl,
  imageEmoji,
  title,
  badge,
}: ProductCardImageProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => {
    console.warn("Image failed to load:", imageUrl);
    setImageError(true);
  }, [imageUrl]);

  const getBadgeStyles = useCallback((badgeType: string) => {
    return badgeType === "hot"
      ? "bg-red-500/90 text-white border-red-400/50 shadow-red-500/25"
      : "bg-emerald-500/90 text-white border-emerald-400/50 shadow-emerald-500/25";
  }, []);

  const getBadgeText = useCallback((badgeType: string) => {
    return badgeType === "hot" ? "🔥 Hot" : "✨ Mới";
  }, []);

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 dark:bg-gray-800/50">
      {imageUrl && !imageError ? (
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover object-center transition-transform duration-500 ease-out transform-gpu"
          onError={handleImageError}
          priority={false}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 dark:from-amber-900/30 dark:via-amber-800/20 dark:to-amber-700/10 flex items-center justify-center">
          <span 
            className="text-6xl opacity-80 transform transition-transform duration-300 ease-out"
            role="img"
            aria-label={title}
          >
            {imageEmoji ?? "🛍️"}
          </span>
        </div>
      )}

      {/* Badge */}
      {badge && (
        <div className="absolute top-3 right-3 z-10">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-lg backdrop-blur-sm border ${getBadgeStyles(badge)}`}
          >
            {getBadgeText(badge)}
          </span>
        </div>
      )}

      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
});

export default ProductCardImage;
