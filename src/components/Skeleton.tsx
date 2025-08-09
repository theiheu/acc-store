export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-800 ${className}`} />;
}

export function SkeletonText({ width = "w-24" }: { width?: string }) {
  return (
    <div className={`h-3 ${width} rounded bg-gray-200 dark:bg-gray-800 animate-pulse`} />
  );
}

