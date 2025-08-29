"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/src/components/product/ProductCard";
import ProductCardSkeleton from "@/src/components/ui/ProductCardSkeleton";
import EmptyState from "@/src/components/ui/EmptyState";
import Pagination from "@/src/components/ui/Pagination";
import CategorySidebar from "@/src/components/layout/CategorySidebar";
import CategorySidebarSkeleton from "@/src/components/layout/CategorySidebarSkeleton";

import { useCategoryCounts, useProductFilter } from "@/src/hooks/useCategories";
import type { Product } from "@/src/core/products";

interface Props {
  initialProducts: Product[];
  initialCategory?: string;
  initialQ?: string;
}

export default function ProductListingClient({
  initialProducts,
  initialCategory = "all",
  initialQ = "",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [category, setCategory] = useState<string>(initialCategory || "all");
  const [q, setQ] = useState<string>(initialQ || "");
  const [debouncedQ, setDebouncedQ] = useState<string>(initialQ || "");

  // Sync from URL on mount and when changes
  useEffect(() => {
    const c =
      (searchParams.get("category") as string | null) ?? initialCategory;
    const qParam = (searchParams.get("q") as string | null) ?? initialQ;
    if (c && c !== category) setCategory(c);
    if ((qParam || "") !== q) setQ(qParam || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounce 250ms for search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams as any);
    if (category === "all") params.delete("category");
    else params.set("category", category);
    if (debouncedQ) params.set("q", debouncedQ);
    else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products");
  }, [category, debouncedQ, router, searchParams]);

  // Fetch products when filters change
  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (category && category !== "all") params.set("category", category);
        if (debouncedQ) params.set("search", debouncedQ);
        params.set("page", currentPage.toString());

        const res = await fetch(`/api/products?${params.toString()}`);
        const json = await res.json();

        if (mounted && json?.success) {
          setProducts(json.data as Product[]);
          setTotalPages(json.totalPages || 1);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    fetchProducts();
    return () => {
      mounted = false;
    };
  }, [category, debouncedQ, currentPage]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [category, debouncedQ]);

  // Counts and filtering
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

      <div className="flex items-start gap-6 lg:gap-8">
        <div className="sticky top-24 hidden md:block md:w-64 shrink-0">
          {isLoading ? (
            <CategorySidebarSkeleton />
          ) : (
            <CategorySidebar
              value={category}
              onChange={setCategory}
              counts={counts}
            />
          )}
        </div>
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 justify-items-center sm:justify-items-stretch gap-6 lg:gap-7 xl:gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
