"use client";

import { memo } from "react";
import { DashboardStats, formatCurrency } from "@/src/core/admin";

type RealtimeBasic = Pick<
  DashboardStats,
  "totalUsers" | "activeUsers" | "totalProducts" | "activeProducts"
>;

interface StatsGridProps {
  stats: DashboardStats;
  realtimeStats: RealtimeBasic;
}

function StatsGrid({ stats, realtimeStats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tổng người dùng
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {(stats?.totalUsers || realtimeStats.totalUsers).toLocaleString()}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {stats?.activeUsers || realtimeStats.activeUsers} hoạt động
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-300/10 rounded-lg flex items-center justify-center">
            <span className="text-2xl" aria-hidden="true">
              👥
            </span>
            <span className="sr-only">Tổng người dùng</span>
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
              {stats?.activeProducts || realtimeStats.activeProducts} đang bán
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 dark:bg-green-300/10 rounded-lg flex items-center justify-center">
            <span className="text-2xl" aria-hidden="true">
              📦
            </span>
            <span className="sr-only">Sản phẩm</span>
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
            <span className="text-2xl" aria-hidden="true">
              🛒
            </span>
            <span className="sr-only">Đơn hàng</span>
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
            <span className="text-2xl" aria-hidden="true">
              💰
            </span>
            <span className="sr-only">Doanh thu</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(StatsGrid);
