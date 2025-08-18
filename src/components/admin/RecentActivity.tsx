"use client";

import { memo } from "react";

export interface RecentActivityItem {
  id: string;
  targetType: "user" | "product" | "order" | string;
  description: string;
  createdAt: string | number | Date;
}

interface RecentActivityProps {
  items: RecentActivityItem[];
}

function RecentActivity({ items }: RecentActivityProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Hoạt động gần đây
      </h3>
      <div className="space-y-3">
        {items.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sm" aria-hidden="true">
                {activity.targetType === "user"
                  ? "👤"
                  : activity.targetType === "product"
                  ? "📦"
                  : activity.targetType === "order"
                  ? "🛒"
                  : "⚙️"}
              </span>
              <span className="sr-only">Loại hoạt động</span>
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
  );
}

export default memo(RecentActivity);
