import { ORDER_STATUS, normalizeOrderStatus, orderStatusToViText } from "@/src/core/constants";

export function getOrderStatusText(status: string): string {
  const s = normalizeOrderStatus(String(status));
  return orderStatusToViText(s);
}

export function getOrderStatusBadge(status: string): string {
  const s = normalizeOrderStatus(String(status));
  switch (s) {
    case ORDER_STATUS.COMPLETED:
      return "bg-green-100 text-green-700 dark:bg-green-300/10 dark:text-green-400";
    case ORDER_STATUS.PENDING:
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-300/10 dark:text-yellow-400";
    case ORDER_STATUS.CANCELLED:
      return "bg-red-100 text-red-700 dark:bg-red-300/10 dark:text-red-400";
    case ORDER_STATUS.REFUNDED:
      return "bg-gray-100 text-gray-700 dark:bg-gray-300/10 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-300/10 dark:text-gray-300";
  }
}

export function isOrderPending(status: string): boolean {
  return normalizeOrderStatus(String(status)) === ORDER_STATUS.PENDING;
}

