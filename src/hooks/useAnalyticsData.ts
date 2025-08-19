"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, differenceInDays } from 'date-fns';
import { analyticsCacheService, CACHE_KEYS } from '@/src/services/cacheService';
import { DateRange } from '@/src/components/admin/statistics/DateRangePicker';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    conversionRate: number;
  };
  revenueData: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  userGrowthData: Array<{
    date: string;
    newUsers: number;
    totalUsers: number;
  }>;
  topProducts: Array<{
    productId: string;
    productTitle: string;
    salesCount: number;
    revenue: number;
  }>;
}

interface UseAnalyticsDataOptions {
  enableCache?: boolean;
  staleWhileRevalidate?: boolean;
  preloadNextRange?: boolean;
  debounceMs?: number;
}

export function useAnalyticsData(
  dateRange: DateRange,
  options: UseAnalyticsDataOptions = {}
) {
  const {
    enableCache = true,
    staleWhileRevalidate = true,
    preloadNextRange = true,
    debounceMs = 300,
  } = options;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch function with caching
  const fetchAnalyticsData = useCallback(async (
    range: DateRange,
    signal?: AbortSignal
  ): Promise<AnalyticsData> => {
    const days = differenceInDays(range.endDate, range.startDate) + 1;
    const cacheParams = {
      startDate: format(range.startDate, 'yyyy-MM-dd'),
      endDate: format(range.endDate, 'yyyy-MM-dd'),
      days,
    };

    const fetcher = async (): Promise<AnalyticsData> => {
      // Fetch overview stats
      const overviewResponse = await fetch("/api/admin/dashboard", { signal });
      if (!overviewResponse.ok) throw new Error("Failed to fetch overview data");
      const overviewResult = await overviewResponse.json();

      // Fetch chart data in parallel
      const [revenueResponse, userGrowthResponse] = await Promise.all([
        fetch("/api/admin/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "revenue",
            days,
            startDate: format(range.startDate, 'yyyy-MM-dd'),
            endDate: format(range.endDate, 'yyyy-MM-dd'),
          }),
          signal,
        }),
        fetch("/api/admin/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "userGrowth",
            days,
            startDate: format(range.startDate, 'yyyy-MM-dd'),
            endDate: format(range.endDate, 'yyyy-MM-dd'),
          }),
          signal,
        }),
      ]);

      if (!revenueResponse.ok || !userGrowthResponse.ok) {
        throw new Error("Failed to fetch chart data");
      }

      const [revenueResult, userGrowthResult] = await Promise.all([
        revenueResponse.json(),
        userGrowthResponse.json(),
      ]);

      return {
        overview: {
          totalRevenue: overviewResult.data.totalRevenue,
          totalOrders: overviewResult.data.totalOrders,
          totalUsers: overviewResult.data.totalUsers,
          conversionRate: overviewResult.data.totalOrders > 0 
            ? (overviewResult.data.totalOrders / overviewResult.data.totalUsers) * 100 
            : 0,
        },
        revenueData: revenueResult.data,
        userGrowthData: userGrowthResult.data,
        topProducts: overviewResult.data.topSellingProducts,
      };
    };

    if (enableCache) {
      return analyticsCacheService.getOrFetch(
        CACHE_KEYS.ANALYTICS_OVERVIEW,
        cacheParams,
        fetcher,
        { staleWhileRevalidate }
      );
    } else {
      return fetcher();
    }
  }, [enableCache, staleWhileRevalidate]);

  // Preload adjacent date ranges
  const preloadAdjacentRanges = useCallback(async (currentRange: DateRange) => {
    if (!preloadNextRange) return;

    const rangeDuration = differenceInDays(currentRange.endDate, currentRange.startDate);
    
    // Preload previous range
    const prevStartDate = new Date(currentRange.startDate);
    prevStartDate.setDate(prevStartDate.getDate() - rangeDuration - 1);
    const prevEndDate = new Date(currentRange.startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);

    // Preload next range
    const nextStartDate = new Date(currentRange.endDate);
    nextStartDate.setDate(nextStartDate.getDate() + 1);
    const nextEndDate = new Date(currentRange.endDate);
    nextEndDate.setDate(nextEndDate.getDate() + rangeDuration + 1);

    // Preload in background
    Promise.allSettled([
      fetchAnalyticsData({ startDate: prevStartDate, endDate: prevEndDate, label: 'Previous' }),
      fetchAnalyticsData({ startDate: nextStartDate, endDate: nextEndDate, label: 'Next' }),
    ]).catch(() => {
      // Ignore preload errors
    });
  }, [fetchAnalyticsData, preloadNextRange]);

  // Debounced fetch function
  const debouncedFetch = useCallback((range: DateRange) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        setLoading(true);
        setError(null);
        
        const startTime = Date.now();
        const result = await fetchAnalyticsData(range, abortController.signal);
        
        if (!abortController.signal.aborted) {
          setData(result);
          setLastFetchTime(Date.now() - startTime);
          
          // Preload adjacent ranges in background
          preloadAdjacentRanges(range);
        }
      } catch (err: any) {
        if (!abortController.signal.aborted) {
          console.error("Analytics data fetch error:", err);
          setError("Không thể tải dữ liệu thống kê");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }, debounceMs);
  }, [fetchAnalyticsData, preloadAdjacentRanges, debounceMs]);

  // Effect to fetch data when date range changes
  useEffect(() => {
    debouncedFetch(dateRange);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [dateRange, debouncedFetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(async () => {
    // Invalidate cache for current range
    if (enableCache) {
      const cacheParams = {
        startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
        endDate: format(dateRange.endDate, 'yyyy-MM-dd'),
        days: differenceInDays(dateRange.endDate, dateRange.startDate) + 1,
      };
      analyticsCacheService.invalidate(CACHE_KEYS.ANALYTICS_OVERVIEW, cacheParams);
    }

    // Fetch fresh data
    debouncedFetch(dateRange);
  }, [dateRange, enableCache, debouncedFetch]);

  // Cache statistics
  const getCacheStats = useCallback(() => {
    return analyticsCacheService.getStats();
  }, []);

  return {
    data,
    loading,
    error,
    lastFetchTime,
    refresh,
    getCacheStats,
  };
}
