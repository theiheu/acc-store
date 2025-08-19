"use client";

import React from "react";

export default function ConfirmPurchaseModal({
  open,
  onClose,
  onConfirm,
  productTitle,
  quantity,
  unitPrice,
  currency,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  currency?: string;
  balance?: number;
}) {
  if (!open) return null;
  const fmt = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND",
    currencyDisplay: "narrowSymbol",
  });
  const total = unitPrice * quantity;
  const insufficient = typeof balance === "number" && balance < total;

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
          Xác nhận mua hàng
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Sản phẩm</span>
            <span className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1 ml-3">
              {productTitle}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Số lượng</span>
            <span className="font-medium">{quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Đơn giá</span>
            <span className="font-medium">{fmt.format(unitPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Tổng tiền</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {fmt.format(total)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Số dư hiện tại
            </span>
            <span
              className={`font-medium ${
                insufficient ? "text-red-600 dark:text-red-400" : ""
              }`}
            >
              {typeof balance === "number" ? fmt.format(balance) : "—"}
            </span>
          </div>
          {insufficient && (
            <div className="text-xs text-red-600 dark:text-red-400">
              Số dư không đủ. Vui lòng nạp thêm tiền trước khi mua.
            </div>
          )}
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={insufficient}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60 cursor-pointer"
          >
            Xác nhận mua
          </button>
        </div>
      </div>
    </div>
  );
}
