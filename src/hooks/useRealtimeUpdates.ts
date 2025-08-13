"use client";

import { useEffect, useRef, useState } from "react";
import { useToastContext } from "@/src/components/ToastProvider";

interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: string;
}

interface UseRealtimeUpdatesOptions {
  onUserUpdated?: (data: any) => void;
  onBalanceUpdated?: (data: { userId: string; newBalance: number }) => void;
  onProductUpdated?: (data: any) => void;
  onProductDeleted?: (data: { productId: string }) => void;
  onTransactionCreated?: (data: any) => void;
  onTopupRequestCreated?: (data: any) => void;
  onTopupRequestUpdated?: (data: any) => void;
  onTopupRequestProcessed?: (data: any) => void;
  showNotifications?: boolean;
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { show } = useToastContext();

  const {
    onUserUpdated,
    onBalanceUpdated,
    onProductUpdated,
    onProductDeleted,
    onTransactionCreated,
    onTopupRequestCreated,
    onTopupRequestUpdated,
    onTopupRequestProcessed,
    showNotifications = false,
  } = options;

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Create EventSource connection
    const eventSource = new EventSource("/api/events");
    eventSourceRef.current = eventSource;

    // Handle connection open
    eventSource.onopen = () => {
      setIsConnected(true);
      console.log("Real-time connection established");
    };

    // Handle connection error
    eventSource.onerror = (error) => {
      setIsConnected(false);
      console.error("Real-time connection error:", error);

      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          console.log("Attempting to reconnect...");
          // The useEffect will handle reconnection when component re-renders
        }
      }, 5000);
    };

    // Handle specific events
    eventSource.addEventListener("connected", (event) => {
      const data = JSON.parse(event.data);
      console.log("Connected to real-time updates:", data.message);
    });

    eventSource.addEventListener("user-updated", (event) => {
      const data = JSON.parse(event.data);
      setLastEvent({ type: "user-updated", data, timestamp: data.timestamp });

      if (onUserUpdated) {
        onUserUpdated(data);
      }

      if (showNotifications) {
        show(`Thông tin người dùng đã được cập nhật`, "info");
      }
    });

    eventSource.addEventListener("balance-updated", (event) => {
      const data = JSON.parse(event.data);
      setLastEvent({
        type: "balance-updated",
        data,
        timestamp: data.timestamp,
      });

      if (onBalanceUpdated) {
        onBalanceUpdated(data);
      }

      if (showNotifications) {
        show(`Số dư tài khoản đã được cập nhật`, "success");
      }
    });

    eventSource.addEventListener("product-updated", (event) => {
      const data = JSON.parse(event.data);
      setLastEvent({
        type: "product-updated",
        data,
        timestamp: data.timestamp,
      });

      if (onProductUpdated) {
        onProductUpdated(data);
      }

      if (showNotifications) {
        const action = data.type === "PRODUCT_CREATED" ? "thêm" : "cập nhật";
        show(`Sản phẩm đã được ${action}`, "info");
      }
    });

    eventSource.addEventListener("product-deleted", (event) => {
      const data = JSON.parse(event.data);
      setLastEvent({
        type: "product-deleted",
        data,
        timestamp: data.timestamp,
      });

      if (onProductDeleted) {
        onProductDeleted(data);
      }

      if (showNotifications) {
        show(`Sản phẩm đã được xóa`, "info");
      }
    });

    eventSource.addEventListener("transaction-created", (event) => {
      const data = JSON.parse(event.data);
      setLastEvent({
        type: "transaction-created",
        data,
        timestamp: data.timestamp,
      });

      if (onTransactionCreated) {
        onTransactionCreated(data);
      }

      if (showNotifications) {
        show(`Giao dịch mới đã được tạo`, "success");
      }
    });

    eventSource.addEventListener("topup-request-created", (event) => {
      const data = JSON.parse(event.data);
      setLastEvent({
        type: "topup-request-created",
        data,
        timestamp: data.timestamp,
      });

      if (onTopupRequestCreated) {
        onTopupRequestCreated(data);
      }

      if (showNotifications) {
        show(`Yêu cầu nạp tiền mới đã được tạo`, "info");
      }
    });

    eventSource.addEventListener("topup-request-updated", (event) => {
      const data = JSON.parse(event.data);
      setLastEvent({
        type: "topup-request-updated",
        data,
        timestamp: data.timestamp,
      });

      if (onTopupRequestUpdated) {
        onTopupRequestUpdated(data);
      }
    });

    eventSource.addEventListener("topup-request-processed", (event) => {
      const data = JSON.parse(event.data);
      setLastEvent({
        type: "topup-request-processed",
        data,
        timestamp: data.timestamp,
      });

      if (onTopupRequestProcessed) {
        onTopupRequestProcessed(data);
      }

      if (showNotifications) {
        const status =
          data.request.status === "approved"
            ? "đã được duyệt"
            : "đã bị từ chối";
        show(
          `Yêu cầu nạp tiền ${status}`,
          data.request.status === "approved" ? "success" : "error"
        );
      }
    });

    eventSource.addEventListener("heartbeat", (event) => {
      // Just keep the connection alive, no action needed
      console.debug("Heartbeat received");
    });

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, []); // Empty dependency array to run once on mount

  // Manual reconnect function
  const reconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    // The useEffect will handle creating a new connection
    setIsConnected(false);
  };

  return {
    isConnected,
    lastEvent,
    reconnect,
  };
}

// Hook specifically for account page real-time updates
export function useAccountRealtimeUpdates(currentUserId?: string) {
  const { show } = useToastContext();

  return useRealtimeUpdates({
    onBalanceUpdated: (data) => {
      // Only show notification if it's for the current user
      if (currentUserId && data.userId === currentUserId) {
        show(
          `Số dư của bạn đã được cập nhật: ${data.newBalance.toLocaleString(
            "vi-VN"
          )} ₫`,
          "success"
        );
      }
    },
    onTransactionCreated: (data) => {
      // Only show notification if it's for the current user
      if (currentUserId && data.transaction.userId === currentUserId) {
        const type =
          data.transaction.type === "credit" ? "Nạp tiền" : "Giao dịch";
        show(`${type}: ${data.transaction.description}`, "info");
      }
    },
    showNotifications: false, // We handle notifications manually above
  });
}

// Hook for admin dashboard real-time updates
export function useAdminRealtimeUpdates() {
  return useRealtimeUpdates({
    showNotifications: true, // Show all notifications for admins
  });
}

// Hook for product pages real-time updates
export function useProductRealtimeUpdates() {
  return useRealtimeUpdates({
    onProductUpdated: (data) => {
      // Could trigger a refresh of product data
      console.log("Product updated:", data);
    },
    onProductDeleted: (data) => {
      // Could remove product from current view
      console.log("Product deleted:", data);
    },
    showNotifications: false, // Don't show notifications on public pages
  });
}
