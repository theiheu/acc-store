"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import LoadingSpinner from "@/src/components/LoadingSpinner";

// Generate unique account ID from user email
const generateAccountId = (email: string): string => {
  // Create a simple hash from email to ensure uniqueness
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive number and format as 6-digit ID
  const accountId = Math.abs(hash).toString().padStart(6, "0").slice(-6);
  return `ACC${accountId}`;
};

// Mock transaction data - will be replaced with real data from API
const getMockTransactions = (userEmail: string) => [
  {
    id: "TXN001",
    amount: 500000,
    status: "completed",
    createdAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T10:35:00Z",
    method: "bank_transfer",
    reference: `NAPTHE ${generateAccountId(userEmail)}`,
  },
  {
    id: "TXN002",
    amount: 200000,
    status: "pending",
    createdAt: "2024-01-14T14:20:00Z",
    method: "bank_transfer",
    reference: `NAPTHE ${generateAccountId(userEmail)}`,
  },
  {
    id: "TXN003",
    amount: 1000000,
    status: "completed",
    createdAt: "2024-01-13T09:15:00Z",
    completedAt: "2024-01-13T09:20:00Z",
    method: "bank_transfer",
    reference: `NAPTHE ${generateAccountId(userEmail)}`,
  },
];

const STATUS_CONFIG = {
  pending: {
    label: "Đang xử lý",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-300/10",
    icon: "⏳",
  },
  completed: {
    label: "Hoàn thành",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-300/10",
    icon: "✅",
  },
  failed: {
    label: "Thất bại",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-300/10",
    icon: "❌",
  },
};

export default function DepositHistoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/login?next=/deposit/history");
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

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString("vi-VN");
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get mock transactions for current user
  const mockTransactions = session?.user?.email
    ? getMockTransactions(session.user.email)
    : [];

  const totalDeposited = mockTransactions
    .filter((tx) => tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const pendingAmount = mockTransactions
    .filter((tx) => tx.status === "pending")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Lịch sử nạp tiền</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Theo dõi các giao dịch nạp tiền của bạn
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/deposit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-300 text-gray-900 rounded-lg hover:bg-amber-400 transition-colors font-medium"
            >
              <span>💰</span>
              Nạp tiền
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              ← Tài khoản
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-300/10 flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400">💰</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tổng đã nạp
              </p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(totalDeposited)} VNĐ
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-300/10 flex items-center justify-center">
              <span className="text-yellow-600 dark:text-yellow-400">⏳</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Đang xử lý
              </p>
              <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                {formatCurrency(pendingAmount)} VNĐ
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-300/10 flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400">📊</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tổng giao dịch
              </p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {mockTransactions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Giao dịch gần đây</h2>
        </div>

        {mockTransactions.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {mockTransactions.map((transaction) => {
              const statusConfig =
                STATUS_CONFIG[transaction.status as keyof typeof STATUS_CONFIG];

              return (
                <div
                  key={transaction.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-300/10 flex items-center justify-center">
                        <span className="text-amber-600 dark:text-amber-400">
                          💳
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">
                            Nạp tiền qua chuyển khoản
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}
                          >
                            <span>{statusConfig.icon}</span>
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <p>
                            Mã giao dịch:{" "}
                            <span className="font-mono">{transaction.id}</span>
                          </p>
                          <p>
                            Tham chiếu:{" "}
                            <span className="font-mono">
                              {transaction.reference}
                            </span>
                          </p>
                          <p>Thời gian: {formatDate(transaction.createdAt)}</p>
                          {transaction.completedAt && (
                            <p>
                              Hoàn thành: {formatDate(transaction.completedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                        +{formatCurrency(transaction.amount)} VNĐ
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Chuyển khoản
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Chưa có giao dịch nào
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Bạn chưa thực hiện giao dịch nạp tiền nào
            </p>
            <Link
              href="/deposit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-300 text-gray-900 rounded-lg hover:bg-amber-400 transition-colors font-medium"
            >
              <span>💰</span>
              Nạp tiền ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
