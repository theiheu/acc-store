"use client";

import Link from "next/link";
import Image from "next/image";
import { Skeleton, SkeletonText } from "@/src/components/Skeleton";
import { parseCredentials } from "@/src/utils/credentials";
import OrderStatusBadge from "./OrderStatusBadge";
import { toProductPath } from "@/src/utils/slug";
import type { Product } from "@/src/core/products";

export type Order = {
  id: string;
  productId?: string;
  selectedOptionId?: string;
  updatedAt?: string | number;
  createdAt?: string | number;
  totalAmount?: number;
  status: string;
  deliveryInfo?: string;
};

export default function OrderCard({
  order,
  product,
  loadingProduct,
  onCopy,
}: {
  order: Order;
  product?: Product | null;
  loadingProduct?: boolean;
  onCopy: (text: string) => void;
}) {
  const p = product;
  const optionLabel = p?.options?.find(
    (op) => op.id === order.selectedOptionId
  )?.label;
  const title = p?.title || "Sản phẩm không xác định";
  const time = order.updatedAt ?? order.createdAt;
  const dateStr = time ? new Date(time).toLocaleString("vi-VN") : "";

  const numericId = (id?: string) => {
    if (!id) return "—";
    const parts = id.split("-");
    const digitPart = parts.find((p) => /^[0-9]+$/.test(p));
    if (digitPart) return digitPart;
    const match = id.match(/[0-9]+/);
    return match ? match[0] : id;
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4">
      <div className="flex items-center gap-3">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
          {p === undefined || (p === null && loadingProduct) ? (
            <Skeleton className="w-full h-full" />
          ) : p?.imageUrl ? (
            <Image
              src={p.imageUrl}
              alt={p.title}
              width={64}
              height={64}
              className="w-16 h-16 object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl opacity-80">
                {p?.imageEmoji ?? "🛍️"}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm mt-0.5">
                {order.productId ? (
                  p === undefined ? (
                    <SkeletonText width="w-40" />
                  ) : (
                    <Link
                      href={`/products/${encodeURIComponent(p!.id)}`}
                      className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:no-underline font-bold"
                      aria-label={`Xem chi tiết sản phẩm ${title}`}
                    >
                      {title}
                    </Link>
                  )
                ) : (
                  <span className="text-gray-500">Sản phẩm không xác định</span>
                )}
                {optionLabel && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Tùy chọn: {optionLabel}
                  </div>
                )}
              </div>
              <div className="mt-1">
                <OrderStatusBadge status={order.status} dateStr={dateStr} />
              </div>
            </div>
          </div>
          <div className="text-sm mt-1 flex items-center gap-2">
            <span>Mã đơn:</span>
            <span className="font-mono text-gray-900 dark:text-gray-100">
              {numericId(order.id)}
            </span>
          </div>
          <div className="text-md font-bold whitespace-nowrap mt-2">
            Tổng: {order.totalAmount?.toLocaleString("vi-VN")} ₫
          </div>
        </div>
      </div>

      {/* Delivery info */}
      {order.deliveryInfo && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm underline">
            Xem thông tin
          </summary>
          <div className="mt-2 space-y-2 text-sm">
            {(() => {
              try {
                const parsed = JSON.parse(order.deliveryInfo!);
                const creds = parseCredentials(parsed);
                if (!creds.length) {
                  return (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Không có thông tin hiển thị.
                    </div>
                  );
                }
                return (
                  <ul className="space-y-2">
                    {creds.map((c, idx) => (
                      <li
                        key={idx}
                        className="p-3 rounded-md bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800 space-y-3"
                      >
                        <div className="space-y-2">
                          <FieldRow
                            label="Tài khoản"
                            value={c.user}
                            onCopy={onCopy}
                          />
                          <FieldRow
                            label="Mật khẩu"
                            value={c.pass}
                            onCopy={onCopy}
                          />
                          {c.email && (
                            <FieldRow
                              label="Email"
                              value={c.email}
                              onCopy={onCopy}
                            />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                );
              } catch (e) {
                return (
                  <div className="text-xs text-red-600 dark:text-red-400">
                    Không thể đọc thông tin tài khoản.
                  </div>
                );
              }
            })()}
          </div>
        </details>
      )}
    </div>
  );
}

function FieldRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value?: string;
  onCopy: (text: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-gray-600 dark:text-gray-400 w-24">{label}</div>
      <div className="font-mono font-medium text-gray-900 dark:text-gray-100 break-all flex-1">
        {value || "—"}
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onCopy(value!)}
          className="inline-flex items-center px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          title={`Sao chép ${label.toLowerCase()}`}
        >
          <span aria-hidden="true" className="mr-0 sm:mr-1">
            📋
          </span>
          <span className="hidden sm:inline">Sao chép</span>
        </button>
      )}
    </div>
  );
}
