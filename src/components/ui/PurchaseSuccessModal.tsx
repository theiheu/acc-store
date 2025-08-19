"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface PurchaseSuccessModalProps {
  open: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    productTitle: string;
    quantity: number;
    totalAmount: number;
    currency: string;
    hasCredentials?: boolean;
  };
}

export default function PurchaseSuccessModal({
  open,
  onClose,
  orderData,
}: PurchaseSuccessModalProps) {
  const router = useRouter();

  if (!open) return null;

  const fmt = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: orderData.currency || "VND",
    currencyDisplay: "narrowSymbol",
  });

  const handleGoHome = () => {
    onClose();
    router.push("/");
  };

  const handleViewOrders = () => {
    onClose();
    router.push("/orders");
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-[10000] w-full max-w-md rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            aria-label="Đóng"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Success icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white mb-2">
            Đặt hàng thành công!
          </h2>

          {/* Subtitle */}
          <p className="text-green-100 text-sm">
            Cảm ơn bạn đã tin tưởng và mua hàng tại cửa hàng chúng tôi
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Order info */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Mã đơn hàng:
              </span>
              <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 ml-3 text-right">
                {orderData.orderId}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Sản phẩm:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-3 text-right line-clamp-2">
                {orderData.productTitle}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Số lượng:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {orderData.quantity}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Tổng tiền:
              </span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                {fmt.format(orderData.totalAmount)}
              </span>
            </div>
          </div>

          {/* Status message */}
          <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                  {orderData.hasCredentials
                    ? "Thông tin tài khoản đã sẵn sàng"
                    : "Đơn hàng đang được xử lý"}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  {orderData.hasCredentials
                    ? "Bạn có thể xem thông tin tài khoản trong trang đơn hàng."
                    : "Bạn sẽ nhận được thông báo khi đơn hàng hoàn tất."}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGoHome}
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Quay về trang chủ
            </button>

            <button
              onClick={handleViewOrders}
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Xem đơn hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
