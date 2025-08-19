"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/src/components/product/ProductCard";
import ProductCardSkeleton from "@/src/components/ui/ProductCardSkeleton";
import EmptyState from "@/src/components/ui/EmptyState";
import CategorySidebar from "@/src/components/layout/CategorySidebar";
import DebugPanel from "@/src/components/ui/DebugPanel";
import { useProductsWithLoading } from "@/src/components/providers/DataSyncProvider";
import { useCategoryCounts, useProductFilter } from "@/src/hooks/useCategories";

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products, isLoading } = useProductsWithLoading();

  // Get real-time products with loading state

  const [category, setCategory] = useState<string>("all");
  const [q, setQ] = useState<string>("");
  const [debouncedQ, setDebouncedQ] = useState<string>("");
  const [showSuggest, setShowSuggest] = useState(false);

  // Sync state from URL on mount
  useEffect(() => {
    const c = (searchParams.get("category") as string | null) ?? "all";
    const qParam = (searchParams.get("q") as string | null) ?? "";
    setCategory(c || "all");
    setQ(qParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also react to URL changes (e.g., when navigating via sidebar links)
  useEffect(() => {
    const c = (searchParams.get("category") as string | null) ?? "all";
    const qParam = (searchParams.get("q") as string | null) ?? "";
    if (c && c !== category) setCategory(c);
    if (qParam !== q) setQ(qParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  // Use optimized hooks for category operations
  // Counts should be derived from the currently visible product set per search query
  const counts = useCategoryCounts(products, debouncedQ);
  const filtered = useProductFilter(products, category, q);

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

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
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
          {filtered.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon="🔍"
                title="Không tìm thấy sản phẩm nào"
                description={
                  q
                    ? "Hãy thử từ khóa khác hoặc xóa bộ lọc."
                    : "Hiện chưa có sản phẩm để hiển thị."
                }
                primaryAction={
                  q
                    ? { label: "Xem tất cả sản phẩm", href: "/products" }
                    : { label: "Về trang chủ", href: "/" }
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 justify-items-center sm:justify-items-stretch gap-6 lg:gap-7 xl:gap-8">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
      <DebugPanel />
    </div>
  );
}
