"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { withAdminAuth } from "@/src/components/providers/AdminAuthProvider";
import { useGlobalLoading } from "@/src/components/providers/GlobalLoadingProvider";
import { useToastContext } from "@/src/components/providers/ToastProvider";
import { AdminOrder, OrderSearchFilters, PaginatedResponse, OrderStats } from "@/src/core/admin";
import { formatCurrency } from "@/src/core/admin";
import OrderFilters from "@/src/components/admin/orders/OrderFilters";
import OrderTable from "@/src/components/admin/orders/OrderTable";
import OrderStatusBadge from "@/src/components/admin/orders/OrderStatusBadge";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";

function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrderSearchFilters>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const { withLoading } = useGlobalLoading();
  const { show } = useToastContext();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setOrders(result.data);
        setPagination(result.pagination);
        setStats(result.stats);
      } else {
        show(result.error || "Có lỗi xảy ra khi tải danh sách đơn hàng");
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
      show("Có lỗi xảy ra khi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [filters, show]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleFiltersChange = (newFilters: OrderSearchFilters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset to first page when filters change
    setSelectedOrders([]); // Clear selection
  };

  const handleFiltersReset = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setSelectedOrders([]);
  };

  const handleSort = (sortBy: OrderSearchFilters["sortBy"], sortOrder: "asc" | "desc") => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleOrderUpdate = (updatedOrder: AdminOrder) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
    // Refresh stats
    fetchOrders();
  };

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) {
      show("Vui lòng chọn ít nhất một đơn hàng");
      return;
    }

    try {
      await withLoading(async () => {
        // TODO: Implement bulk actions API
        show(`Đã thực hiện ${action} cho ${selectedOrders.length} đơn hàng`);
        setSelectedOrders([]);
        fetchOrders();
      }, "Đang xử lý...");
    } catch (error) {
      console.error("Bulk action error:", error);
      show("Có lỗi xảy ra khi thực hiện thao tác");
    }
  };

  return (
    <AdminLayout
      title="Quản lý đơn hàng"
      description="Quản lý đơn hàng, trạng thái và xử lý hoàn tiền"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tổng đơn hàng
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalOrders.toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-300/10 rounded-full flex items-center justify-center">
                  <span className="text-xl">📦</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Đang chờ xử lý
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.pendingOrders.toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-300/10 rounded-full flex items-center justify-center">
                  <span className="text-xl">⏳</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Hoàn thành
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.completedOrders.toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-300/10 rounded-full flex items-center justify-center">
                  <span className="text-xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Doanh thu
                  </p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-300/10 rounded-full flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <OrderFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleFiltersReset}
          isLoading={loading}
        />

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-300/10 border border-amber-200 dark:border-amber-300/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Đã chọn {selectedOrders.length} đơn hàng
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction("export")}
                  className="px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-300/20 rounded hover:bg-amber-200 dark:hover:bg-amber-300/30 transition-colors"
                >
                  📊 Xuất Excel
                </button>
                <button
                  onClick={() => setSelectedOrders([])}
                  className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <OrderTable
          orders={orders}
          isLoading={loading}
          onSort={handleSort}
          currentSort={{
            sortBy: filters.sortBy || "createdAt",
            sortOrder: filters.sortOrder || "desc",
          }}
          onSelectOrder={handleSelectOrder}
          selectedOrders={selectedOrders}
          showSelection={true}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} đơn hàng
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev || loading}
                  className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Trước
                </button>
                
                <span className="px-3 py-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext || loading}
                  className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(AdminOrdersPage);
