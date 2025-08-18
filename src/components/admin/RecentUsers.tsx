"use client";

import { memo } from "react";

export interface RecentUserItem {
  id: string;
  name: string;
  email: string;
  status: "active" | "suspended" | string;
  createdAt: string | number | Date;
}

interface RecentUsersProps {
  items: RecentUserItem[];
  isRealtime: boolean;
}

function RecentUsers({ items, isRealtime }: RecentUsersProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Người dùng mới
        </h3>
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
            isRealtime
              ? "bg-green-100 dark:bg-green-300/10 text-green-800 dark:text-green-200"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
          aria-live="polite"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isRealtime ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
          />
          {isRealtime ? "Cập nhật tự động" : "Mất kết nối"}
        </div>
      </div>
      <div className="space-y-3">
        {items.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-300/10 rounded-full flex items-center justify-center">
                <span className="text-lg" aria-hidden="true">
                  👤
                </span>
                <span className="sr-only">Người dùng</span>
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
        ))}
      </div>
    </div>
  );
}

export default memo(RecentUsers);
