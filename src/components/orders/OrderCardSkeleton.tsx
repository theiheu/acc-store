import { Skeleton } from "@/src/components/ui/Skeleton";

export default function OrderCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4">
      <div className="flex items-center gap-3 animate-pulse">
        {/* Thumbnail */}
        <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />

        {/* Info */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
          <Skeleton className="h-4 w-1/3 rounded-md" />
        </div>
      </div>
    </div>
  );
}

