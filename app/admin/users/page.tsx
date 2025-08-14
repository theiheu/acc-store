"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/src/components/AdminLayout";
import { withAdminAuth } from "@/src/components/AdminAuthProvider";
import { useGlobalLoading } from "@/src/components/GlobalLoadingProvider";
import { useToastContext } from "@/src/components/ToastProvider";
import { AdminUser, PaginatedResponse } from "@/src/core/admin";
import { formatCurrency } from "@/src/core/admin";
import LoadingSpinner from "@/src/components/LoadingSpinner";

function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const { withLoading } = useGlobalLoading();
  const { show } = useToastContext();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, selectedRole, selectedStatus]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: searchTerm,
        role: selectedRole === "all" ? "" : selectedRole,
        status: selectedStatus === "all" ? "" : selectedStatus,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const result = await response.json();

      if (result.success) {
        setUsers(result.data);
        setTotalPages(result.pagination.totalPages);
      } else {
        show("Không thể tải danh sách người dùng");
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      show("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(
    userId: string,
    newStatus: "active" | "suspended" | "banned"
  ) {
    try {
      await withLoading(async () => {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        const result = await response.json();
        if (result.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
          );
          show(`Trạng thái người dùng đã được cập nhật`);
        } else {
          show("Không thể cập nhật trạng thái người dùng");
        }
      }, "Đang cập nhật...");
    } catch (error) {
      console.error("Update user status error:", error);
      show("Có lỗi xảy ra");
    }
  }

  function openTopUpModal(user: AdminUser) {
    setSelectedUser(user);
    setShowTopUpModal(true);
  }

  return (
    <AdminLayout
      title="Quản lý người dùng"
      description="Quản lý tài khoản người dùng, số dư và giao dịch"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="user">Người dùng</option>
              <option value="admin">Quản trị viên</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="suspended">Tạm khóa</option>
              <option value="banned">Cấm vĩnh viễn</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Không tìm thấy người dùng nào
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Người dùng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Số dư
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Đơn hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Đăng ký
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-300/10 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                              {user.name?.charAt(0).toUpperCase() ||
                                user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.name || "Chưa cập nhật"}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === "admin"
                              ? "bg-purple-100 dark:bg-purple-300/10 text-purple-800 dark:text-purple-300"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {user.role === "admin" ? "Quản trị" : "Người dùng"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(user.balance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div>
                          <div>{user.totalOrders} đơn</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatCurrency(user.totalSpent)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openTopUpModal(user)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 cursor-pointer"
                          >
                            Nạp tiền
                          </button>
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 cursor-pointer"
                          >
                            Chi tiết
                          </Link>
                          {user.status === "active" ? (
                            <button
                              onClick={() =>
                                handleStatusChange(user.id, "suspended")
                              }
                              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 cursor-pointer"
                            >
                              Khóa
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleStatusChange(user.id, "active")
                              }
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 cursor-pointer"
                            >
                              Mở khóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Trang {currentPage} / {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top-up Modal */}
      {showTopUpModal && selectedUser && (
        <TopUpModal
          user={selectedUser}
          onClose={() => {
            setShowTopUpModal(false);
            setSelectedUser(null);
          }}
          onSuccess={(newBalance) => {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === selectedUser.id ? { ...u, balance: newBalance } : u
              )
            );
            setShowTopUpModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </AdminLayout>
  );
}

// Top-up Modal Component
interface TopUpModalProps {
  user: AdminUser;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

function TopUpModal({ user, onClose, onSuccess }: TopUpModalProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { show } = useToastContext();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const amountNum = parseInt(amount);
    if (!amountNum || amountNum <= 0) {
      show("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (!description.trim()) {
      show("Vui lòng nhập lý do nạp tiền");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${user.id}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          description: description.trim(),
          adminNote: adminNote.trim(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        show(
          `Đã nạp ${amountNum.toLocaleString("vi-VN")} VND cho ${user.email}`
        );
        onSuccess(result.data.user.balance);
      } else {
        show(result.error || "Không thể nạp tiền");
      }
    } catch (error) {
      console.error("Top-up error:", error);
      show("Có lỗi xảy ra khi nạp tiền");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Nạp tiền cho {user.name || user.email}
        </h3>

        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Số dư hiện tại:{" "}
            <span className="font-medium">{formatCurrency(user.balance)}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Số tiền nạp (VND) *
            </label>
            <input
              type="number"
              min="1000"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="100000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lý do nạp tiền *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Ví dụ: Khuyến mãi, hoàn tiền, bonus..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ghi chú admin (tùy chọn)
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
              placeholder="Ghi chú nội bộ..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Đang nạp..." : "Nạp tiền"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default withAdminAuth(UserManagement);
