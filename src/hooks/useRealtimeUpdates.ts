"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToastContext } from "@/src/components/providers/ToastProvider";

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
  onCategoryUpdated?: (data: any) => void;
  onCategoryDeleted?: (data: any) => void;
  onCategoriesReordered?: (data: any) => void;
  onTransactionCreated?: (data: any) => void;
  onTopupRequestCreated?: (data: any) => void;
  onTopupRequestUpdated?: (data: any) => void;
  onTopupRequestProcessed?: (data: any) => void;
  onOrderCreated?: (data: any) => void;
  onOrderUpdated?: (data: any) => void;
  showNotifications?: boolean;
}

// Global SSE connection manager to prevent multiple connections
class SSEConnectionManager {
  private static instance: SSEConnectionManager | null = null;
  private eventSource: EventSource | null = null;
  private subscribers = new Set<(event: RealtimeEvent) => void>();
  private isConnected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastHeartbeat = Date.now();
  private backoffDelay = 1000;

  static getInstance(): SSEConnectionManager {
    if (!SSEConnectionManager.instance) {
      SSEConnectionManager.instance = new SSEConnectionManager();
    }
    return SSEConnectionManager.instance;
  }

  subscribe(callback: (event: RealtimeEvent) => void): () => void {
    this.subscribers.add(callback);

    // Start connection if this is the first subscriber
    if (this.subscribers.size === 1 && !this.eventSource) {
      this.connect();
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
      // Close connection if no more subscribers
      if (this.subscribers.size === 0) {
        this.disconnect();
      }
    };
  }

  private connect() {
    if (typeof window === "undefined") return;

    this.cleanup();

    try {
      this.eventSource = new EventSource("/api/events");

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.backoffDelay = 1000; // Reset backoff
        this.lastHeartbeat = Date.now();
        this.startHeartbeatMonitor();
        console.log("SSE: Connection established");
        this.broadcast({
          type: "connection",
          data: { connected: true },
          timestamp: new Date().toISOString(),
        });
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        console.warn("SSE: Connection error, will retry");
        this.broadcast({
          type: "connection",
          data: { connected: false },
          timestamp: new Date().toISOString(),
        });
        this.scheduleReconnect();
      };

      // Add all event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error("SSE: Failed to create EventSource", error);
      this.scheduleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.eventSource) return;

    const events = [
      "connected",
      "user-updated",
      "balance-updated",
      "product-updated",
      "product-deleted",
      "category-updated",
      "category-deleted",
      "categories-reordered",
      "transaction-created",
      "order-created",
      "order-updated",
      "topup-request-created",
      "topup-request-updated",
      "topup-request-processed",
      "heartbeat",
    ];

