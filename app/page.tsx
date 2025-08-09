"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Hero from "@/src/components/Hero";
import ProductCard from "@/src/components/ProductCard";
import {
  products,
  type CategoryId,
  CATEGORIES,
  type Product,
} from "@/src/core/products";

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
    const valid = new Set<CategoryId>(["all", "gaming", "social", "productivity"]);
    let initialCategory: CategoryId = valid.has((cParam as CategoryId) ?? "all")
      ? ((cParam as CategoryId) ?? "all")
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
    const params = new URLSearchParams(searchParams as any);
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

  const items = useMemo(
    () => [{ id: "all", label: "Tất cả sản phẩm", icon: "🛍️" }, ...CATEGORIES],
    []
  ) as { id: CategoryId; label: string; icon: string }[];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col items-center gap-6">
      <Hero />

      {/* Filters: search + pills */}
      <div className="w-full max-w-5xl px-6">
        <div className="flex flex-col gap-3">
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
                <div className="text-xs text-gray-500 dark:text-gray-400 px-2 pb-1">Gợi ý</div>
                <div className="flex flex-wrap gap-2 px-2 pb-2">
                  {["Premium", "TikTok", "Facebook", "CapCut"]
                    .filter((k) => k.toLowerCase().includes(q.toLowerCase()))
                    .slice(0, 5)
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

              {/* Autocomplete suggestions */}
              {q && (
                <div className="relative">
                  <div className="absolute z-10 mt-1 w-full md:w-96 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-2 pb-1">Gợi ý</div>
                    <div className="flex flex-wrap gap-2 px-2 pb-2">
                      {[
                        "Premium",
                        "TikTok",
                        "Facebook",
                        "CapCut",
                      ]
                        .filter((k) => k.toLowerCase().includes(q.toLowerCase()))
                        .slice(0, 5)
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
                </div>
              )}

            className="w-full md:w-96 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:ring-2 ring-amber-300"
          />
          <div className="flex flex-wrap gap-2">
            {items.map((c) => {
              const active = c.id === category;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors border ${
                    active
                      ? "bg-amber-50 text-gray-900 dark:bg-amber-300/10 dark:text-gray-100 border-amber-200 dark:border-amber-300/30"
                      : "text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-base leading-none">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="w-full max-w-5xl p-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filtered.map((p: Product) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
