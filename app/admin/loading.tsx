"use client";

import SectionSkeleton from "@/src/components/admin/SectionSkeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-4">
      <SectionSkeleton className="h-28" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionSkeleton className="h-64" />
        <SectionSkeleton className="h-64" />
        <SectionSkeleton className="h-64 lg:col-span-2" />
      </div>
    </div>
  );
}

