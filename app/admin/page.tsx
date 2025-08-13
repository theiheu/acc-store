"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/src/components/AdminLayout";
import { withAdminAuth } from "@/src/components/AdminAuthProvider";
import { useGlobalLoading } from "@/src/components/GlobalLoadingProvider";
import { useToastContext } from "@/src/components/ToastProvider";
import { useDashboardStats } from "@/src/components/DataSyncProvider";
import { DashboardStats } from "@/src/core/admin";
import { formatCurrency } from "@/src/core/admin";
import LoadingSpinner from "@/src/components/LoadingSpinner";

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToastContext();
  const realtimeStats = useDashboardStats(); // Get real-time stats

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/dashboard");

      // Check if response is ok
      if (!response.ok) {
        console.error(
          "Dashboard API response not ok:",
          response.status,
          response.statusText
        );
        show(`Lỗi API: ${response.status} ${response.statusText}`);
        return;
      }

      // Check content type
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Dashboard API returned non-JSON response:", contentType);
        const text = await response.text();
        console.error("Response body:", text.substring(0, 500));
        show("API trả về dữ liệu không hợp lệ");
        return;
      }

      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        console.error("Dashboard API returned error:", result.error);
        show(result.error || "Không thể tải dữ liệu dashboard");
      }
    } catch (error) {
      console.error("Fetch dashboard stats error:", error);
      show("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Tổng quan" description="Dashboard quản trị hệ thống">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout title="Tổng quan" description="Dashboard quản trị hệ thống">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Không thể tải dữ liệu dashboard
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Tổng quan" description="Dashboard quản trị hệ thống">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tổng người dùng
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {(
                    stats?.totalUsers || realtimeStats.totalUsers
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {stats?.activeUsers || realtimeStats.activeUsers} hoạt động
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-300/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sản phẩm
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats?.totalProducts || realtimeStats.totalProducts}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {stats?.activeProducts || realtimeStats.activeProducts} đang
                  bán
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-300/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Đơn hàng
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalOrders.toLocaleString()}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  {stats.pendingOrders} chờ xử lý
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-300/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Doanh thu tháng
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(stats.monthlyRevenue)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  TB: {formatCurrency(stats.averageOrderValue)}/đơn
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-300/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Thao tác nhanh
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/admin/products"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-2xl">➕</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Thêm sản phẩm
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tạo sản phẩm mới
                </p>
              </div>
            </a>

            <a
              href="/admin/users"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-2xl">👤</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Quản lý user
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Xem danh sách user
                </p>
              </div>
            </a>

            <a
              href="/admin/orders"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-2xl">📋</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Xử lý đơn hàng
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.pendingOrders} đơn chờ
                </p>
              </div>
            </a>

            <a
              href="/admin/analytics"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Xem báo cáo
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Thống kê chi tiết
                </p>
              </div>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Sản phẩm bán chạy
            </h3>
            <div className="space-y-3">
              {stats.topSellingProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-300/10 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-amber-800 dark:text-amber-200">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {product.productTitle}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.salesCount} đã bán
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Người dùng mới
              </h3>
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                  realtimeStats
                    ? "bg-green-100 dark:bg-green-300/10 text-green-800 dark:text-green-200"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    realtimeStats ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                ></div>
                {realtimeStats ? "Cập nhật tự động" : "Mất kết nối"}
              </div>
            </div>
            <div className="space-y-3">
              {realtimeStats.recentUsers?.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-300/10 rounded-full flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-xs px-2 py-1 rounded-full ${
                        user.status === "active"
                          ? "bg-green-100 dark:bg-green-300/10 text-green-800 dark:text-green-200"
                          : "bg-yellow-100 dark:bg-yellow-300/10 text-yellow-800 dark:text-yellow-200"
                      }`}
                    >
                      {user.status === "active" ? "Hoạt động" : "Tạm khóa"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Chưa có người dùng mới
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Hoạt động gần đây
            </h3>
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">
                      {activity.targetType === "user"
                        ? "👤"
                        : activity.targetType === "product"
                        ? "📦"
                        : activity.targetType === "order"
                        ? "🛒"
                        : "⚙️"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(activity.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(AdminDashboard);
