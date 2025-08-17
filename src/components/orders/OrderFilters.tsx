"use client";

import React from "react";

export type OrderFiltersState = {
  status: string;
  q: string;
};

export default function OrderFilters({
  state,
  onChange,
}: {
  state: OrderFiltersState;
  onChange: (next: OrderFiltersState) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-4">
      <div className="flex items-center gap-2">
        <label htmlFor="status" className="text-sm text-gray-600 dark:text-gray-400">
          Trạng thái
        </label>
        <select
          id="status"
          value={state.status}
          onChange={(e) => onChange({ ...state, status: e.target.value })}
          className="border rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        >
          <option value="all">Tất cả</option>
          <option value="pending">Chờ xử lý</option>
          <option value="checking">Kiểm tra</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>
      <div className="flex-1">
        <input
          type="text"
          value={state.q}
          onChange={(e) => onChange({ ...state, q: e.target.value })}
          placeholder="Tìm theo mã đơn, sản phẩm..."
          className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        />
      </div>
    </div>
  );
}

