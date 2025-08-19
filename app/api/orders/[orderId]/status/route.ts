import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { dataStore } from "@/src/core/data-store";
import { getOrderProcessor } from "@/src/services/orderProcessor";

// GET /api/orders/[orderId]/status - Get order status and processing info
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Cần đăng nhập" },
        { status: 401 }
      );
    }

    const user = dataStore.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy người dùng" },
        { status: 400 }
      );
    }

    const { orderId } = params;
    const order = dataStore.getOrder(orderId);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    // Check if user owns this order
    if (order.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Không có quyền truy cập đơn hàng này" },
        { status: 403 }
      );
    }

    // Get processing info if order is still pending
    const processor = getOrderProcessor();
    const processingStats = processor.getStats();
    const processingJob = processingStats.jobs.find(job => job.orderId === orderId);

    const response = {
      orderId: order.id,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.completedAt,
      totalAmount: order.totalAmount,
      quantity: order.quantity,
      deliveryInfo: order.deliveryInfo,
      processing: processingJob ? {
        attempts: processingJob.attempts,
        nextRetryAt: processingJob.nextRetryAt,
        estimatedCompletionTime: new Date(Date.now() + 30000), // Rough estimate
        isProcessing: processingStats.isProcessing,
      } : null,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Get order status error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi lấy trạng thái đơn hàng" },
      { status: 500 }
    );
  }
}
