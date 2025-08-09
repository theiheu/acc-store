import { Skeleton, SkeletonText } from "@/src/components/Skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <Skeleton className="w-full aspect-[16/9]" />
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <SkeletonText width="w-40" />
            <SkeletonText width="w-56" />
          </div>
          <Skeleton className="h-7 w-16 rounded" />
        </div>
        <div className="text-lg font-semibold">
          <SkeletonText width="w-24" />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="flex-1 h-9 rounded" />
          <Skeleton className="h-9 w-28 rounded" />
        </div>
      </div>
    </div>
  );
}

