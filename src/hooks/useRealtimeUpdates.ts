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
  onOrderCreated?: (data: any) => void;
  onOrderUpdated?: (data: any) => void;
  showNotifications?: boolean;
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastHeartbeatAtRef = useRef<number>(Date.now());
  const backoffRef = useRef<number>(1000); // start 1s
  const destroyedRef = useRef<boolean>(false);

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
    onOrderCreated,
    onOrderUpdated,
    showNotifications = false,
  } = options;

  useEffect(() => {
    if (typeof window === "undefined") return;
    destroyedRef.current = false;

    function cleanup() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    }

    function scheduleReconnect() {
      if (destroyedRef.current) return;
      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, 30000); // max 30s
      reconnectTimerRef.current = setTimeout(() => {
        if (!destroyedRef.current) init();
      }, delay);
    }

    function startHeartbeatMonitor() {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = setInterval(() => {
        const since = Date.now() - lastHeartbeatAtRef.current;
        if (since > 15000) {
          // No heartbeat for > 15s -> reconnect
          setIsConnected(false);
          cleanup();
          scheduleReconnect();
        }
      }, 5000);
    }

    function init() {
      cleanup();
      try {
        const es = new EventSource("/api/events");
        eventSourceRef.current = es;

        es.onopen = () => {
          setIsConnected(true);
          backoffRef.current = 1000; // reset backoff
          lastHeartbeatAtRef.current = Date.now();
          startHeartbeatMonitor();
          console.log("Real-time connection established");
        };

        es.onerror = (error) => {
          setIsConnected(false);
          console.error("Real-time connection error:", error);
          cleanup();
          scheduleReconnect();
        };

        // Batching events to reduce state updates
        let queue: Array<{ type: string; data: any }> = [];
        let flushTimer: ReturnType<typeof setTimeout> | null = null;
        function enqueue(type: string, data: any) {
          queue.push({ type, data });
          if (!flushTimer) {
            flushTimer = setTimeout(() => {
              const batch = queue;
              queue = [];
              flushTimer = null;
              batch.forEach(({ type, data }) => handleEvent(type, data));
            }, 16); // ~ one frame
          }
        }

        function handleEvent(type: string, data: any) {
          setLastEvent({
            type,
            data,
            timestamp: data.timestamp || new Date().toISOString(),
          });
          switch (type) {
            case "user-updated":
              onUserUpdated?.(data);
              if (showNotifications)
                show("Thông tin người dùng đã được cập nhật");
              break;
            case "balance-updated":
              onBalanceUpdated?.(data);
              if (showNotifications) show("Số dư tài khoản đã được cập nhật");
              break;
            case "product-updated":
              onProductUpdated?.(data);
              if (showNotifications)
                show(
                  `Sản phẩm đã được ${
                    data.type === "PRODUCT_CREATED" ? "thêm" : "cập nhật"
                  }`
                );
              break;
            case "product-deleted":
              onProductDeleted?.(data);
              if (showNotifications) show("Sản phẩm đã được xóa");
              break;
            case "transaction-created":
              onTransactionCreated?.(data);
              if (showNotifications) show("Giao dịch mới đã được tạo");
              break;
            case "order-created":
              onOrderCreated?.(data);
              if (showNotifications) show("Đơn hàng mới được tạo");
              break;
            case "order-updated":
              onOrderUpdated?.(data);
              if (showNotifications) show("Đơn hàng đã được cập nhật");
              break;
            case "topup-request-created":
              onTopupRequestCreated?.(data);
              if (showNotifications) show("Yêu cầu nạp tiền mới đã được tạo");
              break;
            case "topup-request-updated":
              onTopupRequestUpdated?.(data);
              break;
            case "topup-request-processed":
              onTopupRequestProcessed?.(data);
              if (showNotifications) {
                const status =
                  data.request.status === "approved"
                    ? "đã được duyệt"
                    : "đã bị từ chối";
                show(`Yêu cầu nạp tiền ${status}`);
              }
              break;
            case "heartbeat":
              lastHeartbeatAtRef.current = Date.now();
              break;
          }
        }

        es.addEventListener("connected", (event) => {
          const data = JSON.parse((event as MessageEvent).data);
          enqueue("connected", data);
        });
        es.addEventListener("user-updated", (event) => {
          const data = JSON.parse((event as MessageEvent).data);
          enqueue("user-updated", data);
        });
        es.addEventListener("balance-updated", (event) => {
          const data = JSON.parse((event as MessageEvent).data);
          enqueue("balance-updated", data);
        });
        es.addEventListener("product-updated", (event) => {
          const data = JSON.parse((event as MessageEvent).data);
          enqueue("product-updated", data);
        });
        es.addEventListener("product-deleted", (event) => {
          const data = JSON.parse((event as MessageEvent).data);
          enqueue("product-deleted", data);
        });
        es.addEventListener("transaction-created", (event) => {
          const data = JSON.parse((event as MessageEvent).data);
          enqueue("transaction-created", data);
        });
        es.addEventListener("order-created", (event) => {
          const data = JSON.parse((event as MessageEvent).data);
          enqueue("order-created", data);
        });
        es.addEventListener("order-updated", (event) => {
          const data = JSON.parse((event as MessageEvent).data);
          enqueue("order-updated", data);
        });
        es.addEventListener("topup-request-created", (event) => {
          const data = JSON.parse((event as MessageEvent).data);
          enqueue("topup-request-created", data);
        });
        es.addEventListener("topup-request-updated", (event) => {
          const data = JSON.parse((event as MessageEvent).data);
          enqueue("topup-request-updated", data);
        });
        es.addEventListener("topup-request-processed", (event) => {
          const data = JSON.parse((event as MessageEvent).data);
          enqueue("topup-request-processed", data);
        });
        es.addEventListener("heartbeat", () => {
          enqueue("heartbeat", {});
        });
      } catch (e) {
        console.error("Failed to init EventSource", e);
        scheduleReconnect();
      }
    }

    init();

    return () => {
      destroyedRef.current = true;
      cleanup();
      setIsConnected(false);
    };
  }, [
    show,
    onUserUpdated,
    onBalanceUpdated,
    onProductUpdated,
    onProductDeleted,
    onTransactionCreated,
    onTopupRequestCreated,
    onTopupRequestUpdated,
    onTopupRequestProcessed,
    onOrderCreated,
    onOrderUpdated,
    showNotifications,
  ]);

  const reconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
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
      if (currentUserId && data.userId === currentUserId) {
        show(
          `Số dư của bạn đã được cập nhật: ${data.newBalance.toLocaleString(
            "vi-VN"
          )} ₫`
        );
      }
    },
    onTransactionCreated: (data) => {
      if (currentUserId && data.transaction.userId === currentUserId) {
        const type =
          data.transaction.type === "credit" ? "Nạp tiền" : "Giao dịch";
        show(`${type}: ${data.transaction.description}`);
      }
    },
    showNotifications: false,
  });
}

export function useAdminRealtimeUpdates() {
  return useRealtimeUpdates({ showNotifications: true });
}

export function useProductRealtimeUpdates() {
  return useRealtimeUpdates({
    onProductUpdated: (data) => {
      console.log("Product updated:", data);
    },
    onProductDeleted: (data) => {
      console.log("Product deleted:", data);
    },
    showNotifications: false,
  });
}
