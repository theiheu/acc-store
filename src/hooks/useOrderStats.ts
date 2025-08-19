"use client";

import { useState, useEffect } from "react";
import { OrderStats } from "@/src/core/admin";

export function useOrderStats() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/orders/stats");
        const result = await response.json();

        if (!mounted) return;

        if (result.success) {
          setStats(result.data);
        } else {
          setError(result.error || "Không thể tải thống kê đơn hàng");
        }
      } catch (err) {
        if (!mounted) return;
        console.error("Order stats fetch error:", err);
        setError("Có lỗi xảy ra khi tải thống kê");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { stats, loading, error };
}

// Hook for getting just pending orders count (for sidebar badge)
export function usePendingOrdersCount() {
  const { stats } = useOrderStats();
  return stats?.pendingOrders || 0;
}
