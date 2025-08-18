"use client";

import { useEffect, useRef } from "react";

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
}

export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(Date.now());
  const mountTime = useRef<number | null>(null);

  useEffect(() => {
    // Record mount time
    if (!mountTime.current) {
      mountTime.current = Date.now();
      const mountDuration = mountTime.current - renderStartTime.current;

      // Log performance metrics in development
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Performance] ${componentName} mounted in ${mountDuration}ms`
        );
      }

      // Report to analytics in production (if needed)
      if (process.env.NODE_ENV === "production" && mountDuration > 1000) {
        // Only report slow renders
        console.warn(
          `[Performance] Slow render detected: ${componentName} took ${mountDuration}ms`
        );
      }
    }
  }, [componentName]);

  // Update render start time on each render
  renderStartTime.current = Date.now();

  return {
    markRenderStart: () => {
      renderStartTime.current = Date.now();
    },
    markRenderEnd: (label?: string) => {
      const duration = Date.now() - renderStartTime.current;
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Performance] ${componentName}${
            label ? ` - ${label}` : ""
          } rendered in ${duration}ms`
        );
      }
      return duration;
    },
  };
}

// Hook for measuring API call performance
export function useApiPerformance() {
  const measureApiCall = async <T>(
    apiCall: () => Promise<T>,
    apiName: string
  ): Promise<T> => {
    const startTime = Date.now();

    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;

      if (process.env.NODE_ENV === "development") {
        console.log(`[API Performance] ${apiName} completed in ${duration}ms`);
      }

      // Report slow API calls
      if (duration > 2000) {
        console.warn(
          `[API Performance] Slow API call: ${apiName} took ${duration}ms`
        );
      }

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Don't log AbortErrors as they are expected in development
      if (error?.name === "AbortError" || error?.message?.includes("aborted")) {
        // Silently re-throw abort errors
        throw error;
      }

      console.error(
        `[API Performance] ${apiName} failed after ${duration}ms:`,
        error
      );
      throw error;
    }
  };

  return { measureApiCall };
}
