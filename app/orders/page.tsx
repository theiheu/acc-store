"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import LoadingSpinner from "@/src/components/LoadingSpinner";

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/login?next=/orders");
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

      {/* Empty State */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="text-center py-16 px-6">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <span className="text-4xl">📦</span>
          </div>
          
          <h2 className="text-xl font-semibold mb-2">Chưa có đơn hàng nào</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Bạn chưa thực hiện đơn hàng nào. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-300 text-gray-900 rounded-lg hover:bg-amber-400 transition-colors font-medium"
            >
              <span>🛍️</span>
              Bắt đầu mua sắm
            </Link>
            
            <Link
              href="/products/premium"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span>⭐</span>
              Xem sản phẩm Premium
            </Link>
          </div>
        </div>
      </div>

      {/* Order Status Info */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-yellow-100 dark:bg-yellow-300/10 flex items-center justify-center">
            <span className="text-yellow-600 dark:text-yellow-400">⏳</span>
          </div>
          <p className="text-sm font-medium mb-1">Chờ xử lý</p>
          <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">0</p>
        </div>
        
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-300/10 flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400">🚚</span>
          </div>
          <p className="text-sm font-medium mb-1">Đang giao</p>
          <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">0</p>
        </div>
        
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-300/10 flex items-center justify-center">
            <span className="text-green-600 dark:text-green-400">✅</span>
          </div>
          <p className="text-sm font-medium mb-1">Hoàn thành</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">0</p>
        </div>
        
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-red-100 dark:bg-red-300/10 flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400">❌</span>
          </div>
          <p className="text-sm font-medium mb-1">Đã hủy</p>
          <p className="text-2xl font-semibold text-red-600 dark:text-red-400">0</p>
        </div>
      </div>
    </div>
  );
}
