"use client";

import { ReactNode } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { GlobalLoadingProvider } from "@/src/components/providers/GlobalLoadingProvider";
import ToastProvider from "@/src/components/providers/ToastProvider";
import GlobalLoadingOverlay from "@/src/components/ui/GlobalLoadingOverlay";
import { DataSyncProvider } from "@/src/components/providers/DataSyncProvider";
import { CartProvider } from "@/src/components/providers/CartProvider";
import ErrorBoundary from "@/src/components/ui/ErrorBoundary";

// Inner component to access session data
function ProvidersInner({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const currentUserEmail = session?.user?.email || undefined;

  return (
    <ErrorBoundary>
      <GlobalLoadingProvider>
        <ToastProvider>
          <CartProvider>
            <DataSyncProvider currentUserEmail={currentUserEmail}>
              {children}
              {/* Global overlay rendered once at root */}
              <GlobalLoadingOverlay />
            </DataSyncProvider>
          </CartProvider>
        </ToastProvider>
      </GlobalLoadingProvider>
    </ErrorBoundary>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ProvidersInner>{children}</ProvidersInner>
      </SessionProvider>
    </ErrorBoundary>
  );
}
