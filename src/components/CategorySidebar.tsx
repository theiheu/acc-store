"use client";

import { useState, useMemo } from "react";
import { CATEGORIES, type CategoryId } from "@/src/core/products";

export default function CategorySidebar({
  value,
  onChange,
  counts,
}: {
  value: CategoryId;
  onChange: (c: CategoryId) => void;
  counts?: Record<CategoryId, number>;
}) {
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () => [{ id: "all", label: "Tất cả sản phẩm", icon: "🛍️" }, ...CATEGORIES],
    []
  ) as { id: CategoryId; label: string; icon: string }[];

  const activeItem = items.find((i) => i.id === value);

  return (
    <aside className="md:w-64">
      {/* Toggle for mobile */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="md:hidden mb-4 inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 w-full"
      >
        <span>{activeItem?.icon}</span>
        <span className="truncate">{activeItem?.label}</span>
        {counts && (
          <span className="ml-auto inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs px-2 py-0.5">
            {counts[value] ?? 0}
          </span>
        )}
        <span
          className={`ml-2 transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
        >
          ▾
        </span>
      </button>

      <div
        className={`origin-top-left md:origin-left transition-all duration-200 ${
          open
            ? "max-h-[60vh] opacity-100"
            : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
        } md:opacity-100 md:max-h-none overflow-hidden`}
      >
        <nav className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-2">
          {items.map((c) => {
            const active = c.id === value;
            return (
              <button
                key={c.id}
                onClick={() => onChange(c.id)}
                className={`w-full text-left flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-amber-50 text-gray-900 dark:bg-amber-300/10 dark:text-gray-100 border border-amber-200 dark:border-amber-300/30"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <span className="text-base leading-none">{c.icon}</span>
                <span className="flex-1 truncate">{c.label}</span>
                {counts && (
                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs px-2 py-0.5">
                    {counts[c.id] ?? 0}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
