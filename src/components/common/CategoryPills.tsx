"use client";

import { useMemo } from "react";
import { CATEGORIES, type CategoryId } from "@/src/core/products";

export default function CategoryPills({
  value,
  onChange,
  counts,
}: {
  value: CategoryId;
  onChange: (c: CategoryId) => void;
  counts?: Record<CategoryId, number>;
}) {
  const items = useMemo(
    () => [{ id: "all", label: "Tất cả sản phẩm", icon: "🛍️" }, ...CATEGORIES],
    []
  ) as { id: CategoryId; label: string; icon: string }[];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((c) => {
        const active = c.id === value;
        const count = counts?.[c.id] ?? 0;
        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors border ${
              active
                ? "bg-amber-50 text-gray-900 dark:bg-amber-300/10 dark:text-gray-100 border-amber-200 dark:border-amber-300/30"
                : "text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <span className="text-base leading-none">{c.icon}</span>
            <span>{c.label}</span>
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs px-2 py-0.5">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

