import { Skeleton } from "./Skeleton";

export default function CategoryListSkeleton() {
  return (
    <div className="w-full overflow-hidden">
      <div className="flex animate-pulse items-center gap-4 md:gap-6 lg:gap-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

