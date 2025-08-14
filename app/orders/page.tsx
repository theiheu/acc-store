"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import LoadingSpinner from "@/src/components/LoadingSpinner";

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/login?next=/orders");
    } else {
      (async () => {
        try {
          const res = await fetch("/api/user/orders");
          const data = await res.json();
          if (data.success) setOrders(data.data || []);
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
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Mã đơn: {o.id}</div>
                  <div className="text-sm text-gray-500">
                    Trạng thái: {o.status}
                  </div>
                </div>
                <div className="text-sm">
                  Tổng: {o.totalAmount?.toLocaleString("vi-VN")} ₫
                </div>
              </div>
              {o.status === "completed" && o.deliveryInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm underline">
                    Xem thông tin tài khoản
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-50 dark:bg-gray-950 p-2 rounded-md overflow-x-auto">
                    {JSON.stringify(JSON.parse(o.deliveryInfo), null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
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
          <p className="text-sm font-medium mb-1">Đang giao</p>
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
