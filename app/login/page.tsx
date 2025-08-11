"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveUser } from "@/src/core/auth";
import { useToastContext } from "@/src/components/ToastProvider";
import { useGlobalLoading } from "@/src/components/GlobalLoadingProvider";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const { show } = useToastContext();
  const { withLoading } = useGlobalLoading();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    await withLoading(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      saveUser({ email, name: name || undefined });
      show("Đăng nhập thành công");
      router.push(next);
    }, "Đang đăng nhập...");
  }

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-lg font-semibold">Đăng nhập</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Nhập email để tiếp tục
          </p>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:ring-2 ring-amber-300"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="name">
              Họ và tên (không bắt buộc)
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:ring-2 ring-amber-300"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <button
            type="submit"
            disabled={!email}
            className="w-full inline-flex items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}
