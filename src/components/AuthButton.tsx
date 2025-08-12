"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToastContext } from "@/src/components/ToastProvider";
import { useGlobalLoading } from "@/src/components/GlobalLoadingProvider";
import LoadingSpinner from "@/src/components/LoadingSpinner";

export default function AuthButton() {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { show } = useToastContext();
  const { withLoading } = useGlobalLoading();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function handleSignOut() {
    setIsSigningOut(true);
    setOpen(false);

    try {
      await withLoading(async () => {
        await signOut({ redirect: false });
        router.push("/");
      }, "Đang đăng xuất...");

      show("Đã đăng xuất thành công");
    } catch (error) {
      show("Có lỗi xảy ra khi đăng xuất");
      console.error("Sign out error:", error);
    } finally {
      setIsSigningOut(false);
    }
  }

  async function handleSignIn() {
    try {
      await withLoading(async () => {
        router.push("/login");
      }, "Đang chuyển hướng...");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }

  // Show loading state
  if (status === "loading") {
    return (
      <div className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700">
        <LoadingSpinner size="sm" />
        <span className="text-gray-500">Đang tải...</span>
      </div>
    );
  }

  // Authenticated user
  if (session?.user) {
    const user = session.user;
    const displayName = user.name || user.email || "Tài khoản";
    const avatar = user.image;

    return (
      <div className="relative" ref={menuRef}>
        <button
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          disabled={isSigningOut}
          className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Avatar */}
          {avatar ? (
            <Image
              src={avatar}
              alt={displayName}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-300/10 flex items-center justify-center">
              <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <span className="truncate max-w-[8rem]">{displayName}</span>

          {isSigningOut ? (
            <LoadingSpinner size="sm" />
          ) : (
            <span
              className={`transition-transform ${
                open ? "rotate-180" : "rotate-0"
              }`}
              aria-hidden
            >
              ▾
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {open && !isSigningOut && (
          <div
            role="menu"
            aria-label="Tài khoản"
            className="absolute right-0 mt-2 min-w-56 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg p-1 z-50"
          >
            {/* User Info */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user.name || "Người dùng"}
              </p>
              {user.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              )}
            </div>

            {/* Menu Items */}
            <Link
              href="/account"
              role="menuitem"
              tabIndex={0}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-amber-50 dark:hover:bg-amber-300/10 transition-colors"
            >
              <span className="text-base">👤</span>
              Thông tin tài khoản
            </Link>

            <Link
              href="/orders"
              role="menuitem"
              tabIndex={0}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-amber-50 dark:hover:bg-amber-300/10 transition-colors"
            >
              <span className="text-base">📦</span>
              Đơn hàng của tôi
            </Link>

            <div className="border-t border-gray-200 dark:border-gray-800 my-1" />

            <button
              role="menuitem"
              tabIndex={0}
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-red-50 dark:hover:bg-red-300/10 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-base">🚪</span>
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    );
  }

  // Not authenticated
  return (
    <button
      onClick={handleSignIn}
      className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-amber-300 text-gray-900 hover:bg-amber-400 transition-colors font-medium cursor-pointer"
    >
      Đăng nhập
    </button>
  );
}
