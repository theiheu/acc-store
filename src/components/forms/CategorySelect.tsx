"use client";

import { useMemo, useState } from "react";
import { useCategoryItems, useCategorySearch } from "@/src/hooks/useCategories";
import { Category } from "@/src/services/CategoryService";

interface CategorySelectProps {
  value: string; // slug
  onChange: (slug: string) => void;
}

export default function CategorySelect({
  value,
  onChange,
}: CategorySelectProps) {
  const { items } = useCategoryItems();
  const [q, setQ] = useState("");

  // Convert items to categories for search
  const categories = useMemo(
    () =>
      items
        .filter((item) => item.id !== "all")
        .map(
          (item) =>
            ({
              id: item.id,
              name: item.label,
              slug: item.slug,
              icon: item.icon,
              isActive: item.isActive,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as Category)
        ),
    [items]
  );

  const filtered = useCategorySearch(categories, q);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm danh mục..."
        className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
      />
      <div className="max-h-48 overflow-auto rounded-md border border-gray-200 dark:border-gray-800 divide-y">
        {filtered.map((c) => {
          const active = c.slug === value;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.slug)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-amber-50 dark:hover:bg-amber-900/10 ${
                active ? "bg-amber-50 dark:bg-amber-900/10" : ""
              }`}
            >
              <span className="text-base leading-none">{c.icon || "🏷️"}</span>
              <span className="flex-1">
                <span className="font-medium">{c.name}</span>
                <span className="ml-2 text-xs text-gray-500">/{c.slug}</span>
              </span>
              {active && (
                <span className="text-amber-600 text-xs">Đang chọn</span>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-sm text-gray-500">
            Không tìm thấy danh mục
          </div>
        )}
      </div>
    </div>
  );
}
