"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface GlobalLoadingContextType {
  isLoading: boolean;
  loadingText: string;
  showLoading: (text?: string) => void;
  hideLoading: () => void;
  withLoading: <T>(
    asyncFn: () => Promise<T>,
    loadingText?: string
  ) => Promise<T>;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | null>(null);

interface GlobalLoadingProviderProps {
  children: ReactNode;
}

export function GlobalLoadingProvider({ children }: GlobalLoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Đang tải...");

  const showLoading = useCallback((text: string = "Đang tải...") => {
    setLoadingText(text);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      text: string = "Đang tải..."
    ): Promise<T> => {
      showLoading(text);
      try {
        const result = await asyncFn();
        return result;
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  const value: GlobalLoadingContextType = {
    isLoading,
    loadingText,
    showLoading,
    hideLoading,
    withLoading,
  };

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider");
  }
  return context;
}
