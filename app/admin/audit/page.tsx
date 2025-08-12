"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/src/components/AdminLayout";
import { withAdminAuth } from "@/src/components/AdminAuthProvider";
import { ActivityLog } from "@/src/core/admin";
import LoadingSpinner from "@/src/components/LoadingSpinner";

// Mock audit log data - in a real app, this would come from API
const MOCK_AUDIT_LOGS: ActivityLog[] = [
  {
    id: "log-1",
    adminId: "admin-1",
    adminName: "Admin User",
    action: "user_credit_add",
    targetType: "user",
    targetId: "user-1",
    description: "Đã nạp 100,000 VND cho user1@example.com",
    metadata: {
      amount: 100000,
      oldBalance: 50000,
      newBalance: 150000,
      reason: "Khuyến mãi tháng 1",
    },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  },
  {
    id: "log-2",
    adminId: "admin-1",
    adminName: "Admin User",
    action: "user_status_change",
    targetType: "user",
    targetId: "user-2",
    description: "Đã tạm khóa tài khoản user2@example.com",
    metadata: {
      oldStatus: "active",
      newStatus: "suspended",
      reason: "Vi phạm điều khoản sử dụng",
    },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: "log-3",
    adminId: "admin-1",
    adminName: "Admin User",
    action: "product_create",
    targetType: "product",
    targetId: "product-new-1",
    description: "Đã tạo sản phẩm mới: Tài khoản Discord Nitro",
    metadata: {
      productData: {
        title: "Tài khoản Discord Nitro",
        price: 89000,
        category: "gaming",
      },
    },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
  },
  {
    id: "log-4",
    adminId: "admin-1",
    adminName: "Admin User",
    action: "product_update",
    targetType: "product",
    targetId: "premium",
    description: "Đã cập nhật giá sản phẩm 'Gói Tài Khoản Premium'",
    metadata: {
      oldPrice: 49000,
      newPrice: 59000,
      reason: "Điều chỉnh giá theo thị trường",
    },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
  {
    id: "log-5",
    adminId: "admin-1",
    adminName: "Admin User",
    action: "product_toggle_active",
    targetType: "product",
    targetId: "starter",
    description: "Đã tạm dừng bán sản phẩm 'Gói Starter'",
    metadata: {
      oldStatus: true,
      newStatus: false,
      reason: "Hết hàng tạm thời",
    },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    createdAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
  },
];

function AuditLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");
  const [filterTargetType, setFilterTargetType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLogs(MOCK_AUDIT_LOGS);
      setLoading(false);
    }, 500);
  }, []);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filterAction !== "all" && !log.action.includes(filterAction)) {
      return false;
    }
    if (filterTargetType !== "all" && log.targetType !== filterTargetType) {
      return false;
    }
    return true;
  });

  // Paginate logs
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  function getActionIcon(action: string): string {
    if (action.includes("user")) return "👤";
    if (action.includes("product")) return "📦";
    if (action.includes("order")) return "🛒";
    return "⚙️";
  }

  function getActionColor(action: string): string {
    if (action.includes("create")) return "text-green-600 dark:text-green-400";
    if (action.includes("update")) return "text-blue-600 dark:text-blue-400";
    if (action.includes("delete")) return "text-red-600 dark:text-red-400";
    if (action.includes("credit")) return "text-green-600 dark:text-green-400";
    if (action.includes("status")) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-600 dark:text-gray-400";
  }

  return (
    <AdminLayout 
      title="Nhật ký hoạt động" 
      description="Theo dõi các hoạt động của quản trị viên"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Bộ lọc
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loại hành động
              </label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">Tất cả hành động</option>
                <option value="user">Quản lý người dùng</option>
                <option value="product">Quản lý sản phẩm</option>
                <option value="order">Quản lý đơn hàng</option>
                <option value="credit">Nạp tiền</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Đối tượng
              </label>
              <select
                value={filterTargetType}
                onChange={(e) => setFilterTargetType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">Tất cả đối tượng</option>
                <option value="user">Người dùng</option>
                <option value="product">Sản phẩm</option>
                <option value="order">Đơn hàng</option>
                <option value="system">Hệ thống</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterAction("all");
                  setFilterTargetType("all");
                  setCurrentPage(1);
                }}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Nhật ký hoạt động ({filteredLogs.length} bản ghi)
          </h3>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Không có hoạt động nào phù hợp với bộ lọc
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{getActionIcon(log.action)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {log.adminName}
                          </span>
                          <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                            {log.action.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          {log.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            📅 {new Date(log.createdAt).toLocaleString("vi-VN")}
                          </span>
                          <span>
                            🌐 {log.ipAddress}
                          </span>
                          {log.targetId && (
                            <span>
                              🎯 ID: {log.targetId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="ml-4">
                        <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                          Chi tiết
                        </summary>
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                          <pre className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Trang {currentPage} / {totalPages} ({filteredLogs.length} bản ghi)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(AuditLog);
