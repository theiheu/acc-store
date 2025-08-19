// Background order processing service

import { dataStore } from "@/src/core/data-store";
import { TapHoaMMOClient, parseCredential } from "@/src/services/taphoammo";
import { ORDER_STATUS } from "@/src/core/constants";
import type { Order } from "@/src/core/admin";

// Background order processing service
// Handles async order fulfillment with retry logic

interface ProcessingJob {
  orderId: string;
  upstreamOrderId: string;
  kioskToken: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date;
  createdAt: Date;
}

class OrderProcessor {
  private jobs = new Map<string, ProcessingJob>();
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  // Configuration
  private readonly POLL_INTERVAL = 2000; // 2s between polls
  private readonly MAX_ATTEMPTS = 15; // Increased from 10
  private readonly INITIAL_RETRY_DELAY = 1000; // 1s
  private readonly MAX_RETRY_DELAY = 30000; // 30s max
  private readonly BATCH_SIZE = 5; // Process max 5 orders concurrently

  constructor() {
    this.startProcessor();
  }

  // Add order to processing queue
  addJob(orderId: string, upstreamOrderId: string, kioskToken: string) {
    const job: ProcessingJob = {
      orderId,
      upstreamOrderId,
      kioskToken,
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS,
      nextRetryAt: new Date(),
      createdAt: new Date(),
    };

    this.jobs.set(orderId, job);
    console.log(`OrderProcessor: Added job for order ${orderId}`);
  }

  // Remove completed/failed job
  removeJob(orderId: string) {
    this.jobs.delete(orderId);
  }

  // Get exponential backoff delay
  private getRetryDelay(attempt: number): number {
    const delay = Math.min(
      this.INITIAL_RETRY_DELAY * Math.pow(2, attempt),
      this.MAX_RETRY_DELAY
    );
    return delay + Math.random() * 1000; // Add jitter
  }

  // Process single order
  private async processOrder(job: ProcessingJob): Promise<boolean> {
    const { orderId, upstreamOrderId, kioskToken } = job;

    try {
      const supplier = new TapHoaMMOClient({ kioskToken });
      const info = await supplier.getProducts(upstreamOrderId);

      if (info.success === "true" && info.data && info.data.length > 0) {
        // Success - got credentials
        const creds = info.data.map((d) => d.product);
        const parsed = creds.map((raw) => parseCredential(raw));
        const deliveryInfo = JSON.stringify(parsed);

        // Update order to completed
        dataStore.updateOrder(orderId, {
          status: ORDER_STATUS.COMPLETED,
          updatedAt: new Date(),
          completedAt: new Date(),
          deliveryInfo,
        });

        // Update product sold counter
        const order = dataStore.getOrder(orderId);
        if (order) {
          const product = dataStore.getProduct(order.productId);
          if (product) {
            let updatedOptions = product.options;
            let updatedStock = product.stock;

            if (product.options && order.selectedOptionId) {
              updatedOptions = product.options.map((opt) =>
                opt.id === order.selectedOptionId
                  ? { ...opt, stock: Math.max(0, opt.stock - order.quantity) }
                  : opt
              );
            } else if (product.stock !== undefined) {
              updatedStock = Math.max(0, product.stock - order.quantity);
            }

            dataStore.updateProduct(order.productId, {
              sold: (product.sold || 0) + order.quantity,
              options: updatedOptions,
              stock: updatedStock,
            });
          }
        }

        console.log(
          `OrderProcessor: Completed order ${orderId} after ${
            job.attempts + 1
          } attempts`
        );
        return true;
      }

      // Check if still processing
      if (info.description && /processing/i.test(info.description)) {
        return false; // Continue polling
      }

      // Other failure - mark as failed after max attempts
      if (job.attempts >= job.maxAttempts - 1) {
        console.error(
          `OrderProcessor: Order ${orderId} failed after ${job.maxAttempts} attempts:`,
          info
        );
        return true; // Remove from queue but keep as pending for admin review
      }

      return false; // Retry
    } catch (error) {
      console.error(
        `OrderProcessor: Error processing order ${orderId}:`,
        error
      );

      // On max attempts, give up
      if (job.attempts >= job.maxAttempts - 1) {
        console.error(
          `OrderProcessor: Giving up on order ${orderId} after ${job.maxAttempts} attempts`
        );
        return true;
      }

      return false; // Retry
    }
  }

  // Main processing loop
  private async processJobs() {
    if (this.isProcessing || this.jobs.size === 0) return;

    this.isProcessing = true;
    const now = new Date();

    try {
      // Get jobs ready for processing
      const readyJobs = Array.from(this.jobs.values())
        .filter((job) => job.nextRetryAt <= now)
        .slice(0, this.BATCH_SIZE);

      if (readyJobs.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`OrderProcessor: Processing ${readyJobs.length} jobs`);

      // Process jobs concurrently
      const results = await Promise.allSettled(
        readyJobs.map(async (job) => {
          const completed = await this.processOrder(job);
          return { job, completed };
        })
      );

      // Update job states
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const { job, completed } = result.value;

          if (completed) {
            this.removeJob(job.orderId);
          } else {
            // Schedule retry with exponential backoff
            job.attempts++;
            const delay = this.getRetryDelay(job.attempts);
            job.nextRetryAt = new Date(Date.now() + delay);

            console.log(
              `OrderProcessor: Retrying order ${job.orderId} in ${Math.round(
                delay / 1000
              )}s (attempt ${job.attempts}/${job.maxAttempts})`
            );
          }
        }
      });
    } catch (error) {
      console.error("OrderProcessor: Error in processing loop:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Start background processor
  private startProcessor() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.processJobs().catch(console.error);
    }, this.POLL_INTERVAL);

    console.log(
      `OrderProcessor: Started with ${this.POLL_INTERVAL}ms interval`
    );
  }

  // Stop processor
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("OrderProcessor: Stopped");
    }
  }

  // Get processing stats
  getStats() {
    return {
      activeJobs: this.jobs.size,
      isProcessing: this.isProcessing,
      jobs: Array.from(this.jobs.values()).map((job) => ({
        orderId: job.orderId,
        attempts: job.attempts,
        nextRetryAt: job.nextRetryAt,
        createdAt: job.createdAt,
      })),
    };
  }
}

// Global singleton instance
let processorInstance: OrderProcessor | null = null;

export function getOrderProcessor(): OrderProcessor {
  if (!processorInstance) {
    processorInstance = new OrderProcessor();
  }
  return processorInstance;
}

export function stopOrderProcessor() {
  if (processorInstance) {
    processorInstance.stop();
    processorInstance = null;
  }
}
