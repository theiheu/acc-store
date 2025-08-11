import { Skeleton, SkeletonText } from "./Skeleton";
import ProductCardSkeleton from "./ProductCardSkeleton";

export default function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col items-center gap-6">
      {/* Hero Skeleton */}
      <section className="w-full border-b border-gray-200 dark:border-gray-800 bg-gradient-to-b from-amber-100/40 to-transparent dark:from-amber-300/10">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center space-y-3">
          <Skeleton className="h-9 w-96 mx-auto rounded" />
          <Skeleton className="h-5 w-80 mx-auto rounded" />
        </div>
      </section>

      {/* Content Skeleton */}
      <div className="w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[88rem] px-4 lg:px-6 mb-4">
        <div className="flex flex-col md:flex-row items-start gap-4 lg:gap-8">
          {/* Sidebar Skeleton */}
          <div className="md:w-64 md:sticky md:top-24 w-full shrink-0">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4 space-y-3">
              <SkeletonText width="w-24" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <SkeletonText width="w-20" />
                    <Skeleton className="h-5 w-6 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="flex-1 w-full">
            {/* Search Skeleton */}
            <div className="mb-3">
              <Skeleton className="h-10 w-full md:w-96 rounded-md" />
            </div>

            {/* Product Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 justify-items-center sm:justify-items-stretch gap-6 lg:gap-7 xl:gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
