"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth, AdminPermissionGate } from "./AdminAuthProvider";
import { useDataSync } from "@/src/components/DataSyncProvider";
import { AccStoreLogo } from "@/src/components/branding";

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  permission?: keyof import("@/src/core/admin").AdminPermissions;
  badge?: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Tổng quan",
    icon: "📊",
    href: "/admin",
    permission: "canViewAnalytics",
  },
  {
    id: "users",
    label: "Quản lý người dùng",
    icon: "👥",
    href: "/admin/users",
    permission: "canManageUsers",
  },
  {
    id: "topup-requests",
    label: "Yêu cầu nạp tiền",
    icon: "💳",
    href: "/admin/topup-requests",
    permission: "canManageUsers",
  },
  {
    id: "products",
    label: "Quản lý sản phẩm",
    icon: "📦",
    href: "/admin/products",
    permission: "canManageProducts",
  },
  {
    id: "categories",
    label: "Danh mục",
    icon: "🗂️",
    href: "/admin/categories",
    permission: "canManageCategories",
  },
  {
    id: "orders",
    label: "Quản lý đơn hàng",
    icon: "🛒",
    href: "/admin/orders",
    permission: "canManageOrders",
    badge: "23", // Mock pending orders count
  },
  {
    id: "analytics",
    label: "Thống kê & Báo cáo",
    icon: "📈",
    href: "/admin/analytics",
    permission: "canViewAnalytics",
  },
  {
    id: "audit",
    label: "Nhật ký hoạt động",
    icon: "📋",
    href: "/admin/audit",
    permission: "canAccessAuditLogs",
  },
  {
    id: "settings",
    label: "Cài đặt hệ thống",
    icon: "⚙️",
    href: "/admin/settings",
    permission: "canManageAdmins",
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { getPendingTopupRequests } = useDataSync();
  const pendingTopupCount = getPendingTopupRequests().length;
  const { adminProfile } = useAdminAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="h-16 px-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <AccStoreLogo variant="horizontal" size="md" />
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Admin info */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-300/10 flex items-center justify-center">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {adminProfile?.name?.charAt(0).toUpperCase() || "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {adminProfile?.name || "Admin User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {adminProfile?.email}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => (
            <AdminPermissionGate key={item.id} permission={item.permission!}>
              <Link
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-amber-50 dark:bg-amber-300/10 text-amber-700 dark:text-amber-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {/* Orders badge (static mock) */}
                {item.badge && item.id !== "topup-requests" && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-300/10 text-red-700 dark:text-red-300 rounded-full">
                    {item.badge}
                  </span>
                )}
                {/* Dynamic pending top-up count */}
                {item.id === "topup-requests" && pendingTopupCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-300/10 text-red-700 dark:text-red-300 rounded-full">
                    {pendingTopupCount}
                  </span>
                )}
              </Link>
            </AdminPermissionGate>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-lg">🏠</span>
            <span>Về trang chủ</span>
          </Link>
        </div>
      </div>
    </>
  );
}
