"use client";

import { ReactNode } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { GlobalLoadingProvider } from "@/src/components/GlobalLoadingProvider";
import ToastProvider from "@/src/components/ToastProvider";
import GlobalLoadingOverlay from "@/src/components/GlobalLoadingOverlay";
import { DataSyncProvider } from "@/src/components/DataSyncProvider";

// Inner component to access session data
function ProvidersInner({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const currentUserEmail = session?.user?.email || undefined;

  return (
    <GlobalLoadingProvider>
      <ToastProvider>
        <DataSyncProvider currentUserEmail={currentUserEmail}>
          {children}
          {/* Global overlay rendered once at root */}
          <GlobalLoadingOverlay />
        </DataSyncProvider>
      </ToastProvider>
    </GlobalLoadingProvider>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ProvidersInner>{children}</ProvidersInner>
    </SessionProvider>
  );
}
