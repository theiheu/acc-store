"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    // Listen for navigation events
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      handleStart();
      originalPushState.apply(window.history, args);
    };

    window.history.replaceState = function (...args) {
      handleStart();
      originalReplaceState.apply(window.history, args);
    };

    // Listen for popstate (back/forward buttons)
    window.addEventListener("popstate", handleStart);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handleStart);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-800">
      <div
        className="h-full bg-amber-400 transition-all duration-1000 ease-out"
        style={{
          width: isLoading ? "70%" : "100%",
          transition: "width 1s ease-out",
        }}
      />
    </div>
  );
}
