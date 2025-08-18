"use client";

export default function SectionSkeleton({ className = "h-24" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${className}`}
      aria-busy="true"
      aria-label="Đang tải nội dung"
    />
  );
}

