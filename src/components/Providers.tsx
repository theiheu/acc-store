"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { GlobalLoadingProvider } from "@/src/components/GlobalLoadingProvider";
import ToastProvider from "@/src/components/ToastProvider";
import GlobalLoadingOverlay from "@/src/components/GlobalLoadingOverlay";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <GlobalLoadingProvider>
        <ToastProvider>
          {children}
          {/* Global overlay rendered once at root */}
          <GlobalLoadingOverlay />
        </ToastProvider>
      </GlobalLoadingProvider>
    </SessionProvider>
  );
}
