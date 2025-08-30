"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Hero from "@/src/components/layout/Hero";
import ProductCard from "@/src/components/product/ProductCard";
import ProductCardSkeleton from "@/src/components/ui/ProductCardSkeleton";
import HomePageSkeleton from "@/src/components/ui/HomePageSkeleton";
import EmptyState from "@/src/components/ui/EmptyState";
import CategorySidebar from "@/src/components/layout/CategorySidebar";
import CategorySidebarSkeleton from "@/src/components/layout/CategorySidebarSkeleton";
import CategoryListSkeleton from "@/src/components/ui/CategoryListSkeleton";
import { useProductsWithLoading } from "@/src/components/providers/DataSyncProvider";
import { useCategoryCounts, useProductFilter } from "@/src/hooks/useCategories";
import { type Category } from "@/src/core/categories";
import { type Product } from "@/src/core/products";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products, isLoading: isLoadingProducts } = useProductsWithLoading();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [category, setCategory] = useState<string>("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Initial loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Sync from URL/localStorage (accept dynamic category slugs)
  useEffect(() => {
    const cParam = (searchParams.get("category") as string | null) ?? "all";
    const qParam = (searchParams.get("q") as string | null) ?? "";
    let initialCategory: string = cParam || "all";
    let initialQ = qParam;
    try {
      const raw = window.localStorage.getItem("products:filters");
      if (raw) {
        const saved = JSON.parse(raw) as { category?: string; q?: string };
        if (!cParam && saved.category) {
          initialCategory = saved.category;
        }
        if (!qParam && typeof saved.q === "string") {
          initialQ = saved.q;
        }
      }
    } catch {}
    setCategory(initialCategory);
    setQ(initialQ);
  }, []);

  useEffect(() => {
    if (q.trim() !== debouncedQ) {
      setIsSearching(true);
    }
    const t = setTimeout(() => {
      setDebouncedQ(q.trim());
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q, debouncedQ]);

  // Update URL + persist
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (category === "all") params.delete("category");
    else params.set("category", category);
    if (debouncedQ) params.set("q", debouncedQ);
    else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/");
    try {
      window.localStorage.setItem(
        "products:filters",
        JSON.stringify({ category, q: debouncedQ })
      );
    } catch {}
  }, [category, debouncedQ, router, searchParams]);

  const normalized = (s: string) => s.toLowerCase();

  // Use the same optimized counting logic as products page - ALWAYS call hooks
  const counts = useCategoryCounts(products, debouncedQ);

  // Use the same optimized filtering logic as products page - ALWAYS call hooks
  const filtered = useProductFilter(products, category, debouncedQ);

  // Handle filtering loading state
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [category, debouncedQ]);

  // Early return AFTER all hooks are called
  if (isInitialLoading) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col items-center gap-6">
      <Hero />

      {/* Filters + Sidebar layout */}
      <div className="w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[88rem] px-4 lg:px-6 mb-4">
        <div className="flex flex-col md:flex-row items-start gap-4 lg:gap-8">
          <div className="md:w-64 md:sticky md:top-24 w-full shrink-0">
            {isLoadingProducts ? (
              <CategorySidebarSkeleton />
            ) : (
              <CategorySidebar
                value={category}
                onChange={setCategory}
                counts={counts}
              />
            )}
          </div>
          <div className="flex-1 w-full">
            <div className="mb-3">
              <div className="relative">
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                  placeholder="Tìm kiếm theo tên hoặc mô tả..."
                  className="w-full md:w-96 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:ring-2 ring-amber-300"
                />
                {showSuggest && q && (
                  <div className="absolute z-10 mt-1 w-full md:w-96 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-2 pb-1">
                      Gợi ý
                    </div>
                    <div className="flex flex-wrap gap-2 px-2 pb-2">
                      {[
                        ...new Set(
                          products.flatMap((p) => [p.title, p.description])
                        ),
                      ]
                        .filter(
                          (k) => k && k.toLowerCase().includes(q.toLowerCase())
                        )
                        .slice(0, 6)
                        .map((k) => (
                          <button
                            key={k}
                            onClick={() => setQ(k)}
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            🔎 {k}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Product grid */}
            {isFiltering || isSearching || isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 justify-items-center sm:justify-items-stretch gap-6 lg:gap-7 xl:gap-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  icon="📦"
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
                {filtered.map((p: Product, i: number) => (
                  <ProductCard key={p.id} product={p} priority={i < 4} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
