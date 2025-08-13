"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/src/components/ProductCard";
import CategorySidebar from "@/src/components/CategorySidebar";
import { type CategoryId } from "@/src/core/products";
import { useProducts } from "@/src/components/DataSyncProvider";

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const products = useProducts(); // Get real-time products

  const [category, setCategory] = useState<CategoryId>("all");
  const [q, setQ] = useState<string>("");
  const [debouncedQ, setDebouncedQ] = useState<string>("");
  const [showSuggest, setShowSuggest] = useState(false);

  // Sync state from URL on mount
  useEffect(() => {
    const c = (searchParams.get("category") as CategoryId | null) ?? "all";
    const qParam = (searchParams.get("q") as string | null) ?? "";
    const valid = ["all", "gaming", "social", "productivity"] as const;
    setCategory(valid.includes(c as any) ? (c as CategoryId) : "all");
    setQ(qParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce 250ms for search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Update URL and persist when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams as any);
    if (category === "all") params.delete("category");
    else params.set("category", category);
    if (debouncedQ) params.set("q", debouncedQ);
    else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products");
    try {
      window.localStorage.setItem(
        "products:filters",
        JSON.stringify({ category, q: debouncedQ })
      );
    } catch {}
  }, [category, debouncedQ, router, searchParams]);

  const normalized = (s: string) => s.toLowerCase();

  const counts = useMemo(() => {
    const textFiltered = products.filter((p) => {
      if (!q.trim()) return true;
      const t = `${p.title} ${p.description}`;
      return normalized(t).includes(normalized(q));
    });
    return {
      all: textFiltered.length,
      gaming: textFiltered.filter((p) => p.category === "gaming").length,
      social: textFiltered.filter((p) => p.category === "social").length,
      productivity: textFiltered.filter((p) => p.category === "productivity")
        .length,
    } as Record<CategoryId, number>;
  }, [q]);

  const filtered = useMemo(() => {
    let list = products;
    <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
      {counts.all} sản phẩm
    </div>;

    if (q.trim()) {
      list = list.filter((p) =>
        normalized(`${p.title} ${p.description}`).includes(normalized(q))
      );
    }
    if (category !== "all") list = list.filter((p) => p.category === category);
    return list;
  }, [category, q]);

  return (
    <div className="mx-auto max-w-6xl xl:max-w-7xl 2xl:max-w-[88rem] px-4 lg:px-6 py-8">
      <h1 className="text-2xl lg:text-3xl font-semibold mb-6 lg:mb-8">
        Sản phẩm
      </h1>
      <div className="mb-4">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm kiếm theo tên hoặc mô tả..."
          className="w-full md:w-96 lg:w-[28rem] rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:ring-2 ring-amber-300"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex-1">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Không có sản phẩm phù hợp.
            <button
              onClick={() => {
                setQ("");
                setCategory("all");
              }}
              className="ml-2 underline"
            >
              Xóa lọc
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start gap-6 lg:gap-8">
        <div className="sticky top-24 hidden md:block md:w-64 shrink-0">
          <CategorySidebar
            value={category}
            onChange={setCategory}
            counts={counts}
          />
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 justify-items-center sm:justify-items-stretch gap-6 lg:gap-7 xl:gap-8">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
