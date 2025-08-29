"use client";

interface ConfirmCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalAmount: number;
  itemCount: number;
}

export default function ConfirmCheckoutModal({
  open,
  onClose,
  onConfirm,
  totalAmount,
  itemCount,
}: ConfirmCheckoutModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal */}
      <div className="relative z-[9999] w-full max-w-md rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Xác nhận Thanh toán
        </h3>
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc chắn muốn thanh toán cho <strong>{itemCount}</strong>{" "}
            sản phẩm với tổng số tiền là{" "}
            <strong className="text-amber-600">
              {totalAmount.toLocaleString("vi-VN")} ₫
            </strong>{" "}
            không?
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-500 border border-transparent rounded-md shadow-sm hover:bg-amber-600 focus:outline-none cursor-pointer"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
