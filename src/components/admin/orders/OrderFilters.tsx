"use client";

import { useState, useEffect } from "react";
import { OrderSearchFilters } from "@/src/core/admin";
import { ORDER_STATUS, orderStatusToViText } from "@/src/core/constants";

interface OrderFiltersProps {
  filters: OrderSearchFilters;
  onFiltersChange: (filters: OrderSearchFilters) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export default function OrderFilters({
  filters,
  onFiltersChange,
  onReset,
  isLoading = false,
}: OrderFiltersProps) {
  const [localFilters, setLocalFilters] = useState<OrderSearchFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof OrderSearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateChange = (key: "dateFrom" | "dateTo", value: string) => {
    const date = value ? new Date(value) : undefined;
    handleFilterChange(key, date);
  };

  const handleAmountChange = (key: "minAmount" | "maxAmount", value: string) => {
    const amount = value ? parseFloat(value) : undefined;
    handleFilterChange(key, amount);
  };

  const hasActiveFilters = Object.entries(localFilters).some(([key, value]) => {
    if (key === "page" || key === "limit" || key === "sortBy" || key === "sortOrder") {
      return false;
    }
    return value !== undefined && value !== "" && value !== null;
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Bộ lọc đơn hàng
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            disabled={isLoading}
            className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 disabled:opacity-50"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tìm kiếm
          </label>
          <input
            type="text"
            placeholder="ID đơn hàng, email, tên khách hàng..."
            value={localFilters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Trạng thái
          </label>
          <select
            value={localFilters.status || ""}
            onChange={(e) => handleFilterChange("status", e.target.value || undefined)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.values(ORDER_STATUS).map((status) => (
              <option key={status} value={status}>
                {orderStatusToViText(status)}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Từ ngày
          </label>
          <input
            type="date"
            value={localFilters.dateFrom ? localFilters.dateFrom.toISOString().split('T')[0] : ""}
            onChange={(e) => handleDateChange("dateFrom", e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Đến ngày
          </label>
          <input
            type="date"
            value={localFilters.dateTo ? localFilters.dateTo.toISOString().split('T')[0] : ""}
            onChange={(e) => handleDateChange("dateTo", e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {/* Min Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Số tiền tối thiểu
          </label>
          <input
            type="number"
            placeholder="0"
            min="0"
            step="1000"
            value={localFilters.minAmount || ""}
            onChange={(e) => handleAmountChange("minAmount", e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {/* Max Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Số tiền tối đa
          </label>
          <input
            type="number"
            placeholder="Không giới hạn"
            min="0"
            step="1000"
            value={localFilters.maxAmount || ""}
            onChange={(e) => handleAmountChange("maxAmount", e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {/* Has Refund */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hoàn tiền
          </label>
          <select
            value={localFilters.hasRefund === undefined ? "" : localFilters.hasRefund.toString()}
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange("hasRefund", value === "" ? undefined : value === "true");
            }}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="">Tất cả</option>
            <option value="true">Đã hoàn tiền</option>
            <option value="false">Chưa hoàn tiền</option>
          </select>
        </div>

        {/* Has Admin Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ghi chú admin
          </label>
          <select
            value={localFilters.hasAdminNotes === undefined ? "" : localFilters.hasAdminNotes.toString()}
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange("hasAdminNotes", value === "" ? undefined : value === "true");
            }}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="">Tất cả</option>
            <option value="true">Có ghi chú</option>
            <option value="false">Không có ghi chú</option>
          </select>
        </div>
      </div>

      {/* Sort Options */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sắp xếp theo
            </label>
            <select
              value={localFilters.sortBy || "createdAt"}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="createdAt">Ngày tạo</option>
              <option value="updatedAt">Ngày cập nhật</option>
              <option value="totalAmount">Số tiền</option>
              <option value="customerEmail">Email khách hàng</option>
              <option value="status">Trạng thái</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thứ tự
            </label>
            <select
              value={localFilters.sortOrder || "desc"}
              onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="desc">Giảm dần</option>
              <option value="asc">Tăng dần</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Bộ lọc đang áp dụng:</span>
            {localFilters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-300/10 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                Tìm kiếm: "{localFilters.search}"
                <button
                  onClick={() => handleFilterChange("search", "")}
                  className="hover:text-amber-800 dark:hover:text-amber-200"
                >
                  ×
                </button>
              </span>
            )}
            {localFilters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-300/10 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                Trạng thái: {orderStatusToViText(localFilters.status)}
                <button
                  onClick={() => handleFilterChange("status", undefined)}
                  className="hover:text-amber-800 dark:hover:text-amber-200"
                >
                  ×
                </button>
              </span>
            )}
            {(localFilters.dateFrom || localFilters.dateTo) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-300/10 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                Thời gian: {localFilters.dateFrom?.toLocaleDateString("vi-VN")} - {localFilters.dateTo?.toLocaleDateString("vi-VN")}
                <button
                  onClick={() => {
                    handleFilterChange("dateFrom", undefined);
                    handleFilterChange("dateTo", undefined);
                  }}
                  className="hover:text-amber-800 dark:hover:text-amber-200"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
