"use client";

import { memo } from "react";
import Link from "next/link";

interface QuickActionsProps {
  pendingOrders: number;
}

function QuickActions({ pendingOrders }: QuickActionsProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Thao tác nhanh
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/products"
          aria-label="Thêm sản phẩm"
          className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-2xl" aria-hidden="true">
            ➕
          </span>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Thêm sản phẩm
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tạo sản phẩm mới
            </p>
          </div>
        </Link>

        <Link
          href="/admin/users"
          aria-label="Quản lý user"
          className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-2xl" aria-hidden="true">
            👤
          </span>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Quản lý user
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Xem danh sách user
            </p>
          </div>
        </Link>

        <Link
          href="/admin/orders"
          aria-label="Xử lý đơn hàng"
          className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-2xl" aria-hidden="true">
            📋
          </span>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Xử lý đơn hàng
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {pendingOrders} đơn chờ
            </p>
          </div>
        </Link>

        <Link
          href="/admin/analytics"
          aria-label="Xem báo cáo"
          className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-2xl" aria-hidden="true">
            📊
          </span>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Xem báo cáo
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Thống kê chi tiết
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default memo(QuickActions);
