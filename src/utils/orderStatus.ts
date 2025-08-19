import {
  ORDER_STATUS,
  OrderStatus,
  normalizeOrderStatus,
  orderStatusToViText,
  getAvailableStatusTransitions,
  isValidStatusTransition,
} from "@/src/core/constants";

export function getOrderStatusText(status: string): string {
  const s = normalizeOrderStatus(String(status));
  return orderStatusToViText(s);
}

export function getOrderStatusBadge(status: string): string {
  const s = normalizeOrderStatus(String(status));
  switch (s) {
    case ORDER_STATUS.PENDING:
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-300/10 dark:text-yellow-400";
    case ORDER_STATUS.PROCESSING:
      return "bg-blue-100 text-blue-700 dark:bg-blue-300/10 dark:text-blue-400";
    case ORDER_STATUS.SHIPPED:
      return "bg-purple-100 text-purple-700 dark:bg-purple-300/10 dark:text-purple-400";
    case ORDER_STATUS.DELIVERED:
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-300/10 dark:text-indigo-400";
    case ORDER_STATUS.COMPLETED:
      return "bg-green-100 text-green-700 dark:bg-green-300/10 dark:text-green-400";
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

export function isOrderCompleted(status: string): boolean {
  return normalizeOrderStatus(String(status)) === ORDER_STATUS.COMPLETED;
}

export function isOrderCancelled(status: string): boolean {
  return normalizeOrderStatus(String(status)) === ORDER_STATUS.CANCELLED;
}

export function isOrderRefunded(status: string): boolean {
  return normalizeOrderStatus(String(status)) === ORDER_STATUS.REFUNDED;
}

export function canOrderBeRefunded(status: string): boolean {
  const s = normalizeOrderStatus(String(status));
  return s === ORDER_STATUS.COMPLETED || s === ORDER_STATUS.DELIVERED;
}

export function canOrderBeCancelled(status: string): boolean {
  const s = normalizeOrderStatus(String(status));
  return s === ORDER_STATUS.PENDING || s === ORDER_STATUS.PROCESSING;
}

export function getNextAvailableStatuses(currentStatus: string): OrderStatus[] {
  const s = normalizeOrderStatus(String(currentStatus));
  return getAvailableStatusTransitions(s);
}

export function canTransitionToStatus(
  fromStatus: string,
  toStatus: string
): boolean {
  const from = normalizeOrderStatus(String(fromStatus));
  const to = normalizeOrderStatus(String(toStatus));
  return isValidStatusTransition(from, to);
}

// Get status priority for sorting (lower number = higher priority)
export function getOrderStatusPriority(status: string): number {
  const s = normalizeOrderStatus(String(status));
  switch (s) {
    case ORDER_STATUS.PENDING:
      return 1;
    case ORDER_STATUS.PROCESSING:
      return 2;
    case ORDER_STATUS.SHIPPED:
      return 3;
    case ORDER_STATUS.DELIVERED:
      return 4;
    case ORDER_STATUS.COMPLETED:
      return 5;
    case ORDER_STATUS.CANCELLED:
      return 6;
    case ORDER_STATUS.REFUNDED:
      return 7;
    default:
      return 8;
  }
}
