"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useToastContext } from "@/src/components/providers/ToastProvider";
import { formatCurrency } from "@/src/core/admin";
import QRCodeGenerator from "@/src/components/ui/QRCodeGenerator";

// Bank account configuration
const BANK_CONFIG = {
  bankName: "Vietcombank",
  accountNumber: "1234567890",
  accountName: "CONG TY TNHH ACC STORE",
  bankCode: "VCB",
};

interface TopupRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TopupRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: TopupRequestModalProps) {
  const { data: session } = useSession();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const { show } = useToastContext();

  // Generate account ID for transfer content
  const generateAccountId = (email: string): string => {
    return email
      .split("@")[0]
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 8);
  };

  // Generate transfer content
  const transferContent = session?.user?.email
    ? `NAPTHE ${generateAccountId(session.user.email)}`
    : "NAPTHE UNKNOWN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseInt(amount.replace(/[^\d]/g, ""));

    if (!numAmount || numAmount < 10000) {
      show("Số tiền tối thiểu là 10,000 ₫");
      return;
    }

    if (numAmount > 10000000) {
      show("Số tiền tối đa là 10,000,000 ₫");
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate QR code data
      const qrData = `${BANK_CONFIG.bankCode}|${BANK_CONFIG.accountNumber}|${BANK_CONFIG.accountName}|${numAmount}|${transferContent}`;

      const response = await fetch("/api/user/topup-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: numAmount,
          notes: notes.trim(),
          qrCodeData: qrData,
          transferContent,
          bankInfo: BANK_CONFIG,
        }),
      });

      const data = await response.json();

      if (data.success) {
        show("Yêu cầu nạp tiền đã được tạo thành công!");
        setRequestId(data.data.requestId);
        setShowQR(true);
        // Don't close modal yet, show QR code first
      } else {
        show(data.error || "Có lỗi xảy ra khi gửi yêu cầu");
      }
    } catch (error) {
      console.error("Error submitting top-up request:", error);
      show("Có lỗi xảy ra khi gửi yêu cầu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setNotes("");
    setShowQR(false);
    setRequestId(null);
    onClose();
  };

  const handleComplete = () => {
    onSuccess();
    handleClose();
  };

  const formatAmountInput = (value: string) => {
    const numValue = value.replace(/[^\d]/g, "");
    if (!numValue) return "";
    return parseInt(numValue).toLocaleString("vi-VN");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmountInput(e.target.value);
    setAmount(formatted);
  };

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  if (!isOpen) return null;

  const numericAmount = parseInt(amount.replace(/[^\d]/g, "")) || 0;
  const qrData = `${BANK_CONFIG.bankCode}|${BANK_CONFIG.accountNumber}|${BANK_CONFIG.accountName}|${numericAmount}|${transferContent}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {showQR ? "Thông tin chuyển khoản" : "Yêu cầu nạp tiền"}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {!showQR ? (
            // Request Form

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Số tiền cần nạp *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Nhập số tiền"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                  <span className="absolute right-3 top-3 text-gray-500 dark:text-gray-400">
                    ₫
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tối thiểu: 10,000 ₫ - Tối đa: 10,000,000 ₫
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chọn nhanh
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      type="button"
                      onClick={() =>
                        setAmount(quickAmount.toLocaleString("vi-VN"))
                      }
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {formatCurrency(quickAmount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thêm ghi chú cho yêu cầu nạp tiền..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {notes.length}/500 ký tự
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-300/10 border border-blue-200 dark:border-blue-300/20 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Yêu cầu sẽ được admin xem xét và phê duyệt</li>
                      <li>• Thời gian xử lý: 1-24 giờ trong giờ hành chính</li>
                      <li>
                        • Bạn sẽ nhận được thông báo khi yêu cầu được xử lý
                      </li>
                      <li>• Tối đa 3 yêu cầu đang chờ xử lý cùng lúc</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !amount}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi yêu cầu"
                  )}
                </button>
              </div>
            </form>
          ) : (
            // QR Code Display
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-50 dark:bg-green-300/10 border border-green-200 dark:border-green-300/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-300/20 rounded-full flex items-center justify-center">
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
                  <div>
                    <h3 className="font-medium text-green-800 dark:text-green-200">
                      Yêu cầu đã được tạo thành công!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Vui lòng chuyển khoản theo thông tin bên dưới và chờ admin
                      xác nhận.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Mã QR chuyển khoản
                  </h3>
                  <div className="flex items-center justify-center mb-4">
                    <QRCodeGenerator
                      data={qrData}
                      size={200}
                      className="mx-auto"
                    />
                  </div>

                  {/* QR Actions */}
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <button
                      onClick={() => {
                        const canvas = document.querySelector("canvas");
                        if (canvas) {
                          const link = document.createElement("a");
                          link.download = `QR-NAPTHE-${requestId}.png`;
                          link.href = canvas.toDataURL();
                          link.click();
                          show("Đã tải QR code thành công!");
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-300/10 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-300/20 transition-colors cursor-pointer"
                    >
                      <span>💾</span>
                      Tải QR
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(qrData);
                        show("Đã copy dữ liệu QR!");
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span>📋</span>
                      Copy QR
                    </button>
                  </div>

                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-300/10 text-green-800 dark:text-green-200 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Số tiền: {formatCurrency(numericAmount)}
                  </div>
                </div>

                {/* Bank Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Thông tin chuyển khoản
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Ngân hàng
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {BANK_CONFIG.bankName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Số tài khoản
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                          {BANK_CONFIG.accountNumber}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              BANK_CONFIG.accountNumber
                            );
                            show("Đã copy số tài khoản!");
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                          title="Copy số tài khoản"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Chủ tài khoản
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {BANK_CONFIG.accountName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Số tiền
                      </span>
                      <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                        {formatCurrency(numericAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-start p-3 bg-amber-50 dark:bg-amber-300/10 rounded-lg border border-amber-200 dark:border-amber-300/20">
                      <span className="text-sm text-amber-700 dark:text-amber-300">
                        Nội dung CK
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-amber-800 dark:text-amber-200">
                          {transferContent}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(transferContent);
                            show("Đã copy nội dung chuyển khoản!");
                          }}
                          className="p-1 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                          title="Copy nội dung chuyển khoản"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-blue-50 dark:bg-blue-300/10 border border-blue-200 dark:border-blue-300/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-2">Lưu ý quan trọng:</p>
                    <ul className="space-y-1 text-xs">
                      <li>
                        • Chuyển khoản chính xác số tiền:{" "}
                        <strong>{formatCurrency(numericAmount)}</strong>
                      </li>
                      <li>
                        • Nhập đúng nội dung: <strong>{transferContent}</strong>
                      </li>
                      <li>• Yêu cầu đang ở trạng thái "Chờ duyệt"</li>
                      <li>• Admin sẽ xác nhận sau khi nhận được tiền</li>
                      <li>• Thời gian xử lý: 1-24 giờ trong giờ hành chính</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleComplete}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  Đã chuyển khoản
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
