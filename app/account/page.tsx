"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useToastContext } from "@/src/components/ToastProvider";
import { useGlobalLoading } from "@/src/components/GlobalLoadingProvider";
import { useCurrentUser, useDataSync } from "@/src/components/DataSyncProvider";
import { useAccountRealtimeUpdates } from "@/src/hooks/useRealtimeUpdates";
import { formatCurrency } from "@/src/core/admin";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import TopupRequestModal from "@/src/components/TopupRequestModal";

export default function AccountPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { show } = useToastContext();
  const { withLoading } = useGlobalLoading();
  const currentUser = useCurrentUser();
  const { getUserTransactions, lastUpdate } = useDataSync();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupRefreshTrigger, setTopupRefreshTrigger] = useState(0);

  // Set up real-time updates for this user
  const { isConnected } = useAccountRealtimeUpdates(currentUser?.id);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/login?next=/account");
    }
  }, [router, session?.user, status]);

  // Update transactions when data changes
  useEffect(() => {
    if (currentUser) {
      const userTransactions = getUserTransactions(currentUser.id);
      setTransactions(userTransactions.slice(0, 5)); // Show last 5 transactions
    }
  }, [currentUser, getUserTransactions, lastUpdate]);

  async function handleSignOut() {
    try {
      await withLoading(async () => {
        await signOut({ redirect: false });
        router.push("/");
      }, "Đang đăng xuất...");

      show("Đã đăng xuất thành công");
    } catch (error) {
      show("Có lỗi xảy ra khi đăng xuất");
      console.error("Sign out error:", error);
    }
  }

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

  const user = session.user;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Tài khoản của tôi</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Quản lý thông tin cá nhân và đơn hàng
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-300/10 rounded-lg transition-colors"
          >
            <span>🚪</span>
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
            <div className="text-center">
              {/* Avatar */}
              <div className="mb-4">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "Avatar"}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full mx-auto"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-300/10 flex items-center justify-center mx-auto">
                    <span className="text-2xl font-medium text-amber-800 dark:text-amber-200">
                      {(user.name || user.email || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <h2 className="text-lg font-semibold mb-1">
                {user.name || "Người dùng"}
              </h2>
              {user.email && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {user.email}
                </p>
              )}

              {/* Account Balance */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-300/10 dark:to-amber-300/5 rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                      Số dư tài khoản
                    </p>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                      {currentUser
                        ? formatCurrency(currentUser.balance)
                        : "0 ₫"}
                    </p>
                    {currentUser && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isConnected
                              ? "bg-green-500 animate-pulse"
                              : "bg-gray-400"
                          }`}
                        ></div>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          {isConnected ? "Cập nhật tự động" : "Mất kết nối"} •{" "}
                          {new Date(lastUpdate).toLocaleTimeString("vi-VN")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                      {transactions.length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Giao dịch
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                      {currentUser?.status === "active" ? "✓" : "⚠"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Trạng thái
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction History */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">
              Lịch sử giao dịch gần đây
            </h3>

            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-2xl">💳</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  Chưa có giao dịch nào
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === "credit"
                            ? "bg-green-100 dark:bg-green-300/10"
                            : "bg-red-100 dark:bg-red-300/10"
                        }`}
                      >
                        <span className="text-lg">
                          {transaction.type === "credit" ? "💰" : "💸"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            {new Date(transaction.createdAt).toLocaleString(
                              "vi-VN"
                            )}
                          </span>
                          {transaction.adminId && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 dark:text-blue-400">
                                {transaction.metadata?.topupRequestId
                                  ? "Theo yêu cầu"
                                  : "Admin thực hiện"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          transaction.type === "credit"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {transaction.type === "credit" ? "+" : ""}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.type === "credit"
                          ? "Nạp tiền"
                          : transaction.type === "debit"
                          ? "Trừ tiền"
                          : transaction.type === "purchase"
                          ? "Mua hàng"
                          : "Hoàn tiền"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Thao tác nhanh</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              <Link
                href="/products"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-300/10 hover:border-amber-300 dark:hover:border-amber-300/30 transition-all"
              >
                <span className="text-xl">🛍️</span>
                <div>
                  <p className="font-medium text-sm">Mua sắm</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Khám phá sản phẩm
                  </p>
                </div>
              </Link>

              <Link
                href="/orders"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-300/10 hover:border-amber-300 dark:hover:border-amber-300/30 transition-all"
              >
                <span className="text-xl">📦</span>
                <div>
                  <p className="font-medium text-sm">Đơn hàng</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Xem lịch sử mua hàng
                  </p>
                </div>
              </Link>

              <button
                onClick={() => setShowTopupModal(true)}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-300/10 hover:border-amber-300 dark:hover:border-amber-300/30 transition-all w-full text-left"
              >
                <span className="text-xl">💰</span>
                <div>
                  <p className="font-medium text-sm">Yêu cầu nạp tiền</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tạo QR code và gửi yêu cầu
                  </p>
                </div>
              </button>

              <Link
                href="/deposit"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-300/10 hover:border-amber-300 dark:hover:border-amber-300/30 transition-all"
              >
                <span className="text-xl">📊</span>
                <div>
                  <p className="font-medium text-sm">Lịch sử nạp tiền</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Xem giao dịch và nạp tiền
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Đơn hàng gần đây</h3>
              <Link
                href="/orders"
                className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
              >
                Xem tất cả →
              </Link>
            </div>

            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Chưa có đơn hàng nào
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hãy bắt đầu mua sắm để xem đơn hàng tại đây
              </p>
            </div>
          </div>

          {/* Account Info */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin tài khoản</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tên hiển thị
                </span>
                <span className="text-sm font-medium">
                  {user.name || "Chưa cập nhật"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Email
                </span>
                <span className="text-sm font-medium">
                  {user.email || "Chưa cập nhật"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Trạng thái
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-300/10 text-green-800 dark:text-green-200 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Đã xác thực
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top-up Request Modal */}
      <TopupRequestModal
        isOpen={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        onSuccess={() => {
          setTopupRefreshTrigger((prev) => prev + 1);
        }}
      />
    </div>
  );
}
