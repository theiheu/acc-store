"use client";

import { useState, ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "./AdminAuthProvider";
import { useGlobalLoading } from "./GlobalLoadingProvider";
import { useToastContext } from "./ToastProvider";
import AdminSidebar from "./AdminSidebar";
import LoadingSpinner from "./LoadingSpinner";
import { useAdminRealtimeUpdates } from "@/src/hooks/useRealtimeUpdates";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function AdminLayout({
  children,
  title = "Admin Dashboard",
  description,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const { isAdmin, adminProfile, loading } = useAdminAuth();
  const { withLoading } = useGlobalLoading();
  const { show } = useToastContext();
  const router = useRouter();
  const { isConnected } = useAdminRealtimeUpdates();

  async function handleSignOut() {
    try {
      await withLoading(async () => {
        await signOut({ redirect: false });
        router.push("/");
      }, "Đang đăng xuất...");

      show("Đã đăng xuất thành công");
    } catch (error) {
      show("Có lỗi xảy ra khi đăng xuất");
      console.error("Sign out error:", error);
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Đang kiểm tra quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-300/10 flex items-center justify-center">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Truy cập bị từ chối
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Bạn không có quyền truy cập vào khu vực quản trị này.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-amber-300 text-gray-900 hover:bg-amber-400 rounded-lg transition-colors"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-4 lg:px-6">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="text-xl">☰</span>
            </button>

            {/* Page title */}
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Realtime connection indicator */}
            <div
              className={`hidden sm:flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
                isConnected
                  ? "bg-green-100 dark:bg-green-300/10 text-green-800 dark:text-green-200"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
              title={
                isConnected
                  ? "Kết nối thời gian thực đang hoạt động"
                  : "Mất kết nối thời gian thực"
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              />
              <span>{isConnected ? "Realtime ON" : "Realtime OFF"}</span>
            </div>

            {/* Notifications */}
            <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 relative">
              <span className="text-xl">🔔</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* User menu */}
            <div className="relative group">
              <button className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-300/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {adminProfile?.name?.charAt(0).toUpperCase() || "A"}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                  {adminProfile?.name}
                </span>
                <span className="text-xs text-gray-400">▼</span>
              </button>

              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {adminProfile?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {adminProfile?.email}
                  </p>
                </div>

                <div className="p-1">
                  <a
                    href="/account"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                  >
                    <span>👤</span>
                    Tài khoản cá nhân
                  </a>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-300/10 rounded-md"
                  >
                    <span>🚪</span>
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
