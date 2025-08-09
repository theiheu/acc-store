"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastCtx = {
  show: (message: string, durationMs?: number) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const show = useCallback((msg: string, durationMs = 1800) => {
    setMessage(msg);
    setVisible(true);
    window.clearTimeout((show as any)._t);
    (show as any)._t = window.setTimeout(() => setVisible(false), durationMs);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* Toast UI */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center">
        <div
          className={`transition-all duration-200 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 text-sm shadow ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      </div>
    </Ctx.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
}

