"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import { Skeleton, SkeletonText } from "@/src/components/Skeleton";
import type { Product } from "@/src/core/products";
import { parseCredentials } from "@/src/utils/credentials";

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [productsMap, setProductsMap] = useState<
    Record<string, Product | null>
  >({});
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const announceRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    const id = Date.now();
    setToast({ msg, id });
    // Auto hide
    window.setTimeout(() => {
      setToast((t) => (t && t.id === id ? null : t));
    }, 1600);
    // Announce for screen readers
    if (announceRef?.current) announceRef.current.textContent = msg;
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      showToast("Đã sao chép!");
    } catch {}
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/login?next=/orders");
    } else {
      (async () => {
        try {
          const res = await fetch("/api/user/orders");
          const data = await res.json();
          if (data.success) {
            const list = data.data || [];
            // Sort newest first by updatedAt or createdAt
            const getTime = (o: any) => {
              const t = o?.updatedAt ?? o?.createdAt ?? 0;
              return new Date(t).getTime() || 0;
            };
            const sorted = [...list].sort((a, b) => getTime(b) - getTime(a));
            setOrders(sorted);
            // Fetch products for each order (unique IDs)
            const uniqueProductIds = Array.from(
              new Set(sorted.map((o: any) => o.productId).filter(Boolean))
            );
            const entries: Array<[string, Product | null]> = await Promise.all(
              uniqueProductIds.map(async (pid: string) => {
                try {
                  const pr = await fetch(`/api/products/${pid}`);
                  const pj = await pr.json();
                  return [pid, pj.success ? (pj.data as Product) : null];
                } catch {
                  return [pid, null];
                }
              })
            );
            setProductsMap(Object.fromEntries(entries));
          }
        } catch (e) {
          console.error("Fetch orders error", e);
        } finally {
          setLoadingOrders(false);
        }
      })();
    }
  }, [router, session?.user, status]);

  // Show loading state
  if (status === "loading") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session?.user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Đơn hàng của tôi</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Theo dõi và quản lý các đơn hàng của bạn
            </p>
          </div>
          <Link
            href="/account"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            ← Quay lại tài khoản
          </Link>
        </div>
      </div>

      {/* Orders list */}
      {loadingOrders ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6 text-center">
          Đang tải đơn hàng...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6 text-center">
          Chưa có đơn hàng nào.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const p = productsMap[o.productId as string];
            const optionLabel = p?.options?.find(
              (op) => op.id === o.selectedOptionId
            )?.label;
            const title = p?.title || "Sản phẩm không xác định";
            const time = (o as any)?.updatedAt ?? (o as any)?.createdAt;
            const dateStr = time ? new Date(time).toLocaleString("vi-VN") : "";
            const statusClass =
              o.status === "Hoàn thành" || o.status === "completed"
                ? "bg-green-100 text-green-700 dark:bg-green-300/10 dark:text-green-400"
                : o.status === "Đang chờ xử lý" || o.status === "pending"
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-300/10 dark:text-yellow-400"
                : o.status === "Đã huỷ" || o.status === "cancelled"
                ? "bg-red-100 text-red-700 dark:bg-red-300/10 dark:text-red-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-300/10 dark:text-gray-300";
            return (
              <div
                key={o.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4"
              >
                <div className="flex items-center gap-3">
                  {/* Product thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
                    {p === undefined || (p === null && loadingOrders) ? (
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

                  {/* Main info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        {/* Product title (clickable) */}
                        <div className="text-sm mt-0.5">
                          {o.productId ? (
                            p === undefined ? (
                              <SkeletonText width="w-40" />
                            ) : (
                              <Link
                                href={`/products/${o.productId}`}
                                className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:no-underline font-bold"
                                aria-label={`Xem chi tiết sản phẩm ${title}`}
                              >
                                {title}
                              </Link>
                            )
                          ) : (
                            <span className="text-gray-500">
                              Sản phẩm không xác định
                            </span>
                          )}
                          {optionLabel && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Tùy chọn: {optionLabel}
                            </div>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Trạng thái:
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${statusClass}`}
                          >
                            {o.status === "pending"
                              ? "Đang chờ xử lý"
                              : o.status === "completed"
                              ? "Hoàn thành"
                              : o.status === "cancelled"
                              ? "Đã huỷ"
                              : o.status}
                          </span>
                          {dateStr && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Cập nhật: {dateStr}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm mt-1">Mã đơn: {o.id}</div>
                    <div className="text-md font-bold whitespace-nowrap mt-2">
                      Tổng: {o.totalAmount?.toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                </div>

                {o.status === "completed" && o.deliveryInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm underline">
                      Xem thông tin
                    </summary>
                    <div className="mt-2 space-y-2 text-sm">
                      {(() => {
                        try {
                          const parsed = JSON.parse(o.deliveryInfo);
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
                                    {/* Tài khoản */}
                                    <div className="flex items-center gap-3">
                                      <div className="text-gray-600 dark:text-gray-400 w-24">
                                        Tài khoản
                                      </div>
                                      <div className="font-mono font-medium text-gray-900 dark:text-gray-100 break-all flex-1">
                                        {c.user || "—"}
                                      </div>
                                      {c.user && (
                                        <button
                                          type="button"
                                          onClick={() => handleCopy(c.user!)}
                                          className="inline-flex items-center px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                          title="Sao chép tài khoản"
                                        >
                                          <span
                                            aria-hidden="true"
                                            className="mr-0 sm:mr-1"
                                          >
                                            📋
                                          </span>
                                          <span className="hidden sm:inline">
                                            Sao chép
                                          </span>
                                        </button>
                                      )}
                                    </div>

                                    {/* Mật khẩu */}
                                    <div className="flex items-center gap-3">
                                      <div className="text-gray-600 dark:text-gray-400 w-24">
                                        Mật khẩu
                                      </div>
                                      <div className="font-mono font-medium text-gray-900 dark:text-gray-100 break-all flex-1">
                                        {c.pass || "—"}
                                      </div>
                                      {c.pass && (
                                        <button
                                          type="button"
                                          onClick={() => handleCopy(c.pass!)}
                                          className="inline-flex items-center px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                          title="Sao chép mật khẩu"
                                        >
                                          <span
                                            aria-hidden="true"
                                            className="mr-0 sm:mr-1"
                                          >
                                            📋
                                          </span>
                                          <span className="hidden sm:inline">
                                            Sao chép
                                          </span>
                                        </button>
                                      )}
                                    </div>

                                    {/* Email */}
                                    {c.email && (
                                      <div className="flex items-center gap-3">
                                        <div className="text-gray-600 dark:text-gray-400 w-24">
                                          Email
                                        </div>
                                        <div className="font-mono font-medium text-gray-900 dark:text-gray-100 break-all flex-1">
                                          {c.email}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleCopy(c.email!)}
                                          className="inline-flex items-center px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                          title="Sao chép email"
                                        >
                                          <span
                                            aria-hidden="true"
                                            className="mr-0 sm:mr-1"
                                          >
                                            📋
                                          </span>
                                          <span className="hidden sm:inline">
                                            Sao chép
                                          </span>
                                        </button>
                                      </div>
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
          })}
        </div>
      )}

      {/* Order Status Info */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-yellow-100 dark:bg-yellow-300/10 flex items-center justify-center">
            <span className="text-yellow-600 dark:text-yellow-400">⏳</span>
          </div>
          <p className="text-sm font-medium mb-1">Chờ xử lý</p>
          <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
            0
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-300/10 flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400">🚚</span>
          </div>
          <p className="text-sm font-medium mb-1">Kiểm tra</p>
          <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
            0
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-300/10 flex items-center justify-center">
            <span className="text-green-600 dark:text-green-400">✅</span>
          </div>
          <p className="text-sm font-medium mb-1">Hoàn thành</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
            0
          </p>

          {/* Toast + aria-live region */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            ref={announceRef}
          />
          {toast && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
              <div className="rounded-md bg-gray-900 text-white text-sm px-3 py-2 shadow-lg/50 shadow-gray-900/40">
                {toast.msg}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-red-100 dark:bg-red-300/10 flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400">❌</span>
          </div>
          <p className="text-sm font-medium mb-1">Đã hủy</p>
          <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
            0
          </p>
        </div>
      </div>
    </div>
  );
}
