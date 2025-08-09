export default function SuccessPage() {
  return (
    <div className="min-h-[calc(100dvh-80px)] bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6 text-center space-y-3">
        <div className="text-5xl">✅</div>
        <h1 className="text-xl font-semibold">Thanh toán thành công</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Cảm ơn bạn đã mua hàng. Thông tin tài khoản sẽ được gửi qua email của bạn.</p>
      </div>
    </div>
  );
}

