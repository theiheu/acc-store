"use client";

import { useEffect } from "react";
import { useGlobalLoading } from "./GlobalLoadingProvider";

interface CheckoutPageWrapperProps {
  children: React.ReactNode;
}

export default function CheckoutPageWrapper({ children }: CheckoutPageWrapperProps) {
  const { hideLoading } = useGlobalLoading();

  useEffect(() => {
    // Hide any global loading from navigation
    hideLoading();
  }, [hideLoading]);

  return <>{children}</>;
}
