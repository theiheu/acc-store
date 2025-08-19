"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { withAdminAuth } from "@/src/components/providers/AdminAuthProvider";
import { useGlobalLoading } from "@/src/components/providers/GlobalLoadingProvider";
import { useToastContext } from "@/src/components/providers/ToastProvider";
import { AdminProduct, PaginatedResponse } from "@/src/core/admin";
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
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productTitle}"?`)) {
      return;
    }

    try {
      await withLoading(async () => {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: "DELETE",
        });

        const result = await response.json();
        if (result.success) {
          setProducts((prev) => prev.filter((p) => p.id !== productId));
          show("Sản phẩm đã được xóa");
        } else {
          show("Không thể xóa sản phẩm");
        }
      }, "Đang xóa...");
    } catch (error) {
      console.error("Delete product error:", error);
      show("Có lỗi xảy ra");
    }
  }

  return (
    <AdminLayout
      title="Quản lý sản phẩm"
      description="Quản lý danh sách sản phẩm, kho hàng và giá cả"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
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
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">Tất cả danh mục</option>
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/admin/products/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-300 text-gray-900 hover:bg-amber-400 rounded-lg transition-colors font-medium"
          >
            <span>➕</span>
            Thêm sản phẩm
          </Link>
        </div>

        {/* Sync Button */}
        <div>
          <button
            onClick={async () => {
              try {
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
              } catch (e) {
                show("Có lỗi xảy ra khi đồng bộ sản phẩm");
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer"
          >
            🔄 Đồng bộ sản phẩm
          </button>
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
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Danh mục
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Giá
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Kho
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Đã bán
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-lg">
                              {product.imageEmoji || "📦"}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {product.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full">
                          {CATEGORIES.find((c) => c.id === product.category)
                            ?.label || product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {getPriceRange(product)}
                        </div>
                        {product.options && product.options.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {product.options.length} tùy chọn
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                            Tổng từ options
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {product.sold || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.isActive
                              ? "bg-green-100 dark:bg-green-300/10 text-green-800 dark:text-green-300"
                              : "bg-red-100 dark:bg-red-300/10 text-red-800 dark:text-red-300"
                          }`}
                        >
                          {product.isActive ? "Đang bán" : "Tạm dừng"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300"
                          >
                            Sửa
                          </Link>
                          <button
                            onClick={() =>
                              handleToggleActive(product.id, product.isActive)
                            }
                            className={`${
                              product.isActive
                                ? "text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 cursor-pointer"
                                : "text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 cursor-pointer"
                            }`}
                          >
                            {product.isActive ? "Tạm dừng" : "Kích hoạt"}
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteProduct(product.id, product.title)
                            }
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 cursor-pointer"
                          >
                            Xóa
                          </button>
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
