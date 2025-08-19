import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import { getOrderProcessor } from "@/src/services/orderProcessor";
import { dataStore } from "@/src/core/data-store";
import { ORDER_STATUS } from "@/src/core/constants";

// GET /api/admin/order-processor - Get order processor stats and pending orders
export async function GET(request: NextRequest) {
  const authError = await requireAdminPermission(request, "canViewAnalytics");
  if (authError) return authError;

  try {
    const processor = getOrderProcessor();
    const stats = processor.getStats();
    
    // Get all pending orders
    const allOrders = dataStore.getAllOrders();
    const pendingOrders = allOrders
      .filter(order => order.status === ORDER_STATUS.PENDING)
      .map(order => {
        const product = dataStore.getProduct(order.productId);
        const processingJob = stats.jobs.find(job => job.orderId === order.id);
        
        return {
          id: order.id,
          userId: order.userId,
          productTitle: product?.title || "Unknown Product",
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          processing: processingJob ? {
            attempts: processingJob.attempts,
            nextRetryAt: processingJob.nextRetryAt,
            createdAt: processingJob.createdAt,
          } : null,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: {
        processor: {
          activeJobs: stats.activeJobs,
          isProcessing: stats.isProcessing,
        },
        pendingOrders,
        summary: {
          totalPendingOrders: pendingOrders.length,
          ordersInQueue: stats.activeJobs,
          oldestPendingOrder: pendingOrders.length > 0 ? pendingOrders[pendingOrders.length - 1].createdAt : null,
        },
      },
    });
  } catch (error) {
    console.error("Get order processor stats error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi lấy thống kê xử lý đơn hàng" },
      { status: 500 }
    );
  }
}

// POST /api/admin/order-processor - Manual retry or force process specific order
export async function POST(request: NextRequest) {
  const authError = await requireAdminPermission(request, "canManageOrders");
  if (authError) return authError;

  try {
    const { action, orderId } = await request.json();
    
    if (action === "retry" && orderId) {
      const order = dataStore.getOrder(orderId);
      if (!order) {
        return NextResponse.json(
          { success: false, error: "Không tìm thấy đơn hàng" },
          { status: 404 }
        );
      }

      if (order.status !== ORDER_STATUS.PENDING) {
        return NextResponse.json(
          { success: false, error: "Chỉ có thể retry đơn hàng đang chờ xử lý" },
          { status: 400 }
        );
      }

      // For manual retry, we would need to store the upstream order ID
      // This is a simplified implementation
      return NextResponse.json({
        success: false,
        error: "Chức năng retry thủ công chưa được triển khai đầy đủ. Vui lòng liên hệ kỹ thuật.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Action không hợp lệ" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Order processor action error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi thực hiện thao tác" },
      { status: 500 }
    );
  }
}
