"use client";
/*
Add keyframes for modal animation using Tailwind's arbitrary value syntax is limited;
we add a small CSS block here for the custom keyframes used in the Modal component.
*/

import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/src/components/AdminLayout";
import { withAdminAuth } from "@/src/components/AdminAuthProvider";
import { useToastContext } from "@/src/components/ToastProvider";
import { formatCurrency } from "@/src/core/admin";
import { TopupRequest } from "@/src/core/admin";
import QRCodeGenerator from "@/src/components/QRCodeGenerator";
import { useRealtimeUpdates } from "@/src/hooks/useRealtimeUpdates";
import { useDataSync } from "@/src/components/DataSyncProvider";

function AdminTopupRequestsPageInner() {
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { show } = useToastContext();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const statusParam = filter === "all" ? "" : `?status=${filter}`;
      const response = await fetch(`/api/admin/topup-requests${statusParam}`);
      const data = await response.json();

      if (data.success) {
        setRequests(data.data.requests);
      } else {
        show(data.error || "Failed to fetch requests");
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      show("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  // Real-time updates: refresh list on relevant SSE events
  useRealtimeUpdates({
    onTopupRequestCreated: () => fetchRequests(),
    onTopupRequestUpdated: () => fetchRequests(),
    onTopupRequestProcessed: () => fetchRequests(),
    onBalanceUpdated: () => fetchRequests(),
    showNotifications: false,
  });

  const processRequest = async (
    requestId: string,
    action: "approve" | "reject",
    options: {
      approvedAmount?: number;
      adminNotes?: string;
      rejectionReason?: string;
    } = {}
  ) => {
    try {
      setProcessingId(requestId);
      const response = await fetch(`/api/admin/topup-requests/${requestId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          ...options,
        }),
      });

      const data = await response.json();

      if (data.success) {
        show(`Request ${action}d successfully`);
        fetchRequests(); // Refresh the list
      } else {
        show(data.error || `Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      show(`Failed to ${action} request`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";

    switch (status) {
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-300/20 dark:text-yellow-300`;
      case "approved":
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-300/20 dark:text-green-300`;
      case "rejected":
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-300/20 dark:text-red-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-300/20 dark:text-gray-300`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Đang chờ";
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Từ chối";
      default:
        return status;
    }
  };

  const pendingCount = requests.filter(
    (req) => req.status === "pending"
  ).length;

  return (
    <AdminLayout
      title="Yêu cầu nạp tiền"
      description="Xem xét và xử lý yêu cầu nạp tiền"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Quản lý yêu cầu nạp tiền
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Xem xét và xử lý các yêu cầu nạp tiền từ người dùng
            </p>
          </div>

          <button
            onClick={fetchRequests}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Làm mới
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-300/20 rounded-lg">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Đang chờ
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {pendingCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-300/20 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tổng yêu cầu
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {requests.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-300/20 rounded-lg">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Đã duyệt
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {requests.filter((req) => req.status === "approved").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-300/20 rounded-lg">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Từ chối
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {requests.filter((req) => req.status === "rejected").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
          <div className="flex space-x-1">
            {[
              {
                key: "pending",
                label: "Đang chờ",
                count: requests.filter((req) => req.status === "pending")
                  .length,
              },
              {
                key: "approved",
                label: "Đã duyệt",
                count: requests.filter((req) => req.status === "approved")
                  .length,
              },
              {
                key: "rejected",
                label: "Từ chối",
                count: requests.filter((req) => req.status === "rejected")
                  .length,
              },
              { key: "all", label: "Tất cả", count: requests.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  filter === tab.key
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-300/20 dark:text-blue-300 cursor-pointer"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">📝</div>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === "pending"
                  ? "Không có yêu cầu đang chờ"
                  : "Không có yêu cầu nào"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {requests.map((request) => (
                <TopupRequestItem
                  key={request.id}
                  request={request}
                  onProcess={processRequest}
                  isProcessing={processingId === request.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Individual request item component
function TopupRequestItem({
  request,
  onProcess,
  isProcessing,
}: {
  request: TopupRequest;
  onProcess: (id: string, action: "approve" | "reject", options?: any) => void;
  isProcessing: boolean;
}) {
  const { getUserByEmail } = useDataSync();

  function BalanceBadge({ email }: { email: string }) {
    const [balance, setBalance] = useState<number | null>(null);

    useEffect(() => {
      const u = getUserByEmail(email);
      if (u) {
        setBalance(u.balance);
        return;
      }
      // Fallback: call admin users API to fetch by email if not in client state yet
      const ctrl = new AbortController();
      async function fetchUser() {
        try {
          const res = await fetch(
            `/api/admin/users?search=${encodeURIComponent(email)}&limit=1`,
            { signal: ctrl.signal }
          );
          const data = await res.json();
          if (
            data?.success &&
            Array.isArray(data.data) &&
            data.data.length > 0
          ) {
            setBalance(data.data[0].balance);
          }
        } catch (e) {
          // ignore
        }
      }
      fetchUser();
      return () => ctrl.abort();
    }, [email]);

    if (balance == null) return null;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-300/10 border border-amber-200 dark:border-amber-300/20 text-amber-700 dark:text-amber-300 text-xs font-semibold">
        {formatCurrency(balance)}
      </span>
    );
  }
  // Quick actions with custom modals
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  const openApproveModal = () => setApproveOpen(true);
  const openRejectModal = () => {
    setRejectReasonInput("");
    setRejectOpen(true);
  };
  const closeApproveModal = () => setApproveOpen(false);
  const closeRejectModal = () => setRejectOpen(false);

  const confirmApprove = () => {
    const amount = request.requestedAmount;
    onProcess(request.id, "approve", { approvedAmount: amount });
    closeApproveModal();
  };

  const confirmReject = () => {
    if (!rejectReasonInput.trim()) return;
    onProcess(request.id, "reject", {
      rejectionReason: rejectReasonInput.trim(),
    });
    closeRejectModal();
  };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (approveOpen) closeApproveModal();
        if (rejectOpen) closeRejectModal();
      }
    }
    if (approveOpen || rejectOpen) {
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }
  }, [approveOpen, rejectOpen]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";

    switch (status) {
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-300/20 dark:text-yellow-300`;
      case "approved":
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-300/20 dark:text-green-300`;
      case "rejected":
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-300/20 dark:text-red-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-300/20 dark:text-gray-300`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Đang chờ";
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Từ chối";
      default:
        return status;
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-start w-full p-3 h-full bg-blue-50 dark:bg-blue-300/10 border border-blue-200 dark:border-blue-300/20 rounded mx-auto">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {request.userName}
            </h3>
            <span className={getStatusBadge(request.status)}>
              {getStatusText(request.status)}
            </span>
          </div>

          {/* User current balance */}
          <div className="mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
              Số dư hiện tại:
            </span>
            <BalanceBadge email={request.userEmail} />
          </div>
        </div>
        <div className="flex-1 mt-8 p-4 text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>Email: {request.userEmail}</p>
          <p>
            Số tiền yêu cầu:{" "}
            <span className="font-semibold text-blue-600">
              {formatCurrency(request.requestedAmount)}
            </span>
          </p>
          {request.processedAt && (
            <p>
              Xử lý lúc: {new Date(request.processedAt).toLocaleString("vi-VN")}{" "}
              bởi {request.processedByName}
            </p>
          )}
          {request.transferContent && (
            <div>
              Nội dung:{" "}
              <span className=" text-blue-800 font-bold">
                {request.transferContent}
              </span>
            </div>
          )}
          <p>
            Thời gian: {new Date(request.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {request.status === "pending" && (
            <>
              <button
                onClick={openApproveModal}
                disabled={isProcessing}
                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded cursor-pointer"
                title="Duyệt yêu cầu với số tiền đã yêu cầu"
              >
                Duyệt
              </button>
              <button
                onClick={openRejectModal}
                disabled={isProcessing}
                className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded cursor-pointer"
                title="Từ chối nhanh, sẽ hỏi lý do"
              >
                Từ chối
              </button>
            </>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      <Modal
        open={approveOpen}
        onClose={closeApproveModal}
        title="Xác nhận duyệt yêu cầu"
        footer={
          <>
            <button
              onClick={closeApproveModal}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded cursor-pointer"
              title="Đóng"
            >
              Hủy
            </button>
            <button
              onClick={confirmApprove}
              autoFocus
              className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer"
            >
              Xác nhận duyệt
            </button>
          </>
        }
      >
        <div className="space-y-2 text-sm">
          <p>
            Duyệt nạp cho:{" "}
            <span className="font-medium">{request.userEmail}</span>
          </p>
          <p>
            Số tiền:{" "}
            <span className="font-semibold text-green-700 dark:text-green-300">
              {formatCurrency(request.requestedAmount)}
            </span>
          </p>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={rejectOpen}
        onClose={closeRejectModal}
        title="Từ chối yêu cầu nạp tiền"
        footer={
          <>
            <button
              onClick={closeRejectModal}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={confirmReject}
              disabled={!rejectReasonInput.trim()}
              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded cursor-pointer"
            >
              Xác nhận từ chối
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Lý do từ chối
          </label>
          <textarea
            value={rejectReasonInput}
            onChange={(e) => setRejectReasonInput(e.target.value)}
            rows={3}
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800"
            placeholder="Nhập lý do từ chối..."
          />
        </div>
      </Modal>

      {/* User Notes */}
      {request.userNotes && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ghi chú từ người dùng:
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {request.userNotes}
          </p>
        </div>
      )}
    </div>
  );
}

// Simple modal component
function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-150 ease-out"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-lg transition-all duration-150 ease-out opacity-100 scale-100">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="p-4">{children}</div>
        {footer && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
export default withAdminAuth(AdminTopupRequestsPageInner);
