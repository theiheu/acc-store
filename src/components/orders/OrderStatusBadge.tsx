import React from "react";
import { getOrderStatusBadge, getOrderStatusText } from "@/src/utils/orderStatus";

export default function OrderStatusBadge({ status, dateStr }: { status: string; dateStr?: string }) {
  const cls = getOrderStatusBadge(status);
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${cls}`}>
        {getOrderStatusText(status)}
      </span>
      {dateStr && (
        <span className="text-xs text-gray-500 dark:text-gray-400">Cập nhật: {dateStr}</span>
      )}
    </div>
  );
}

