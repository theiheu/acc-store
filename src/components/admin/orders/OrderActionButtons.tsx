"use client";

import { useState } from "react";
import { AdminOrder } from "@/src/core/admin";
import { 
  ORDER_STATUS, 
  OrderStatus, 
  getAvailableStatusTransitions,
  orderStatusToViText 
} from "@/src/core/constants";
import { useGlobalLoading } from "@/src/components/providers/GlobalLoadingProvider";
import { useToastContext } from "@/src/components/providers/ToastProvider";
import LoadingButton from "@/src/components/ui/LoadingButton";

interface OrderActionButtonsProps {
  order: AdminOrder;
  onOrderUpdate?: (updatedOrder: AdminOrder) => void;
  size?: "sm" | "md" | "lg";
  variant?: "compact" | "full";
}

export default function OrderActionButtons({
  order,
  onOrderUpdate,
  size = "md",
  variant = "compact",
}: OrderActionButtonsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const { withLoading } = useGlobalLoading();
  const { show } = useToastContext();

  const availableStatuses = getAvailableStatusTransitions(order.status as OrderStatus);
  const canRefund = order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.DELIVERED;
  const canCancel = order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.PROCESSING;

  const handleStatusChange = async (newStatus: OrderStatus, reason?: string) => {
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          reason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        show(result.message || "Đã cập nhật trạng thái đơn hàng");
        onOrderUpdate?.(result.data);
        setShowStatusMenu(false);
      } else {
        show(result.error || "Có lỗi xảy ra khi cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Status update error:", error);
      show("Có lỗi xảy ra khi cập nhật trạng thái");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefund = async (amount: number, reason: string) => {
    try {
      await withLoading(async () => {
        const response = await fetch(`/api/admin/orders/${order.id}/refund`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            reason,
            notifyCustomer: true,
          }),
        });

        const result = await response.json();

        if (result.success) {
          show(result.message || "Đã hoàn tiền thành công");
          onOrderUpdate?.(result.data.order);
          setShowRefundDialog(false);
        } else {
          show(result.error || "Có lỗi xảy ra khi hoàn tiền");
        }
      }, "Đang xử lý hoàn tiền...");
    } catch (error) {
      console.error("Refund error:", error);
      show("Có lỗi xảy ra khi hoàn tiền");
    }
  };

  const handleCancel = async () => {
    const reason = prompt("Lý do huỷ đơn hàng:");
    if (reason === null) return; // User cancelled

    await handleStatusChange(ORDER_STATUS.CANCELLED, reason);
  };

  const getButtonSize = () => {
    switch (size) {
      case "sm":
        return "px-2 py-1 text-xs";
      case "lg":
        return "px-4 py-2 text-base";
      default:
        return "px-3 py-1.5 text-sm";
    }
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        {/* Quick Status Change */}
        {availableStatuses.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={isUpdating}
              className={`
                inline-flex items-center gap-1 font-medium rounded-lg border transition-colors
                ${getButtonSize()}
                bg-blue-50 dark:bg-blue-300/10 text-blue-700 dark:text-blue-400 
                border-blue-200 dark:border-blue-300/20 
                hover:bg-blue-100 dark:hover:bg-blue-300/20
                disabled:opacity-50
              `}
            >
              {isUpdating ? "⏳" : "📝"} Cập nhật
            </button>

            {showStatusMenu && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Chuyển sang trạng thái:
                  </div>
                  {availableStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={isUpdating}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                    >
                      {orderStatusToViText(status)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {canRefund && (
          <button
            onClick={() => setShowRefundDialog(true)}
            className={`
              inline-flex items-center gap-1 font-medium rounded-lg border transition-colors
              ${getButtonSize()}
              bg-yellow-50 dark:bg-yellow-300/10 text-yellow-700 dark:text-yellow-400 
              border-yellow-200 dark:border-yellow-300/20 
              hover:bg-yellow-100 dark:hover:bg-yellow-300/20
            `}
          >
            💰 Hoàn tiền
          </button>
        )}

        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={isUpdating}
            className={`
              inline-flex items-center gap-1 font-medium rounded-lg border transition-colors
              ${getButtonSize()}
              bg-red-50 dark:bg-red-300/10 text-red-700 dark:text-red-400 
              border-red-200 dark:border-red-300/20 
              hover:bg-red-100 dark:hover:bg-red-300/20
              disabled:opacity-50
            `}
          >
            ❌ Huỷ
          </button>
        )}

        {/* Close status menu when clicking outside */}
        {showStatusMenu && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowStatusMenu(false)}
          />
        )}
      </div>
    );
  }

  // Full variant with detailed buttons
  return (
    <div className="space-y-3">
      {/* Status Transitions */}
      {availableStatuses.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cập nhật trạng thái
          </h4>
          <div className="flex flex-wrap gap-2">
            {availableStatuses.map((status) => (
              <LoadingButton
                key={status}
                onClick={() => handleStatusChange(status)}
                loading={isUpdating}
                size={size}
                variant="outline"
                className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-300/10"
              >
                {orderStatusToViText(status)}
              </LoadingButton>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Thao tác
        </h4>
        <div className="flex flex-wrap gap-2">
          {canRefund && (
            <LoadingButton
              onClick={() => setShowRefundDialog(true)}
              size={size}
              variant="outline"
              className="text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-300/10"
            >
              💰 Hoàn tiền
            </LoadingButton>
          )}

          {canCancel && (
            <LoadingButton
              onClick={handleCancel}
              loading={isUpdating}
              size={size}
              variant="outline"
              className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-300/10"
            >
              ❌ Huỷ đơn hàng
            </LoadingButton>
          )}
        </div>
      </div>

      {/* Refund Dialog */}
      {showRefundDialog && (
        <RefundDialog
          order={order}
          onRefund={handleRefund}
          onClose={() => setShowRefundDialog(false)}
        />
      )}
    </div>
  );
}

// Simple refund dialog component
function RefundDialog({
  order,
  onRefund,
  onClose,
}: {
  order: AdminOrder;
  onRefund: (amount: number, reason: string) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(order.totalAmount);
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || amount > order.totalAmount) {
      alert("Số tiền hoàn không hợp lệ");
      return;
    }
    if (!reason.trim()) {
      alert("Vui lòng nhập lý do hoàn tiền");
      return;
    }
    onRefund(amount, reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Hoàn tiền đơn hàng #{order.id.slice(-8)}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Số tiền hoàn (tối đa: {order.totalAmount.toLocaleString("vi-VN")} VND)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              max={order.totalAmount}
              min={1}
              step={1000}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lý do hoàn tiền
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Nhập lý do hoàn tiền..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Hoàn tiền
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