    events.forEach((eventType) => {
      this.eventSource!.addEventListener(eventType, (event) => {
        try {
          const data =
            eventType === "heartbeat"
              ? {}
              : JSON.parse((event as MessageEvent).data);

          if (eventType === "heartbeat") {
            this.lastHeartbeat = Date.now();
          } else {
            this.broadcast({
              type: eventType,
              data,
              timestamp: data.timestamp || new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error(`SSE: Error parsing ${eventType} event:`, error);
        }
      });
    });
  }

  private broadcast(event: RealtimeEvent) {
    this.subscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error("SSE: Error in subscriber callback:", error);
      }
    });
  }

  private cleanup() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.subscribers.size === 0) return; // Don't reconnect if no subscribers

    this.cleanup();
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.backoffDelay);

    this.backoffDelay = Math.min(this.backoffDelay * 2, 30000); // Max 30s
  }

  private startHeartbeatMonitor() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(() => {
      const timeSinceHeartbeat = Date.now() - this.lastHeartbeat;
      if (timeSinceHeartbeat > 15000) {
        // 15s timeout
        console.warn("SSE: Heartbeat timeout, reconnecting");
        this.isConnected = false;
        this.broadcast({
          type: "connection",
          data: { connected: false },
          timestamp: new Date().toISOString(),
        });
        this.scheduleReconnect();
      }
    }, 5000);
  }

  disconnect() {
    this.cleanup();
    this.isConnected = false;
    this.subscribers.clear();
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const { show } = useToastContext();

  // Stable callback references to prevent unnecessary re-subscriptions
  const handleUserUpdated = useCallback(
    (data: any) => {
      options.onUserUpdated?.(data);
      if (options.showNotifications) {
        show("Thông tin người dùng đã được cập nhật");
      }
    },
    [options.onUserUpdated, options.showNotifications, show]
  );

  const handleBalanceUpdated = useCallback(
    (data: any) => {
      options.onBalanceUpdated?.(data);
      if (options.showNotifications) {
        show("Số dư tài khoản đã được cập nhật");
      }
    },
    [options.onBalanceUpdated, options.showNotifications, show]
  );

  const handleProductUpdated = useCallback(
    (data: any) => {
      options.onProductUpdated?.(data);
      if (options.showNotifications) {
        show(
          `Sản phẩm đã được ${
            data.type === "PRODUCT_CREATED" ? "thêm" : "cập nhật"
          }`
        );
      }
    },
    [options.onProductUpdated, options.showNotifications, show]
  );

  const handleProductDeleted = useCallback(
    (data: any) => {
      options.onProductDeleted?.(data);
      if (options.showNotifications) {
        show("Sản phẩm đã được xóa");
      }
    },
    [options.onProductDeleted, options.showNotifications, show]
  );

  const handleCategoryUpdated = useCallback(
    (data: any) => {
      options.onCategoryUpdated?.(data);
      if (options.showNotifications) {
        show("Danh mục đã được cập nhật");
      }
    },
    [options.onCategoryUpdated, options.showNotifications, show]
  );

  const handleCategoryDeleted = useCallback(
    (data: any) => {
      options.onCategoryDeleted?.(data);
      if (options.showNotifications) {
        show("Danh mục đã được xóa");
      }
    },
    [options.onCategoryDeleted, options.showNotifications, show]
  );

  const handleCategoriesReordered = useCallback(
    (data: any) => {
      options.onCategoriesReordered?.(data);
      if (options.showNotifications) {
        show("Thứ tự danh mục đã được cập nhật");
      }
    },
    [options.onCategoriesReordered, options.showNotifications, show]
  );

  const handleTransactionCreated = useCallback(
    (data: any) => {
      options.onTransactionCreated?.(data);
      if (options.showNotifications) {
        show("Giao dịch mới đã được tạo");
      }
    },
    [options.onTransactionCreated, options.showNotifications, show]
  );

  const handleOrderCreated = useCallback(
    (data: any) => {
      options.onOrderCreated?.(data);
      if (options.showNotifications) {
        show("Đơn hàng mới đã được tạo");
      }
    },
    [options.onOrderCreated, options.showNotifications, show]
  );

  const handleOrderUpdated = useCallback(
    (data: any) => {
      options.onOrderUpdated?.(data);
      if (options.showNotifications) {
        show("Đơn hàng đã được cập nhật");
      }
    },
    [options.onOrderUpdated, options.showNotifications, show]
  );

  const handleTopupRequestCreated = useCallback(
    (data: any) => {
      options.onTopupRequestCreated?.(data);
      if (options.showNotifications) {
        show("Yêu cầu nạp tiền mới");
      }
    },
    [options.onTopupRequestCreated, options.showNotifications, show]
  );

  const handleTopupRequestUpdated = useCallback(
    (data: any) => {
      options.onTopupRequestUpdated?.(data);
      if (options.showNotifications) {
        show("Yêu cầu nạp tiền đã được cập nhật");
      }
    },
    [options.onTopupRequestUpdated, options.showNotifications, show]
  );

  const handleTopupRequestProcessed = useCallback(
    (data: any) => {
      options.onTopupRequestProcessed?.(data);
      if (options.showNotifications) {
        const status =
          data.request.status === "approved"
            ? "đã được duyệt"
            : "đã bị từ chối";
        show(`Yêu cầu nạp tiền ${status}`);
      }
    },
    [options.onTopupRequestProcessed, options.showNotifications, show]
  );

  // Main event handler
  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      setLastEvent(event);

      switch (event.type) {
        case "connection":
          setIsConnected(event.data.connected);
          break;
        case "user-updated":
          handleUserUpdated(event.data);
          break;
        case "balance-updated":
          handleBalanceUpdated(event.data);
          break;
        case "product-updated":
          handleProductUpdated(event.data);
          break;
        case "product-deleted":
          handleProductDeleted(event.data);
          break;
        case "category-updated":
          handleCategoryUpdated(event.data);
          break;
        case "category-deleted":
          handleCategoryDeleted(event.data);
          break;
        case "categories-reordered":
          handleCategoriesReordered(event.data);
          break;
        case "transaction-created":
          handleTransactionCreated(event.data);
          break;
        case "order-created":
          handleOrderCreated(event.data);
          break;
        case "order-updated":
          handleOrderUpdated(event.data);
          break;
        case "topup-request-created":
          handleTopupRequestCreated(event.data);
          break;
        case "topup-request-updated":
          handleTopupRequestUpdated(event.data);
          break;
        case "topup-request-processed":
          handleTopupRequestProcessed(event.data);
          break;
      }
    },
    [
      handleUserUpdated,
      handleBalanceUpdated,
      handleProductUpdated,
      handleProductDeleted,
      handleTransactionCreated,
      handleOrderCreated,
      handleOrderUpdated,
      handleTopupRequestCreated,
      handleTopupRequestUpdated,
      handleTopupRequestProcessed,
    ]
  );

  useEffect(() => {
    const manager = SSEConnectionManager.getInstance();
    const unsubscribe = manager.subscribe(handleEvent);

    // Update connection status
    setIsConnected(manager.getConnectionStatus());

    return unsubscribe;
  }, [handleEvent]);

  const reconnect = useCallback(() => {
    const manager = SSEConnectionManager.getInstance();
    // Force disconnect and reconnect
    manager.disconnect();
    // Connection will be re-established automatically when there are subscribers
  }, []);

  return {
    isConnected,
    lastEvent,
    reconnect,
  };
}

