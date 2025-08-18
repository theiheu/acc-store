"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import AdminLayout from "@/src/components/AdminLayout";
import { withAdminAuth } from "@/src/components/AdminAuthProvider";
import { useToastContext } from "@/src/components/ToastProvider";
import { useDashboardStats } from "@/src/components/DataSyncProvider";
import { DashboardStats } from "@/src/core/admin";
import StatsGrid from "@/src/components/admin/StatsGrid";
import QuickActions from "@/src/components/admin/QuickActions";
import SectionSkeleton from "@/src/components/admin/SectionSkeleton";
import DashboardErrorBoundary from "@/src/components/admin/DashboardErrorBoundary";

const TopSellingProducts = dynamic(
  () => import("@/src/components/admin/TopSellingProducts"),
  {
    ssr: false,
    loading: () => <SectionSkeleton className="h-48" />,
  }
);
const RecentUsers = dynamic(
  () => import("@/src/components/admin/RecentUsers"),
  {
    ssr: false,
    loading: () => <SectionSkeleton className="h-48" />,
  }
);
const RecentActivity = dynamic(
  () => import("@/src/components/admin/RecentActivity"),
  {
    ssr: false,
    loading: () => <SectionSkeleton className="h-48" />,
  }
);

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { show } = useToastContext();
  const realtimeStats = useDashboardStats(); // Get real-time stats

  // Simple TTL cache (15s) + in-flight dedupe
  const cacheRef = useRef<{ at: number; data: DashboardStats } | null>(null);
  const inflightRef = useRef<Promise<DashboardStats | null> | null>(null);

  const getDashboardCached = useCallback(
    async (ac: AbortController): Promise<DashboardStats | null> => {
      const now = Date.now();
      if (cacheRef.current && now - cacheRef.current.at < 15000)
        return cacheRef.current.data;
      if (inflightRef.current) return inflightRef.current;

      inflightRef.current = fetch("/api/admin/dashboard", { signal: ac.signal })
        .then(async (res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          const ct = res.headers.get("content-type");
          if (!ct || !ct.includes("application/json"))
            throw new Error("Invalid content-type");
          const body = await res.json();
          if (body?.success) {
            cacheRef.current = { at: Date.now(), data: body.data };
            return body.data as DashboardStats;
          }
          throw new Error(body?.error || "Unknown error");
        })
        .catch((e: any) => {
          // Check if the request was aborted
          if (ac.signal.aborted) return null;

          const msg = String(e?.message || e);
          const isAbortError =
            e?.name === "AbortError" ||
            msg.includes("AbortError") ||
            msg.includes("aborted") ||
            msg.includes("signal is aborted");

          if (isAbortError) {
            // Silently handle abort errors - they're expected in development
            return null;
          }

          console.error("Dashboard fetch error:", e);
          throw e; // Re-throw to be caught by useEffect
        })
        .finally(() => {
          inflightRef.current = null;
        });

      return inflightRef.current;
    },
    [] // Remove measureApiCall dependency to prevent infinite loops
  );

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    setError(null);
    setStats(null);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardCached(ac);
        if (data) {
          setStats(data);
        } else {
          setError("Không thể tải dữ liệu từ API");
        }
      } catch (e: any) {
        // Don't show errors for aborted requests
        const isAbortError =
          e?.name === "AbortError" ||
          e?.message?.includes("aborted") ||
          e?.message?.includes("signal is aborted");

        if (!isAbortError) {
          console.error("Fetch dashboard stats error:", e);
          setError("Có lỗi xảy ra khi tải dữ liệu");
          show("Có lỗi xảy ra khi tải dữ liệu");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [retryCount]); // Remove show and getDashboardCached to prevent infinite loops

  // Memoize mapped recent users to prevent unnecessary re-renders
  const mappedRecentUsers = useMemo(
    () =>
      (realtimeStats.recentUsers || []).map((u: any) => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        status: (u as any).status || "active",
        createdAt: (u as any).createdAt || Date.now(),
      })),
    [realtimeStats.recentUsers]
  );

  if (loading) {
    return (
      <AdminLayout title="Tổng quan" description="Dashboard quản trị hệ thống">
        <div className="space-y-6">
          <SectionSkeleton className="h-28" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionSkeleton className="h-64" />
            <SectionSkeleton className="h-64" />
            <SectionSkeleton className="h-64 lg:col-span-2" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    // Fallback to realtime snapshot from DataSync when API fails
    return (
      <AdminLayout title="Tổng quan" description="Dashboard quản trị hệ thống">
        <div className="space-y-6" role="main" aria-label="Dashboard quản trị">
          <StatsGrid stats={realtimeStats} realtimeStats={realtimeStats} />
          <QuickActions pendingOrders={realtimeStats.pendingOrders} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopSellingProducts items={realtimeStats.topSellingProducts} />
            <RecentUsers items={mappedRecentUsers} isRealtime={true} />
            <RecentActivity items={realtimeStats.recentActivity} />
          </div>
          {error && (
            <div className="text-center" role="alert" aria-live="polite">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {error}. Đang hiển thị dữ liệu realtime tại chỗ.
              </p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-amber-300 text-gray-900 hover:bg-amber-400 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-lg transition-colors"
                aria-label="Thử lại tải dữ liệu dashboard"
              >
                🔄 <span>Thử lại</span>
              </button>
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Tổng quan" description="Dashboard quản trị hệ thống">
      <div className="space-y-6" role="main" aria-label="Dashboard quản trị">
        {/* Stats Cards */}
        <DashboardErrorBoundary>
          <StatsGrid stats={stats} realtimeStats={realtimeStats} />
        </DashboardErrorBoundary>

        {/* Quick Actions */}
        <DashboardErrorBoundary>
          <QuickActions pendingOrders={stats.pendingOrders} />
        </DashboardErrorBoundary>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardErrorBoundary>
            <TopSellingProducts items={stats.topSellingProducts} />
          </DashboardErrorBoundary>
          <DashboardErrorBoundary>
            <RecentUsers
              items={mappedRecentUsers}
              isRealtime={!!realtimeStats}
            />
          </DashboardErrorBoundary>
          <DashboardErrorBoundary>
            <RecentActivity items={stats.recentActivity} />
          </DashboardErrorBoundary>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(AdminDashboard);
