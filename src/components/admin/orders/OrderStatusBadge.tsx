"use client";

import { ORDER_STATUS, OrderStatus, orderStatusToViText } from "@/src/core/constants";

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export default function OrderStatusBadge({ 
  status, 
  size = "md", 
  showIcon = true 
}: OrderStatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return {
          bg: "bg-yellow-100 dark:bg-yellow-300/10",
          text: "text-yellow-700 dark:text-yellow-400",
          border: "border-yellow-200 dark:border-yellow-300/20",
          icon: "⏳",
        };
      case ORDER_STATUS.PROCESSING:
        return {
          bg: "bg-blue-100 dark:bg-blue-300/10",
          text: "text-blue-700 dark:text-blue-400",
          border: "border-blue-200 dark:border-blue-300/20",
          icon: "⚙️",
        };
      case ORDER_STATUS.SHIPPED:
        return {
          bg: "bg-purple-100 dark:bg-purple-300/10",
          text: "text-purple-700 dark:text-purple-400",
          border: "border-purple-200 dark:border-purple-300/20",
          icon: "🚚",
        };
      case ORDER_STATUS.DELIVERED:
        return {
          bg: "bg-indigo-100 dark:bg-indigo-300/10",
          text: "text-indigo-700 dark:text-indigo-400",
          border: "border-indigo-200 dark:border-indigo-300/20",
          icon: "📦",
        };
      case ORDER_STATUS.COMPLETED:
        return {
          bg: "bg-green-100 dark:bg-green-300/10",
          text: "text-green-700 dark:text-green-400",
          border: "border-green-200 dark:border-green-300/20",
          icon: "✅",
        };
      case ORDER_STATUS.CANCELLED:
        return {
          bg: "bg-red-100 dark:bg-red-300/10",
          text: "text-red-700 dark:text-red-400",
          border: "border-red-200 dark:border-red-300/20",
          icon: "❌",
        };
      case ORDER_STATUS.REFUNDED:
        return {
          bg: "bg-gray-100 dark:bg-gray-300/10",
          text: "text-gray-700 dark:text-gray-400",
          border: "border-gray-200 dark:border-gray-300/20",
          icon: "💰",
        };
      default:
        return {
          bg: "bg-gray-100 dark:bg-gray-300/10",
          text: "text-gray-700 dark:text-gray-400",
          border: "border-gray-200 dark:border-gray-300/20",
          icon: "❓",
        };
    }
  };

  const getSizeStyles = (size: string) => {
    switch (size) {
      case "sm":
        return "px-2 py-1 text-xs";
      case "lg":
        return "px-4 py-2 text-base";
      default:
        return "px-3 py-1.5 text-sm";
    }
  };

  const styles = getStatusStyles(status);
  const sizeStyles = getSizeStyles(size);
  const statusText = orderStatusToViText(status as OrderStatus);

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${styles.bg} ${styles.text} ${styles.border} ${sizeStyles}
      `}
      title={statusText}
    >
      {showIcon && <span className="text-xs">{styles.icon}</span>}
      <span>{statusText}</span>
    </span>
  );
}

// Status badge with pulse animation for pending orders
export function AnimatedOrderStatusBadge({ 
  status, 
  size = "md", 
  showIcon = true 
}: OrderStatusBadgeProps) {
  const isPending = status === ORDER_STATUS.PENDING;
  const isProcessing = status === ORDER_STATUS.PROCESSING;

  return (
    <div className="relative">
      <OrderStatusBadge status={status} size={size} showIcon={showIcon} />
      {(isPending || isProcessing) && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
        </span>
      )}
    </div>
  );
}

// Status progress indicator
export function OrderStatusProgress({ status }: { status: OrderStatus | string }) {
  const statusOrder = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETED,
  ];

  const currentIndex = statusOrder.indexOf(status as OrderStatus);
  const isCancelled = status === ORDER_STATUS.CANCELLED;
  const isRefunded = status === ORDER_STATUS.REFUNDED;

  if (isCancelled || isRefunded) {
    return (
      <div className="flex items-center gap-2">
        <OrderStatusBadge status={status} size="sm" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {isCancelled ? "Đơn hàng đã bị huỷ" : "Đơn hàng đã được hoàn tiền"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {statusOrder.map((stepStatus, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <div key={stepStatus} className="flex items-center">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                ${isCompleted 
                  ? "bg-green-100 dark:bg-green-300/10 text-green-700 dark:text-green-400 border-2 border-green-500" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-2 border-gray-300 dark:border-gray-600"
                }
                ${isCurrent ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900" : ""}
              `}
            >
              {isCompleted ? "✓" : index + 1}
            </div>
            {index < statusOrder.length - 1 && (
              <div
                className={`
                  w-8 h-0.5 mx-1
                  ${isCompleted 
                    ? "bg-green-500" 
                    : "bg-gray-300 dark:bg-gray-600"
                  }
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