// Hook specifically for account page real-time updates
export function useAccountRealtimeUpdates(currentUserId?: string) {
  const { show } = useToastContext();

  const onBalanceUpdated = useCallback(
    (data: any) => {
      if (currentUserId && data.userId === currentUserId) {
        show(
          `Số dư của bạn đã được cập nhật: ${data.newBalance.toLocaleString(
            "vi-VN"
          )} ₫`
        );
      }
    },
    [currentUserId, show]
  );

  const onTransactionCreated = useCallback(
    (data: any) => {
      if (currentUserId && data.transaction.userId === currentUserId) {
        const type =
          data.transaction.type === "credit" ? "Nạp tiền" : "Giao dịch";
        show(`${type}: ${data.transaction.description}`);
      }
    },
    [currentUserId, show]
  );

  return useRealtimeUpdates({
    onBalanceUpdated,
    onTransactionCreated,
    showNotifications: false,
  });
}

export function useAdminRealtimeUpdates() {
  return useRealtimeUpdates({ showNotifications: true });
}

export function useProductRealtimeUpdates() {
  const onProductUpdated = useCallback((data: any) => {
    console.log("Product updated:", data);
  }, []);

  const onProductDeleted = useCallback((data: any) => {
    console.log("Product deleted:", data);
  }, []);

  return useRealtimeUpdates({
    onProductUpdated,
    onProductDeleted,
    showNotifications: false,
  });
}
