"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Dashboard Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-300/10 flex items-center justify-center">
              <span className="text-2xl" aria-hidden="true">⚠️</span>
              <span className="sr-only">Lỗi</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Có lỗi xảy ra
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Một phần của dashboard gặp sự cố. Vui lòng thử lại.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
              aria-label="Thử lại"
            >
              🔄 <span>Thử lại</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
