"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/src/components/AdminLayout";
import { withAdminAuth } from "@/src/components/AdminAuthProvider";
import { useGlobalLoading } from "@/src/components/GlobalLoadingProvider";
import { useToastContext } from "@/src/components/ToastProvider";
import { AdminUser, UserTransaction } from "@/src/core/admin";
import { formatCurrency } from "@/src/core/admin";
import LoadingSpinner from "@/src/components/LoadingSpinner";

import { formatTransactionDescription } from "@/src/utils/transactions";

function UserDetail() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { withLoading } = useGlobalLoading();
  const { show } = useToastContext();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchTransactions();
    }
  }, [userId, currentPage]);

  async function fetchUser() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);
      const result = await response.json();

      if (result.success) {
        setUser(result.data);
      } else {
        show("Không thể tải thông tin người dùng");
        router.push("/admin/users");
      }
    } catch (error) {
      console.error("Fetch user error:", error);
      show("Có lỗi xảy ra khi tải dữ liệu");
      router.push("/admin/users");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTransactions() {
    try {
      setTransactionsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      const response = await fetch(
        `/api/admin/users/${userId}/topup?${params}`
      );
      const result = await response.json();

      if (result.success) {
        setTransactions(result.data);
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        show("Không thể tải lịch sử giao dịch");
      }
    } catch (error) {
      console.error("Fetch transactions error:", error);
      show("Có lỗi xảy ra khi tải lịch sử giao dịch");
    } finally {
      setTransactionsLoading(false);
    }
  }

  async function handleStatusChange(
    newStatus: "active" | "suspended" | "banned"
  ) {
    if (!user) return;

    const statusText =
      newStatus === "active"
        ? "kích hoạt"
        : newStatus === "suspended"
        ? "tạm khóa"
        : "cấm vĩnh viễn";

    if (!confirm(`Bạn có chắc chắn muốn ${statusText} tài khoản này?`)) {
      return;
    }

    try {
      await withLoading(async () => {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        const result = await response.json();
        if (result.success) {
          setUser((prev) => (prev ? { ...prev, status: newStatus } : null));
          show(`Tài khoản đã được ${statusText}`);
        } else {
          show("Không thể cập nhật trạng thái tài khoản");
        }
      }, "Đang cập nhật...");
    } catch (error) {
      console.error("Update user status error:", error);
      show("Có lỗi xảy ra");
    }
  }

  if (loading) {
    return (
      <AdminLayout
        title="Chi tiết người dùng"
        description="Thông tin chi tiết và lịch sử giao dịch"
      >
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout
        title="Chi tiết người dùng"
        description="Thông tin chi tiết và lịch sử giao dịch"
      >
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Không tìm thấy người dùng
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={`${user.name || user.email}`}
      description="Thông tin chi tiết và lịch sử giao dịch"
    >
      <div className="space-y-6">
        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-300/10 rounded-full flex items-center justify-center">
                <span className="text-xl font-medium text-amber-800 dark:text-amber-200">
                  {user.name?.charAt(0).toUpperCase() ||
                    user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {user.name || "Chưa cập nhật"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === "active"
                        ? "bg-green-100 dark:bg-green-300/10 text-green-800 dark:text-green-300"
                        : user.status === "suspended"
                        ? "bg-yellow-100 dark:bg-yellow-300/10 text-yellow-800 dark:text-yellow-300"
                        : "bg-red-100 dark:bg-red-300/10 text-red-800 dark:text-red-300"
                    }`}
                  >
                    {user.status === "active"
                      ? "Hoạt động"
                      : user.status === "suspended"
                      ? "Tạm khóa"
                      : "Cấm"}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === "admin"
                        ? "bg-purple-100 dark:bg-purple-300/10 text-purple-800 dark:text-purple-300"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {user.role === "admin" ? "Quản trị" : "Người dùng"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {user.status === "active" ? (
                <button
                  onClick={() => handleStatusChange("suspended")}
                  className="px-3 py-2 text-sm bg-yellow-100 dark:bg-yellow-300/10 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-300/20 transition-colors cursor-pointer"
                >
                  Tạm khóa
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange("active")}
                  className="px-3 py-2 text-sm bg-green-100 dark:bg-green-300/10 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-300/20 transition-colors cursor-pointer"
                >
                  Kích hoạt
                </button>
              )}

              {user.status !== "banned" && (
                <button
                  onClick={() => handleStatusChange("banned")}
                  className="px-3 py-2 text-sm bg-red-100 dark:bg-red-300/10 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-300/20 transition-colors cursor-pointer"
                >
                  Cấm vĩnh viễn
                </button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(user.balance)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Số dư hiện tại
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {user.totalOrders}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tổng đơn hàng
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(user.totalSpent)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tổng chi tiêu
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {new Date(user.createdAt).toLocaleDateString("vi-VN")}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ngày đăng ký
              </p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Lịch sử giao dịch
          </h3>

          {transactionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="md" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
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
                        {formatTransactionDescription(
                          transaction.description,
                          transaction.type
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleString(
                          "vi-VN"
                        )}
                      </p>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Trang {currentPage} / {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Trước
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(UserDetail);
