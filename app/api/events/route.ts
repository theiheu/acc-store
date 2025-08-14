import { NextRequest } from "next/server";
import { dataStore, DataStoreEvent } from "@/src/core/data-store";

import { ensureAutoSyncStarted } from "@/src/services/autoSync";

// Server-Sent Events endpoint for real-time updates
// Ensure background auto sync is running on first SSE connection
try {
  ensureAutoSyncStarted();
} catch {}

export async function GET(request: NextRequest) {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Track closed state to avoid double-closing the stream
      let closed = false;

      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch (e) {
          // Ignore errors when controller is already closed
        }
      };

      // Send initial connection message
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: any) => {
        if (closed) return;
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (e) {
          // If enqueue fails (e.g., stream closed), close safely
          safeClose();
        }
      };

      // Send initial connection confirmation
      sendEvent("connected", { message: "Connected to real-time updates" });

      // Subscribe to data store events
      const unsubscribe = dataStore.subscribe((event: DataStoreEvent) => {
        try {
          if (closed) return;
          console.log("SSE: Broadcasting event:", event.type, event.payload);
          switch (event.type) {
            case "USER_UPDATED":
            case "USER_CREATED":
              sendEvent("user-updated", {
                type: event.type,
                user: event.payload,
                timestamp: new Date().toISOString(),
              });
              break;

            case "USER_BALANCE_CHANGED":
              console.log("SSE: Broadcasting balance change:", event.payload);
              // Enrich with userEmail for robust client matching
              const u = dataStore.getUser(event.payload.userId);
              sendEvent("balance-updated", {
                userId: event.payload.userId,
                userEmail: u?.email,
                newBalance: event.payload.newBalance,
                timestamp: new Date().toISOString(),
              });
              break;

            case "PRODUCT_UPDATED":
            case "PRODUCT_CREATED":
              sendEvent("product-updated", {
                type: event.type,
                product: event.payload,
                timestamp: new Date().toISOString(),
              });
              break;

            case "PRODUCT_DELETED":
              sendEvent("product-deleted", {
                productId: event.payload.productId,
                timestamp: new Date().toISOString(),
              });
              break;

            case "TRANSACTION_CREATED":
              console.log(
                "SSE: Broadcasting transaction creation:",
                event.payload
              );
              sendEvent("transaction-created", {
                transaction: event.payload,
                timestamp: new Date().toISOString(),
              });
              break;

            case "TOPUP_REQUEST_CREATED":
              console.log(
                "SSE: Broadcasting topup request creation:",
                event.payload
              );
              sendEvent("topup-request-created", {
                request: event.payload,
                timestamp: new Date().toISOString(),
              });
              break;

            case "TOPUP_REQUEST_UPDATED":
              console.log(
                "SSE: Broadcasting topup request update:",
                event.payload
              );
              sendEvent("topup-request-updated", {
                request: event.payload,
                timestamp: new Date().toISOString(),
              });
              break;

            case "TOPUP_REQUEST_PROCESSED":
              console.log(
                "SSE: Broadcasting topup request processed:",
                event.payload
              );
              sendEvent("topup-request-processed", {
                request: event.payload,
                timestamp: new Date().toISOString(),
              });
              break;
          }
        } catch (error) {
          console.error("Error sending SSE event:", error);
        }
      });

      // Send periodic heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          sendEvent("heartbeat", { timestamp: new Date().toISOString() });
        } catch (error) {
          // If heartbeat fails, clean up and close safely
          clearInterval(heartbeat);
          unsubscribe();
          safeClose();
        }
      }, 30000); // Every 30 seconds

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        try {
          clearInterval(heartbeat);
        } catch {}
        unsubscribe();
        safeClose();
      });

      // Clean up on stream close
      return () => {
        clearInterval(heartbeat);
        unsubscribe();
        safeClose();
      };
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}
