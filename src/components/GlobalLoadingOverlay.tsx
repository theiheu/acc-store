"use client";

import { useGlobalLoading } from "./GlobalLoadingProvider";
import LoadingSpinner from "./LoadingSpinner";

export default function GlobalLoadingOverlay() {
  const { isLoading, loadingText } = useGlobalLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      
      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 rounded-xl bg-white dark:bg-gray-900 px-8 py-6 shadow-2xl border border-gray-200 dark:border-gray-800">
        <LoadingSpinner size="lg" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {loadingText}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vui lòng đợi trong giây lát...
          </p>
        </div>
      </div>
    </div>
  );
}
