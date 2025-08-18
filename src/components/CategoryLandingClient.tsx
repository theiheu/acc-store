"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useProductsWithLoading } from "@/src/components/DataSyncProvider";
import ProductCard from "@/src/components/ProductCard";
import ProductCardSkeleton from "@/src/components/ProductCardSkeleton";
import EmptyState from "@/src/components/EmptyState";
import { useToastContext } from "@/src/components/ToastProvider";
import {
  AdminPermissionGate,
  AdminAuthProvider,
} from "@/src/components/AdminAuthProvider";
import FeaturedProductsSelector from "@/src/components/FeaturedProductsSelector";

export default function CategoryLandingClient({
  slug,
  category,
}: {
  slug: string;
  category: { id: string; name: string; description?: string };
}) {
  const { products, isLoading } = useProductsWithLoading();
  const { show } = useToastContext();

  // UI state
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [sort, setSort] = useState("newest"); // newest | price_asc | price_desc | stock
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Filter products belonging to this category
  const categoryProducts = useMemo(() => {
    let list = products.filter((p) => p.category === slug);

    if (debouncedQ) {
      const ql = debouncedQ.toLowerCase();
      list = list.filter((p) =>
        `${p.title} ${p.description || ""}`.toLowerCase().includes(ql)
      );
    }

    if (inStockOnly) {
      list = list.filter((p) => (p.stock || 0) > 0);
    }

    switch (sort) {
      case "price_asc":
        list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_desc":
        list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "stock":
        list = [...list].sort((a, b) => (b.stock || 0) - (a.stock || 0));
        break;
      default:
        // newest by createdAt then sold desc
        list = [...list].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (db !== da) return db - da;
          return (b.sold || 0) - (a.sold || 0);
        });
    }

    return list;
  }, [products, slug, debouncedQ, inStockOnly, sort]);

  // Admin actions: add products to this category
  async function addProductsToCategory(ids: string[]) {
    try {
      if (!ids.length) return;
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin/products/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: slug }),
          }).then((r) => r.json())
        )
      );
      const ok = results.filter((r) => r.success).length;
      show(`Đã thêm ${ok}/${ids.length} sản phẩm vào danh mục`);
    } catch (e) {
      show("Không thể thêm sản phẩm vào danh mục");
    }
  }

  async function removeProductFromCategory(id: string) {
    if (!confirm("Gỡ sản phẩm khỏi danh mục này?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "uncategorized" }),
      });
      const json = await res.json();
      if (json.success) {
        show("Đã gỡ sản phẩm khỏi danh mục");
      } else {
        show(json.error || "Không thể gỡ sản phẩm");
      }
    } catch (e) {
      show("Có lỗi khi gỡ sản phẩm");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-6xl xl:max-w-7xl 2xl:max-w-[88rem] px-4 lg:px-6 py-6 lg:py-8">
        {/* Breadcrumb */}
        <nav
          className="text-sm text-gray-600 dark:text-gray-300 mb-4"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:underline">
                Trang chủ
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/products" className="hover:underline">
                Sản phẩm
              </Link>
            </li>
            <li>/</li>
            <li className="font-medium text-gray-900 dark:text-gray-100">
              {category.name}
            </li>
          </ol>
        </nav>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl lg:text-3xl font-semibold">
            {category.name}
          </h1>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {categoryProducts.length.toLocaleString()} sản phẩm
          </span>
        </div>

        {category.description && (
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            {category.description}
          </p>
        )}

        {/* Filters + Admin action bar */}
        <div className="flex flex-col lg:flex-row items-start gap-3 lg:gap-4 mb-4">
          <div className="flex-1 w-full flex items-center gap-2">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm theo tên hoặc mô tả..."
              className="w-full lg:w-96 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:ring-2 ring-amber-300"
            />
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              Còn hàng
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 py-2 text-sm"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá: Thấp → Cao</option>
              <option value="price_desc">Giá: Cao → Thấp</option>
              <option value="stock">Tồn kho</option>
            </select>
          </div>

          {/* Admin controls */}
          <AdminAuthProvider>
            <AdminPermissionGate permission="canManageProducts">
              <div className="w-full lg:w-auto flex items-center gap-2">
                <FeaturedProductsSelector
                  value={[]}
                  onChange={(ids) => addProductsToCategory(ids)}
                />
              </div>
            </AdminPermissionGate>
          </AdminAuthProvider>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : categoryProducts.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon="🔍"
              title="Không tìm thấy sản phẩm nào"
              description={
                q
                  ? "Hãy thử từ khóa khác hoặc xóa bộ lọc."
                  : "Danh mục này chưa có sản phẩm."
              }
              primaryAction={
                q
                  ? { label: "Xem tất cả sản phẩm", href: "/products" }
                  : { label: "Về trang chủ", href: "/" }
              }
              secondaryAction={
                q ? { label: "Về trang chủ", href: "/" } : undefined
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryProducts.map((p) => (
              <div key={p.id} className="w-full">
                <ProductCard product={p} />
                <AdminAuthProvider>
                  <AdminPermissionGate permission="canManageProducts">
                    <div className="mt-2 text-right">
                      <button
                        onClick={() => removeProductFromCategory(p.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Gỡ khỏi danh mục
                      </button>
                    </div>
                  </AdminPermissionGate>
                </AdminAuthProvider>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
