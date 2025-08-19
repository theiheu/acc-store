import { Skeleton, SkeletonText } from "@/src/components/ui/Skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Image Skeleton */}
      <Skeleton className="w-full aspect-[4/3]" />

      {/* Content Skeleton (fill remaining space) */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title and Description */}
        <div className="space-y-2">
          <SkeletonText width="w-48" />
          <SkeletonText width="w-56" />
          <SkeletonText width="w-32" />
        </div>

        {/* Spacer */}
        <div className="mt-3 sm:mt-4 flex-1" />

        {/* Price Section (stick to bottom) */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          {/* Left: Price group aligned to baseline */}
          <div className="flex items-baseline gap-1.5 sm:gap-2 flex-1 min-w-0">
            <SkeletonText width="w-10" />
            <SkeletonText width="w-24" />
            <SkeletonText width="w-16" />
          </div>
          {/* Right: Action indicator, center vertically */}
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}
