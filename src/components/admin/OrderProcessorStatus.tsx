"use client";

import { useEffect, useState } from "react";

interface ProcessorStats {
  processor: {
    activeJobs: number;
    isProcessing: boolean;
  };
  pendingOrders: Array<{
    id: string;
    userId: string;
    productTitle: string;
    quantity: number;
    totalAmount: number;
    createdAt: string;
    processing?: {
      attempts: number;
      nextRetryAt: string;
      createdAt: string;
    };
  }>;
  summary: {
    totalPendingOrders: number;
    ordersInQueue: number;
    oldestPendingOrder: string | null;
  };
}

export default function OrderProcessorStatus() {
  const [stats, setStats] = useState<ProcessorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/order-processor");
      const data = await res.json();
      
      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        setError(data.error || "Không thể tải thống kê");
      }
    } catch (err) {
      setError("Lỗi kết nối API");
      console.error("Error fetching processor stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Hệ thống xử lý đơn hàng
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Hệ thống xử lý đơn hàng
        </h3>
        <div className="text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
        <button
          onClick={fetchStats}
          className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Hệ thống xử lý đơn hàng
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
          stats?.processor.isProcessing
            ? "bg-green-100 dark:bg-green-300/10 text-green-800 dark:text-green-200"
            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            stats?.processor.isProcessing ? "bg-green-500 animate-pulse" : "bg-gray-400"
          }`}></div>
          {stats?.processor.isProcessing ? "Đang xử lý" : "Chờ"}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.summary.totalPendingOrders || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Đơn chờ xử lý</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.summary.ordersInQueue || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Đang trong hàng đợi</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.summary.oldestPendingOrder 
              ? Math.round((Date.now() - new Date(stats.summary.oldestPendingOrder).getTime()) / (1000 * 60))
              : 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Phút (đơn cũ nhất)</div>
        </div>
      </div>

      {/* Recent Pending Orders */}
      {stats?.pendingOrders && stats.pendingOrders.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
            Đơn hàng đang chờ ({stats.pendingOrders.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.pendingOrders.slice(0, 10).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {order.productTitle} x{order.quantity}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Mã: {order.id.split('-').pop()} • {order.totalAmount.toLocaleString('vi-VN')} ₫
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div className="text-right">
                  {order.processing ? (
                    <div className="text-xs">
                      <div className="text-blue-600 dark:text-blue-400">
                        Lần thử: {order.processing.attempts}
                      </div>
                      <div className="text-gray-500">
                        Thử lại: {new Date(order.processing.nextRetryAt).toLocaleTimeString('vi-VN')}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">Chờ xử lý</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.pendingOrders && stats.pendingOrders.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">✅</div>
          <div>Không có đơn hàng đang chờ xử lý</div>
        </div>
      )}
    </div>
  );
}
