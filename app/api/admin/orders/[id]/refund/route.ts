import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminPermission,
  logAdminAction,
  getCurrentAdmin,
} from "@/src/core/admin-auth";
import { OrderRefundRequest } from "@/src/core/admin";
import { dataStore } from "@/src/core/data-store";
import { ORDER_STATUS, orderStatusToViText } from "@/src/core/constants";

// POST /api/admin/orders/[id]/refund - Process order refund
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdminPermission(request, "canManageOrders");
  if (authError) return authError;

  try {
    const orderId = params.id;
    const order = dataStore.getOrder(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    // Check if order can be refunded
    if (order.status === ORDER_STATUS.REFUNDED) {
      return NextResponse.json(
        { success: false, error: "Đơn hàng đã được hoàn tiền" },
        { status: 400 }
      );
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
      return NextResponse.json(
        { success: false, error: "Không thể hoàn tiền đơn hàng đã huỷ" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const refundRequest: OrderRefundRequest = {
      orderId,
      amount: body.amount || order.totalAmount,
      reason: body.reason || "Hoàn tiền theo yêu cầu",
      adminNotes: body.adminNotes,
      notifyCustomer: body.notifyCustomer !== false, // Default to true
    };

    // Validate refund amount
    if (refundRequest.amount <= 0 || refundRequest.amount > order.totalAmount) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Số tiền hoàn không hợp lệ. Phải từ 1 đến ${order.totalAmount.toLocaleString("vi-VN")} VND` 
        },
        { status: 400 }
      );
    }

    // Get current admin info
    const admin = await getCurrentAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Không thể xác thực admin" },
        { status: 401 }
      );
    }

    // Get customer info
    const user = dataStore.getUserById(order.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy thông tin khách hàng" },
        { status: 404 }
      );
    }

    // Process refund
    const now = new Date();
    
    // Update user balance
    const balanceUpdate = dataStore.updateUserBalance(user.id, refundRequest.amount, {
      type: "refund",
      description: `Hoàn tiền đơn hàng ${orderId}: ${refundRequest.reason}`,
      orderId: orderId,
      adminId: admin.id,
    });

    if (!balanceUpdate) {
      return NextResponse.json(
        { success: false, error: "Không thể cập nhật số dư khách hàng" },
        { status: 500 }
      );
    }

    // Update order status and refund information
    const orderUpdate = dataStore.updateOrder(orderId, {
      status: ORDER_STATUS.REFUNDED,
      refundedAt: now,
      refundAmount: refundRequest.amount,
      refundReason: refundRequest.reason,
      refundedBy: admin.id,
      lastModifiedBy: admin.id,
      lastModifiedByName: admin.name,
      adminNotes: refundRequest.adminNotes 
        ? `${order.adminNotes || ""}\n[${now.toLocaleString("vi-VN")}] Hoàn tiền: ${refundRequest.adminNotes}`.trim()
        : order.adminNotes,
    });

    if (!orderUpdate) {
      // Rollback balance update if order update fails
      dataStore.updateUserBalance(user.id, -refundRequest.amount, {
        type: "debit",
        description: `Rollback hoàn tiền đơn hàng ${orderId} (lỗi hệ thống)`,
        orderId: orderId,
        adminId: admin.id,
      });
      
      return NextResponse.json(
        { success: false, error: "Không thể cập nhật thông tin đơn hàng" },
        { status: 500 }
      );
    }

    // Log admin action
    await logAdminAction(
      admin.id,
      "order_refund",
      "order",
      orderId,
      `Hoàn tiền đơn hàng ${orderId}: ${refundRequest.amount.toLocaleString("vi-VN")} VND - ${refundRequest.reason}`,
      {
        refundAmount: refundRequest.amount,
        originalAmount: order.totalAmount,
        reason: refundRequest.reason,
        customerEmail: user.email,
        customerNewBalance: user.balance + refundRequest.amount,
        adminNotes: refundRequest.adminNotes,
      }
    );

    // TODO: Send notification to customer if notifyCustomer is true
    // This would integrate with email/SMS notification system

    return NextResponse.json({
      success: true,
      data: {
        order: orderUpdate,
        refund: {
          amount: refundRequest.amount,
          reason: refundRequest.reason,
          processedAt: now,
          processedBy: admin.name,
        },
        customer: {
          email: user.email,
          newBalance: user.balance + refundRequest.amount,
        },
      },
      message: `Đã hoàn tiền ${refundRequest.amount.toLocaleString("vi-VN")} VND cho đơn hàng ${orderId}`,
    });

  } catch (error) {
    console.error("Admin order refund error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi xử lý hoàn tiền" },
      { status: 500 }
    );
  }
}

// GET /api/admin/orders/[id]/refund - Get refund information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdminPermission(request, "canManageOrders");
  if (authError) return authError;

  try {
    const orderId = params.id;
    const order = dataStore.getOrder(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    // Get customer info
    const user = dataStore.getUserById(order.userId);
    
    const refundInfo = {
      canRefund: order.status !== ORDER_STATUS.REFUNDED && order.status !== ORDER_STATUS.CANCELLED,
      isRefunded: order.status === ORDER_STATUS.REFUNDED,
      originalAmount: order.totalAmount,
      refundAmount: (order as any).refundAmount,
      refundReason: (order as any).refundReason,
      refundedAt: (order as any).refundedAt,
      refundedBy: (order as any).refundedBy,
      maxRefundAmount: order.totalAmount,
      customerBalance: user?.balance || 0,
      customerEmail: user?.email,
    };

    return NextResponse.json({
      success: true,
      data: refundInfo,
    });

  } catch (error) {
    console.error("Admin order refund info error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi tải thông tin hoàn tiền" },
      { status: 500 }
    );
  }
}
