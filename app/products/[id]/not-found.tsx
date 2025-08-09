import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100dvh-80px)] bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-8 text-center space-y-4">
        <div className="flex items-center justify-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-300/20 text-2xl">
            🔎
          </span>
        </div>
        <div>
          <h1 className="text-xl font-semibold">Không tìm thấy sản phẩm</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Sản phẩm bạn tìm kiếm có thể đã bị xoá hoặc không tồn tại.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Quay lại Trang chủ
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Quay lại Sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
}
