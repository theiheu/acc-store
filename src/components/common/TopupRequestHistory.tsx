"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/src/core/admin";
import { TopupRequest } from "@/src/core/admin";
import QRCodeGenerator from "@/src/components/ui/QRCodeGenerator";
import { useRealtimeUpdates } from "@/src/hooks/useRealtimeUpdates";
import { useToastContext } from "@/src/components/providers/ToastProvider";
import {
  getStatusBadge,
  getStatusText,
  isStatusPending,
} from "@/src/utils/status";

interface TopupRequestHistoryProps {
  refreshTrigger?: number;
}

export default function TopupRequestHistory({
  refreshTrigger,
}: TopupRequestHistoryProps) {
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQR, setExpandedQR] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/topup-request");
      const data = await response.json();

      if (data.success) {
        setRequests(data.data);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch requests");
      }
    } catch (err) {
      console.error("Error fetching top-up requests:", err);
      setError("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  }; // end fetchRequests

  const { show } = useToastContext();

  const cancelRequest = async (id: string) => {
    if (!confirm("Bạn có chắc muốn hủy yêu cầu nạp tiền này không?")) return;
    try {
      setCancellingId(id);
      const res = await fetch(`/api/user/topup-request/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "rejected",
                  rejectionReason: "Người dùng hủy yêu cầu",
                  processedAt: new Date() as any,
                }
              : r
          )
        );
        show("Đã hủy yêu cầu nạp tiền");
      } else {
        show(data.error || "Không thể hủy yêu cầu");
      }
    } catch (e) {
      console.error(e);
      show("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setCancellingId(null);
    }
  };

  // Real-time: subscribe to SSE and refresh on updates
  useRealtimeUpdates({
    onTopupRequestCreated: () => fetchRequests(),
    onTopupRequestUpdated: () => fetchRequests(),
    onTopupRequestProcessed: () => fetchRequests(),
    onTransactionCreated: () => fetchRequests(),
    showNotifications: false,
  });

  useEffect(() => {
    fetchRequests();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Lịch sử nạp tiền
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Lịch sử nạp tiền
        </h3>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchRequests}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Lịch sử nạp tiền
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Theo dõi trạng thái các yêu cầu nạp tiền của bạn
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium cursor-pointer"
        >
          Làm mới
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">📝</div>
          <p className="text-gray-600 dark:text-gray-400">
            Bạn chưa có yêu cầu nạp tiền nào
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(request.requestedAmount)}
                    </span>
                    <span className={getStatusBadge(request.status)}>
                      {getStatusText(request.status)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      Yêu cầu lúc:{" "}
                      {new Date(request.createdAt).toLocaleString("vi-VN")}
                    </p>
                    {request.processedAt && (
                      <p>
                        Xử lý lúc:{" "}
                        {new Date(request.processedAt).toLocaleString("vi-VN")}
                      </p>
                    )}
                    {request.processedByName && (
                      <p>Xử lý bởi: {request.processedByName}</p>
                    )}
                  </div>
                </div>
                <div>
                  {/* QR Code Button for Pending Requests */}
                  {isStatusPending(request.status) && request.qrCodeData && (
                    <button
                      onClick={() =>
                        setExpandedQR(
                          expandedQR === request.id ? null : request.id
                        )
                      }
                      className="mt-2 px-3 py-1 w-[100px] text-sm bg-blue-100 dark:bg-blue-300/10 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-300/20 transition-colors cursor-pointer"
                    >
                      {expandedQR === request.id
                        ? "Ẩn chi tiết"
                        : "Xem chi tiết"}
                    </button>
                  )}

                  {/* Cancel button for pending */}
                  {isStatusPending(request.status) && (
                    <div className="mt-3">
                      <button
                        onClick={() => cancelRequest(request.id)}
                        disabled={cancellingId === request.id}
                        className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-300/10 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-300/20 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {cancellingId === request.id
                          ? "Đang hủy..."
                          : "Hủy yêu cầu"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Display */}
              {isStatusPending(request.status) &&
                request.qrCodeData &&
                expandedQR === request.id && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-300/10 border border-blue-200 dark:border-blue-300/20 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* QR Code */}
                      <div className="text-center">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
                          Mã QR chuyển khoản
                        </h4>
                        <div className="flex items-center justify-center mb-3">
                          <QRCodeGenerator
                            data={request.qrCodeData}
                            size={150}
                            className="mx-auto"
                          />
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                request.qrCodeData || ""
                              );
                              // You might want to add a toast notification here
                            }}
                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-300/10 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-300/20 transition-colors"
                          >
                            📋 Copy QR
                          </button>
                        </div>
                      </div>

                      {/* Bank Info */}
                      <div>
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
                          Thông tin chuyển khoản
                        </h4>
                        <div className="space-y-2 text-sm">
                          {request.bankInfo && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-blue-700 dark:text-blue-300">
                                  Ngân hàng:
                                </span>
                                <span className="font-medium text-blue-900 dark:text-blue-100">
                                  {request.bankInfo.bankName}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700 dark:text-blue-300">
                                  STK:
                                </span>
                                <span className="font-mono font-medium text-blue-900 dark:text-blue-100">
                                  {request.bankInfo.accountNumber}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700 dark:text-blue-300">
                                  Chủ TK:
                                </span>
                                <span className="font-medium text-blue-900 dark:text-blue-100">
                                  {request.bankInfo.accountName}
                                </span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between">
                            <span className="text-blue-700 dark:text-blue-300">
                              Số tiền:
                            </span>
                            <span className="font-bold text-blue-900 dark:text-blue-100">
                              {formatCurrency(request.requestedAmount)}
                            </span>
                          </div>
                          {request.transferContent && (
                            <div className="flex justify-between items-center">
                              <span className="text-blue-700 dark:text-blue-300">
                                Nội dung:
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs text-blue-900 dark:text-blue-100">
                                  {request.transferContent}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      request.transferContent || ""
                                    );
                                  }}
                                  className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Copy nội dung"
                                >
                                  📋
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-300/10 border border-amber-200 dark:border-amber-300/20 rounded text-xs text-amber-800 dark:text-amber-200">
                      <strong>Lưu ý:</strong> Chuyển khoản đúng số tiền và nội
                      dung để admin có thể xác nhận nhanh chóng.
                    </div>
                  </div>
                )}

              {/* User Notes */}
              {request.userNotes && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ghi chú của bạn:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded p-2">
                    {request.userNotes}
                  </p>
                </div>
              )}

              {/* Admin Response */}
              {request.status === "approved" && (
                <div className="bg-green-50 dark:bg-green-300/10 border border-green-200 dark:border-green-300/20 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Đã duyệt
                      {request.approvedAmount !== request.requestedAmount && (
                        <span className="ml-2">
                          (Số tiền duyệt:{" "}
                          {formatCurrency(request.approvedAmount || 0)})
                        </span>
                      )}
                    </span>
                  </div>
                  {request.adminNotes && (
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Ghi chú admin: {request.adminNotes}
                    </p>
                  )}
                </div>
              )}

              {request.status === "rejected" && (
                <div className="bg-red-50 dark:bg-red-300/10 border border-red-200 dark:border-red-300/20 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">
                      Từ chối
                    </span>
                  </div>
                  {request.rejectionReason && (
                    <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                      Lý do: {request.rejectionReason}
                    </p>
                  )}
                  {request.adminNotes && (
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Ghi chú admin: {request.adminNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
