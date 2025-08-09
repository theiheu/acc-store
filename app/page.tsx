"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Hero from "@/src/components/Hero";
import ProductCard from "@/src/components/ProductCard";

import CategorySidebar from "@/src/components/CategorySidebar";
import { products, type CategoryId, type Product } from "@/src/core/products";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<CategoryId>("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);

  // Sync from URL/localStorage
  useEffect(() => {
    const cParam = searchParams.get("category") as CategoryId | null;
    const qParam = (searchParams.get("q") as string | null) ?? "";
    const valid = new Set<CategoryId>([
      "all",
      "gaming",
      "social",
      "productivity",
    ]);
    let initialCategory: CategoryId = valid.has((cParam as CategoryId) ?? "all")
      ? (cParam as CategoryId) ?? "all"
      : "all";
    let initialQ = qParam;
    try {
      const raw = window.localStorage.getItem("products:filters");
      if (raw) {
        const saved = JSON.parse(raw) as { category?: CategoryId; q?: string };
        if (!cParam && saved.category && valid.has(saved.category)) {
          initialCategory = saved.category;
        }
        if (!qParam && typeof saved.q === "string") {
          initialQ = saved.q;
        }
      }
    } catch {}
    setCategory(initialCategory);
    setQ(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

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

  const counts = useMemo(() => {
    const textFiltered = products.filter((p: Product) => {
      if (!debouncedQ) return true;
      const t = `${p.title} ${p.description}`;
      return t.toLowerCase().includes(debouncedQ.toLowerCase());
    });
    return {
      all: textFiltered.length,
      gaming: textFiltered.filter((p) => p.category === "gaming").length,
      social: textFiltered.filter((p) => p.category === "social").length,
      productivity: textFiltered.filter((p) => p.category === "productivity")
        .length,
    } as Record<CategoryId, number>;
  }, [debouncedQ]);

  const filtered = useMemo(() => {
    let list: Product[] = products;
    if (debouncedQ) {
      list = list.filter((p: Product) =>
        normalized(`${p.title} ${p.description}`).includes(
          normalized(debouncedQ)
        )
      );
    }
    if (category !== "all")
      list = list.filter((p: Product) => p.category === category);
    return list;
  }, [category, debouncedQ]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col items-center gap-6">
      <Hero />

      {/* Filters + Sidebar layout */}
      <div className="w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[88rem] px-4 lg:px-6 mb-4">
        <div className="flex flex-col md:flex-row items-start gap-4 lg:gap-8">
          <div className="md:w-64 md:sticky md:top-24 w-full shrink-0">
            <CategorySidebar
              value={category}
              onChange={setCategory}
              counts={counts}
            />
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
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
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
            {filtered.length === 0 ? (
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 justify-items-center sm:justify-items-stretch gap-6 lg:gap-7 xl:gap-8">
                {filtered.map((p: Product) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
