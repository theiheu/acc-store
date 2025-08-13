"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LoadingSpinner from "@/src/components/LoadingSpinner";

/**
 * Deposit History Page - Redirects to main deposit page
 * The history functionality has been moved to the main deposit page
 */

export default function DepositHistoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    // Redirect to main deposit page where history is now integrated
    router.replace("/deposit");
  }, [router, status]);

  // Show loading state while redirecting
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Đang chuyển hướng đến trang nạp tiền...
          </p>
        </div>
      </div>
    </div>
  );
}
