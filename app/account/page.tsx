"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadUser } from "@/src/core/auth";

export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    const u = loadUser();
    if (!u) router.replace("/login?next=/account");
  }, [router]);

  const u = loadUser();
  if (!u) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Tài khoản</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Xin chào, <span className="font-medium">{u.email}</span>
      </p>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-3">Đơn hàng gần đây</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Chưa có dữ liệu.</p>
      </div>
    </div>
  );
}

