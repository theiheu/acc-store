"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";

type Toast = {
  id: number;
  content: React.ReactNode;
  durationMs: number;
};

type ToastCtx = {
  show: (content: React.ReactNode, durationMs?: number) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

let toastId = 0;

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentToast, setCurrentToast] = useState<Toast | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleClose = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setCurrentToast(null);
  }, []);

  useEffect(() => {
    if (!currentToast && toasts.length > 0) {
      const nextToast = toasts[0];
      setCurrentToast(nextToast);
      setToasts((prev) => prev.slice(1));

      timeoutRef.current = window.setTimeout(
        () => handleClose(),
        nextToast.durationMs
      );
    }
  }, [currentToast, toasts, handleClose]);

  const show = useCallback((content: React.ReactNode, durationMs = 4000) => {
    setToasts((prev) => [...prev, { id: toastId++, content, durationMs }]);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* Toast UI */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center">
        <div
          className={`transition-all duration-300 rounded-lg bg-white text-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg ${
            currentToast
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
          role="status"
          aria-live="polite"
        >
          {currentToast && (
            <div className="flex items-center pl-4 pr-2 py-2">
              <div className="flex-grow text-sm">{currentToast.content}</div>
              <button
                onClick={handleClose}
                aria-label="Close notification"
                className="ml-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              >
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </Ctx.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
}
