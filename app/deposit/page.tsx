"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useToastContext } from "@/src/components/providers/ToastProvider";
import { useGlobalLoading } from "@/src/components/providers/GlobalLoadingProvider";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import QRCodeGenerator from "@/src/components/ui/QRCodeGenerator";
import TopupRequestHistory from "@/src/components/common/TopupRequestHistory";

// Bank account configuration
const BANK_CONFIG = {
  bankName: "Vietcombank",
  accountNumber: "1234567890",
  accountName: "CONG TY TNHH ACC STORE",
  bankCode: "VCB",
};

// Deposit amount presets
const AMOUNT_PRESETS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export default function DepositPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { show } = useToastContext();
  const { withLoading } = useGlobalLoading();

  const [amount, setAmount] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [transferContent, setTransferContent] = useState("");
  const [userNote, setUserNote] = useState("");
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [topupRefreshTrigger, setTopupRefreshTrigger] = useState(0);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/login?next=/deposit");
    }
  }, [router, session?.user, status]);

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

  // Generate transfer content with unique account ID
  useEffect(() => {
    if (session?.user?.email) {
      const accountId = generateAccountId(session.user.email);
      setTransferContent(`NAPTHE ${accountId}`);
    }
  }, [session?.user?.email]);

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

  const validateAmount = (value: string): string | null => {
    const numValue = parseInt(value.replace(/[^\d]/g, ""));

    if (!value || numValue <= 0) {
      return "Vui lòng nhập số tiền hợp lệ";
    }

    if (numValue < 10000) {
      return "Số tiền tối thiểu là 10,000 ₫";
    }

    if (numValue > 10000000) {
      return "Số tiền tối đa là 10,000,000 ₫";
    }

    return null;
  };

  const formatCurrency = (value: string): string => {
    const numValue = value.replace(/[^\d]/g, "");
    return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setAmount(formatted);
    setSelectedPreset(null);

    // Clear errors on change
    if (errors.amount) {
      setErrors({ ...errors, amount: undefined });
    }
  };

  const handlePresetSelect = (presetAmount: number) => {
    setAmount(formatCurrency(presetAmount.toString()));
    setSelectedPreset(presetAmount);
    setErrors({ ...errors, amount: undefined });
  };

  const handleGenerateQR = async () => {
    const error = validateAmount(amount);
    if (error) {
      setErrors({ amount: error });
      return;
    }

    const numericAmount = parseInt(amount.replace(/[^\d]/g, "")) || 0;
    const qrData = `${BANK_CONFIG.bankCode}|${BANK_CONFIG.accountNumber}|${BANK_CONFIG.accountName}|${numericAmount}|${transferContent}`;

    try {
      await withLoading(async () => {
        const res = await fetch("/api/user/topup-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: numericAmount,
            notes: userNote,
            qrCodeData: qrData,
            transferContent,
            bankInfo: BANK_CONFIG,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "Tạo yêu cầu thất bại");
        }
        setShowQR(true);
        if (data.reused) {
          show("Đã cập nhật yêu cầu nạp tiền đang chờ với thông tin mới.");
        }
        setTopupRefreshTrigger((v) => v + 1);
      }, "Đang tạo mã QR và lưu yêu cầu...");

      show("Yêu cầu nạp tiền đã được tạo và mã QR đã sẵn sàng!", "success");
    } catch (error: any) {
      const msg = error?.message || "Có lỗi xảy ra khi tạo yêu cầu nạp tiền";
      show(msg, "error");
      console.error("QR generation error:", error);
    }
  };

  const handleReset = () => {
    setAmount("");
    setSelectedPreset(null);
    setShowQR(false);
    setErrors({});
  };

  const numericAmount = parseInt(amount.replace(/[^\d]/g, "")) || 0;
  const qrData = `${BANK_CONFIG.bankCode}|${BANK_CONFIG.accountNumber}|${BANK_CONFIG.accountName}|${numericAmount}|${transferContent}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">
              Nạp tiền vào tài khoản
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nạp tiền qua chuyển khoản ngân hàng an toàn và nhanh chóng
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

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column - Two-Phase UI */}
        <div className="space-y-6">
          {!showQR ? (
            /* Phase 1 - QR Generation Form */
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                Nhập số tiền cần nạp
              </h2>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Số tiền (VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="Nhập số tiền..."
                    className={`w-full px-4 py-3 text-lg font-medium rounded-lg border ${
                      errors.amount
                        ? "border-red-300 dark:border-red-700"
                        : "border-gray-300 dark:border-gray-700"
                    } focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-800 dark:text-gray-100`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    VNĐ
                  </div>
                </div>
                {errors.amount && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.amount}
                  </p>
                )}

                {/* User Note */}
                <div className="my-2">
                  <label className="block text-sm font-medium mb-2">
                    Ghi chú (tuỳ chọn)
                  </label>
                  <textarea
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    rows={3}
                    maxLength={240}
                    placeholder="Ví dụ: Nạp gấp, vui lòng xác nhận sớm..."
                    className="w-full h-[40px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-800 dark:text-gray-100 text-sm"
                  />
                </div>
              </div>

              {/* Amount Presets */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  Chọn nhanh số tiền
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AMOUNT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handlePresetSelect(preset)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-all cursor-pointer ${
                        selectedPreset === preset
                          ? "border-amber-300 bg-amber-50 dark:bg-amber-300/10 text-amber-800 dark:text-amber-200"
                          : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      {formatCurrency(preset.toString())} VNĐ
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate QR Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateQR}
                  disabled={!amount || !!errors.amount}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-300 text-gray-900 rounded-lg hover:bg-amber-400 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>📱</span>
                  Tạo mã QR
                </button>
              </div>
            </div>
          ) : (
            /* Phase 2 - QR Code Display */
            <div className="space-y-6">
              {/* QR Code Section */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6 text-center">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Mã QR chuyển khoản</h2>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <span>🔄</span>
                    Tạo lại mã QR
                  </button>
                </div>

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
                        link.download = `QR-NAPTHE-${
                          session.user?.email
                            ? generateAccountId(session.user.email)
                            : "UNKNOWN"
                        }.png`;
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
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <span>📋</span>
                    Copy QR
                  </button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Quét mã QR bằng ứng dụng ngân hàng
                </p>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-300/10 text-green-800 dark:text-green-200 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Số tiền: {amount} VNĐ
                </div>
              </div>

              {/* Bank Transfer Info */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Thông tin chuyển khoản
                  </h3>
                  <button
                    onClick={() => {
                      const accountId = session.user?.email
                        ? generateAccountId(session.user.email)
                        : "";
                      const numericAmount = amount.replace(/[^\d]/g, "");
                      const allInfo = `Ngân hàng: ${BANK_CONFIG.bankName}
