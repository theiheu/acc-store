"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "next-auth/react";
import Link from "next/link";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import type { Product } from "@/src/core/products";
import OrderCard from "@/src/components/orders/OrderCard";
import OrderFilters, {
  OrderFiltersState,
} from "@/src/components/orders/OrderFilters";
import { useRealtimeUpdates } from "@/src/hooks/useRealtimeUpdates";

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [productsMap, setProductsMap] = useState<
    Record<string, Product | null>
  >({});
  const [loadingOrders, setLoadingOrders] = useState(true);
  type Toast = { id: number; msg: string; type: "success" | "info" | "error" };
  const [toasts, setToasts] = useState<Toast[]>([]);
  const announceRef = useRef<HTMLDivElement | null>(null);

  const [filters, setFilters] = useState<OrderFiltersState>({
    status: "all",
    q: "",
  });

  const loadOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch("/api/user/orders");
      const data = await res.json();
      if (data.success) {
        const list = data.data || [];
        const getTime = (o: any) => {
          const t = o?.updatedAt ?? o?.createdAt ?? 0;
          return new Date(t).getTime() || 0;
        };
        const sorted = [...list].sort((a, b) => getTime(b) - getTime(a));
        setOrders(sorted);
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
  }, []);

  // Realtime auto-refresh orders
  useRealtimeUpdates({
    onOrderCreated: () => loadOrders(),
    onOrderUpdated: () => loadOrders(),
    showNotifications: false,
  });

  const showToast = (msg: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, msg, type }]);
    // Auto hide per-toast
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1600);
    // Announce for screen readers (read latest message)
    if (announceRef?.current) announceRef.current.textContent = msg;
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      showToast("Đã sao chép!", "success");
    } catch {
      showToast("Sao chép thất bại", "error");
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/login?next=/orders");
      return;
    }
    loadOrders();
  }, [router, session?.user, status, loadOrders]);

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

      {/* Filters */}
      <OrderFilters state={filters} onChange={setFilters} />

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
          {orders
            .filter((o) => {
              const q = filters.q.trim().toLowerCase();
              const statusOk =
                filters.status === "all" || o.status === filters.status;
              if (!statusOk) return false;
              if (!q) return true;
              const p = productsMap[o.productId as string];
              const title = p?.title?.toLowerCase() || "";
              return o.id.toLowerCase().includes(q) || title.includes(q);
            })
            .map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                product={productsMap[o.productId as string]}
                loadingProduct={loadingOrders}
                onCopy={handleCopy}
              />
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
      {/* Toast + aria-live region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        ref={announceRef}
      />
      {toasts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
          {toasts.map((t) => {
            const variant =
              t.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-300/10 dark:text-green-300"
                : t.type === "info"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-300/10 dark:text-blue-300"
                : "bg-red-100 text-red-800 dark:bg-red-300/10 dark:text-red-300";
            return (
              <div
                key={t.id}
                className={`animate-[toast-in_200ms_ease-out] rounded-md ${variant} text-sm px-3 py-2 shadow-lg/50 shadow-gray-900/40`}
              >
                {t.msg}
              </div>
            );
          })}
        </div>
      )}
      <style jsx>{`
        @keyframes toast-in {
          0% {
            opacity: 0;
            transform: translateY(-6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
