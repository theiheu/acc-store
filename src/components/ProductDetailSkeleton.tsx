import { Skeleton, SkeletonText } from "@/src/components/Skeleton";

export default function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <SkeletonText width="w-24" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <Skeleton className="w-full aspect-[16/9]" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <SkeletonText width="w-64" />
            <SkeletonText width="w-72" />
          </div>
          <div className="text-3xl font-bold">
            <SkeletonText width="w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="w-16 h-9 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton className="flex-1 h-10 rounded" />
            <Skeleton className="h-10 w-28 rounded" />
          </div>
          <div className="pt-4 space-y-2">
            <SkeletonText width="w-40" />
            <SkeletonText width="w-80" />
            <SkeletonText width="w-72" />
          </div>
        </div>
      </div>
    </div>
  );
}

