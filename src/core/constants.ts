// Shared constants and status mapping for top-up requests and related flows

export const TOPUP_MIN_AMOUNT = 10_000; // VND
export const TOPUP_MAX_AMOUNT = 10_000_000; // VND

export const STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export type TopupStatus = (typeof STATUS)[keyof typeof STATUS];

// Vietnamese display text mapping
export function statusToViText(status: TopupStatus): string {
  switch (status) {
    case STATUS.PENDING:
      return "Đang chờ xử lý";
    case STATUS.APPROVED:
      return "Đã duyệt";
    case STATUS.REJECTED:
      return "Từ chối";
    case STATUS.CANCELLED:
      return "Đã huỷ";
    default:
      return String(status);
  }
}

// Parse any existing legacy/internal status into standardized value
export function normalizeStatus(input: string): TopupStatus {
  const v = (input || "").toLowerCase();
  if (v.includes("đang chờ")) return STATUS.PENDING;
  if (v.includes("pending")) return STATUS.PENDING;
  if (v.includes("duyệt") || v === "approved") return STATUS.APPROVED;
  if (v.includes("từ chối") || v === "rejected") return STATUS.REJECTED;
  if (v.includes("huỷ") || v.includes("huy") || v === "cancelled")
    return STATUS.CANCELLED;
  // default to pending if unknown to avoid losing action buttons
  return STATUS.PENDING;
}

// Order statuses (standardized)
export const ORDER_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export function orderStatusToViText(status: OrderStatus): string {
  switch (status) {
    case ORDER_STATUS.PENDING:
      return "Đang chờ xử lý";
    case ORDER_STATUS.COMPLETED:
      return "Hoàn thành";
    case ORDER_STATUS.CANCELLED:
      return "Đã huỷ";
    case ORDER_STATUS.REFUNDED:
      return "Đã hoàn tiền";
    default:
      return String(status);
  }
}

export function normalizeOrderStatus(input: string): OrderStatus {
  const v = (input || "").toLowerCase();
  if (v.includes("đang chờ")) return ORDER_STATUS.PENDING;
  if (v.includes("pending")) return ORDER_STATUS.PENDING;
  if (v.includes("hoàn thành") || v === "completed")
    return ORDER_STATUS.COMPLETED;
  if (v.includes("huỷ") || v.includes("huy") || v === "cancelled")
    return ORDER_STATUS.CANCELLED;
  if (v.includes("hoàn tiền") || v === "refunded") return ORDER_STATUS.REFUNDED;
  return ORDER_STATUS.PENDING;
}
