"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AdminOrder, OrderSearchFilters } from "@/src/core/admin";
import { formatCurrency } from "@/src/core/admin";
import OrderStatusBadge from "./OrderStatusBadge";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";

interface OrderTableProps {
  orders: AdminOrder[];
  isLoading?: boolean;
  onSort?: (
    sortBy: OrderSearchFilters["sortBy"],
    sortOrder: "asc" | "desc"
  ) => void;
  currentSort?: {
    sortBy: OrderSearchFilters["sortBy"];
    sortOrder: "asc" | "desc";
  };
  onSelectOrder?: (orderId: string) => void;
  selectedOrders?: string[];
  showSelection?: boolean;
}

export default function OrderTable({
  orders,
  isLoading = false,
  onSort,
  currentSort,
  onSelectOrder,
  selectedOrders = [],
  showSelection = false,
}: OrderTableProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const handleSort = (sortBy: OrderSearchFilters["sortBy"]) => {
    if (!onSort) return;

    const newSortOrder =
      currentSort?.sortBy === sortBy && currentSort?.sortOrder === "desc"
        ? "asc"
        : "desc";

    onSort(sortBy, newSortOrder);
  };

  const getSortIcon = (column: OrderSearchFilters["sortBy"]) => {
    if (currentSort?.sortBy !== column) {
      return "↕️";
    }
    return currentSort.sortOrder === "asc" ? "↑" : "↓";
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Không tìm thấy đơn hàng
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Không có đơn hàng nào phù hợp với bộ lọc hiện tại.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {showSelection && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedOrders.length === orders.length &&
                      orders.length > 0
                    }
                    onChange={(e) => {
                      if (onSelectOrder) {
                        orders.forEach((order) => {
                          if (
                            e.target.checked &&
                            !selectedOrders.includes(order.id)
                          ) {
                            onSelectOrder(order.id);
                          } else if (
                            !e.target.checked &&
                            selectedOrders.includes(order.id)
                          ) {
                            onSelectOrder(order.id);
                          }
                        });
                      }
                    }}
                    className="rounded border-gray-300 dark:border-gray-600 text-amber-600 focus:ring-amber-500"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Đơn hàng {getSortIcon("createdAt")}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("customerEmail")}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Khách hàng {getSortIcon("customerEmail")}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("totalAmount")}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Số tiền {getSortIcon("totalAmount")}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Trạng thái {getSortIcon("status")}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("updatedAt")}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Cập nhật {getSortIcon("updatedAt")}
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map((order) => (
              <React.Fragment key={order.id}>
                <tr
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedOrders.includes(order.id)
                      ? "bg-amber-50 dark:bg-amber-300/5"
                      : ""
                  }`}
                >
                  {showSelection && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => onSelectOrder?.(order.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-amber-600 focus:ring-amber-500"
                      />
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        #{order.id.slice(-8)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {order.customerName || "Chưa cập nhật"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {order.customerEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {order.productTitle}
                      </div>
                      {order.selectedOptionLabel && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order.selectedOptionLabel}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Số lượng: {order.quantity}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(order.unitPrice)}/sản phẩm
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <OrderStatusBadge status={order.status} size="sm" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(order.updatedAt).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.updatedAt).toLocaleTimeString("vi-VN")}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleOrderExpansion(order.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                        title={
                          expandedOrder === order.id
                            ? "Thu gọn"
                            : "Xem chi tiết"
                        }
                      >
                        {expandedOrder === order.id ? "🔼" : "🔽"}
                      </button>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-300/10 rounded-full hover:bg-amber-100 dark:hover:bg-amber-300/20 transition-colors"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </td>
                </tr>
                {expandedOrder === order.id && (
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={showSelection ? 8 : 7} className="px-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Số dư khách hàng:
                          </span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100">
                            {formatCurrency(order.customerBalance)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Tổng đơn hàng:
                          </span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100">
                            {order.customerTotalOrders}
                          </span>
                        </div>
                        {order.paymentMethod && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Thanh toán:
                            </span>
                            <span className="ml-2 text-gray-900 dark:text-gray-100">
                              {order.paymentMethod}
                            </span>
                          </div>
                        )}
                        {order.adminNotes && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Ghi chú admin:
                            </span>
                            <div className="mt-1 p-2 bg-white dark:bg-gray-900 rounded border text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                              {order.adminNotes}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
