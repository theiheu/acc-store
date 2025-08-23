"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { withAdminAuth } from "@/src/components/providers/AdminAuthProvider";
import { useGlobalLoading } from "@/src/components/providers/GlobalLoadingProvider";
import { useToastContext } from "@/src/components/providers/ToastProvider";
import {
  AdminProduct,
  PaginatedResponse,
  calculateProductCost,
  calculateProfitMargin,
} from "@/src/core/admin";
import { formatCurrency } from "@/src/core/admin";
import { CATEGORIES } from "@/src/core/products";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";

function ProductManagement() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { withLoading } = useGlobalLoading();
  const { show } = useToastContext();

  // Helper functions for options-first display
  function getDisplayPrice(product: AdminProduct): number {
    if (product.options && product.options.length > 0) {
      // Return price range from options
      const prices = product.options.map((opt) => opt.price);
      return Math.min(...prices); // Show starting price
    }
    return product.price || 0;
  }

  function getPriceRange(product: AdminProduct): string {
    if (product.options && product.options.length > 0) {
      const prices = product.options.map((opt) => opt.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      if (minPrice === maxPrice) {
        return formatCurrency(minPrice);
      }
      return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
    }
    return formatCurrency(product.price || 0);
  }

  function getTotalStock(product: AdminProduct): number {
    if (product.options && product.options.length > 0) {
      return product.options.reduce(
        (total, opt) => total + (opt.stock || 0),
        0
      );
    }
    return product.stock || 0;
  }

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, selectedCategory]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: searchTerm,
        category: selectedCategory,
      });

      const response = await fetch(`/api/admin/products?${params}`);
      const result = await response.json();

      if (result.success) {
        setProducts(result.data);
        setTotalPages(result.pagination.totalPages);
      } else {
        show("Không thể tải danh sách sản phẩm");
      }
    } catch (error) {
      console.error("Fetch products error:", error);
      show("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(productId: string, currentStatus: boolean) {
    try {
      await withLoading(async () => {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggle_active" }),
        });

        const result = await response.json();
        if (result.success) {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === productId ? { ...p, isActive: !currentStatus } : p
            )
          );
          show(`Sản phẩm đã được ${!currentStatus ? "kích hoạt" : "tạm dừng"}`);
        } else {
          show("Không thể cập nhật trạng thái sản phẩm");
        }
      }, "Đang cập nhật...");
    } catch (error) {
      console.error("Toggle product status error:", error);
      show("Có lỗi xảy ra");
    }
  }

  async function handleDeleteProduct(productId: string, productTitle: string) {
    // Enhanced confirmation dialog
    const confirmMessage = `⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa sản phẩm?\n\n"${productTitle}"\n\nHành động này KHÔNG THỂ HOÀN TÁC!`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await withLoading(async () => {
        console.log(`Attempting to delete product: ${productId}`);

        const response = await fetch(`/api/admin/products/${productId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log(`Delete response status: ${response.status}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Delete result:", result);

        if (result.success) {
          setProducts((prev) => prev.filter((p) => p.id !== productId));
          show(`Đã xóa sản phẩm: ${productTitle}`);

          // Refresh the product list to ensure consistency
          fetchProducts();
        } else {
          show(result.error || "Không thể xóa sản phẩm");
        }
      }, "Đang xóa...");
    } catch (error) {
      console.error("Delete product error:", error);
      show(
        `Lỗi khi xóa sản phẩm: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
        }`
      );
    }
  }

  return (
    <AdminLayout
      title="Quản lý sản phẩm"
      description="Quản lý danh sách sản phẩm, kho hàng và giá cả"
    >
      <div className="space-y-6 max-w-full overflow-hidden">
        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent min-w-0"
            >
              <option value="all">Tất cả danh mục</option>
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={async () => {
                try {
                  await withLoading(async () => {
                    const res = await fetch("/api/admin/products/sync", {
                      method: "POST",
                    });
                    const data = await res.json();
                    if (data.success) {
                      show(
                        `Đồng bộ thành công ${data.data.updated.length} sản phẩm`
                      );
                      fetchProducts();
                    } else {
                      show(data.error || "Không thể đồng bộ sản phẩm");
                    }
                  }, "Đang đồng bộ...");
                } catch (e) {
                  show("Có lỗi xảy ra khi đồng bộ sản phẩm");
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors whitespace-nowrap"
            >
              🔄 Đồng bộ
            </button>
            <Link
              href="/admin/products/create"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-300 text-gray-900 hover:bg-amber-400 rounded-lg transition-colors font-medium whitespace-nowrap"
            >
              <span>➕</span>
              Thêm sản phẩm
            </Link>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Không tìm thấy sản phẩm nào
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">
                      Sản phẩm
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                      Danh mục
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                      Giá
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                      Lợi nhuận
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]">
                      Kho
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]">
                      Đã bán
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[160px]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <span className="text-sm">
                              {product.imageEmoji || "📦"}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {product.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full whitespace-nowrap">
                          {CATEGORIES.find((c) => c.id === product.category)
                            ?.label || "Khác"}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {getPriceRange(product)}
                        </div>
                        {product.options && product.options.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {product.options.length} tùy chọn
                          </div>
                        )}
                      </td>

                      {/* Profit Column */}
                      <td className="px-3 py-4">
                        {(() => {
                          // Calculate profit for main product or first option
                          const price = getDisplayPrice(product);
                          const cost = calculateProductCost(product as any);
                          const profit = price - cost;
                          const margin = calculateProfitMargin(price, cost);

                          return (
                            <div className="space-y-1">
                              <div
                                className={`text-sm font-medium ${
                                  profit >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {formatCurrency(profit)}
                              </div>
                              <div
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  margin >= 30
                                    ? "bg-green-100 dark:bg-green-300/10 text-green-700 dark:text-green-300"
                                    : margin >= 10
                                    ? "bg-blue-100 dark:bg-blue-300/10 text-blue-700 dark:text-blue-300"
                                    : margin >= 0
                                    ? "bg-yellow-100 dark:bg-yellow-300/10 text-yellow-700 dark:text-yellow-300"
                                    : "bg-red-100 dark:bg-red-300/10 text-red-700 dark:text-red-300"
                                }`}
                              >
                                {margin.toFixed(1)}%
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`text-sm font-medium ${
                            getTotalStock(product) < 20
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {getTotalStock(product)}
                        </span>
                        {product.options && product.options.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Tổng
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {product.sold || 0}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            product.isActive
                              ? "bg-green-100 dark:bg-green-300/10 text-green-800 dark:text-green-300"
                              : "bg-red-100 dark:bg-red-300/10 text-red-800 dark:text-red-300"
                          }`}
                        >
                          {product.isActive ? "Đang bán" : "Tạm dừng"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium">
                        <div className="flex flex-col items-end gap-1">
                          {/* Hàng trên: Sửa và Link gốc */}
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors whitespace-nowrap text-xs border border-gray-300 cursor-pointer"
                            >
                              Sửa
                            </Link>
                            {product.originalLink && (
                              <a
                                href={product.originalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Xem link gốc"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 px-2 py-1 rounded transition-colors whitespace-nowrap text-xs border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800  cursor-pointer"
                              >
                                Liên kết
                              </a>
                            )}

                            <button
                              onClick={() =>
                                handleToggleActive(product.id, product.isActive)
                              }
                              className={`px-2 py-1 rounded transition-colors whitespace-nowrap text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800  cursor-pointer ${
                                product.isActive
                                  ? "text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  : "text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                              }`}
                            >
                              {product.isActive ? "Tạm dừng" : "Kích hoạt"}
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteProduct(product.id, product.title)
                              }
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap text-xs border border-gray-300 dark:border-gray-700 cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Trang {currentPage} / {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Trước
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(ProductManagement);
