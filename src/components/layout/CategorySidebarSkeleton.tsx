import { Skeleton } from "@/src/components/ui/Skeleton";

export default function CategorySidebarSkeleton() {
  return (
    <div className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 animate-pulse">
      <Skeleton className="h-6 w-3/4 mb-4 rounded-md" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-5 w-2/3 rounded-md" />
            <Skeleton className="h-5 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