Số tài khoản: ${BANK_CONFIG.accountNumber}
Tên người nhận: ${BANK_CONFIG.accountName}
Số tiền: ${numericAmount}
Account ID: ${accountId}
Nội dung: ${transferContent}`;
                      navigator.clipboard.writeText(allInfo);
                      show("Đã copy tất cả thông tin chuyển khoản!");
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-amber-100 dark:bg-amber-300/10 text-amber-800 dark:text-amber-200 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-300/20 transition-colors cursor-pointer"
                  >
                    <span>📋</span>
                    Copy tất cả
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Ngân hàng
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {BANK_CONFIG.bankName}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(BANK_CONFIG.bankName);
                          show("Đã copy tên ngân hàng!");
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        title="Copy tên ngân hàng"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Số tài khoản
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium font-mono">
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
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Tên người nhận
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {BANK_CONFIG.accountName}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            BANK_CONFIG.accountName
                          );
                          show("Đã copy tên người nhận!");
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        title="Copy tên người nhận"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Số tiền
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        {amount} VNĐ
                      </span>
                      <button
                        onClick={() => {
                          const numericAmount = amount.replace(/[^\d]/g, "");
                          navigator.clipboard.writeText(numericAmount);
                          show("Đã copy số tiền!");
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        title="Copy số tiền (chỉ số)"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Account ID
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium font-mono bg-amber-100 dark:bg-amber-300/10 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">
                        {session.user?.email
                          ? generateAccountId(session.user.email)
                          : "---"}
                      </span>
                      <button
                        onClick={() => {
                          const accountId = session.user?.email
                            ? generateAccountId(session.user.email)
                            : "";
                          if (accountId) {
                            navigator.clipboard.writeText(accountId);
                            show("Đã copy Account ID!");
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        title="Copy Account ID"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Nội dung chuyển khoản
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {transferContent}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(transferContent);
                          show("Đã copy nội dung chuyển khoản!");
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        title="Copy nội dung chuyển khoản"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - User Info (Always Visible) */}
        <div className="space-y-6">
          {/* User Info */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin tài khoản</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tên người dùng
                </span>
                <span className="text-sm font-medium">
                  {session.user.name || "Chưa cập nhật"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Email
                </span>
                <span className="text-sm font-medium">
                  {session.user.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Account ID
                </span>
                <span className="text-sm font-medium font-mono bg-amber-100 dark:bg-amber-300/10 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">
                  {session.user.email
                    ? generateAccountId(session.user.email)
                    : "---"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Nội dung chuyển khoản
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {transferContent}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(transferContent);
                      show("Đã copy nội dung chuyển khoản!");
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    title="Copy nội dung chuyển khoản"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-300/30 bg-amber-50 dark:bg-amber-300/10 p-6">
            <h3 className="text-lg font-semibold mb-4 text-amber-800 dark:text-amber-200">
              Hướng dẫn chuyển khoản
            </h3>
            <ol className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-300 dark:bg-amber-400 text-amber-900 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                Mở ứng dụng ngân hàng trên điện thoại
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-300 dark:bg-amber-400 text-amber-900 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                Quét mã QR hoặc nhập thông tin chuyển khoản
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-300 dark:bg-amber-400 text-amber-900 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                Kiểm tra thông tin và thực hiện chuyển khoản
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-300 dark:bg-amber-400 text-amber-900 text-xs font-bold flex items-center justify-center">
                  4
                </span>
                Tiền sẽ được cộng vào tài khoản trong 5-10 phút
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Top-up Request History Section */}
      <div className="mt-12">
        <TopupRequestHistory refreshTrigger={topupRefreshTrigger} />
      </div>
    </div>
  );
}
