"use client";

export default function Error() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-300/10 flex items-center justify-center">
          <span className="text-2xl" aria-hidden="true">⚠️</span>
          <span className="sr-only">Lỗi</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Lỗi tải trang quản trị</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Vui lòng thử lại sau.</p>
      </div>
    </div>
  );
}

