import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminPermission,
  logAdminAction,
  getCurrentAdmin,
} from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";
import { 
  ORDER_STATUS, 
  OrderStatus,
  isValidStatusTransition,
  orderStatusToViText 
} from "@/src/core/constants";

// PUT /api/admin/orders/[id]/status - Update order status
export async function PUT(
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

    const body = await request.json();
    const { status, reason, notes } = body;

    // Validate new status
    if (!Object.values(ORDER_STATUS).includes(status)) {
      return NextResponse.json(
        { success: false, error: "Trạng thái đơn hàng không hợp lệ" },
        { status: 400 }
      );
    }

    // Check if status transition is valid
    if (!isValidStatusTransition(order.status as OrderStatus, status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Không thể chuyển từ trạng thái "${orderStatusToViText(order.status as OrderStatus)}" sang "${orderStatusToViText(status)}"` 
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

    // Prepare update data
    const updateData: any = {
      status,
      lastModifiedBy: admin.id,
      lastModifiedByName: admin.name,
    };

    // Add timestamp fields based on status
    const now = new Date();
    switch (status) {
      case ORDER_STATUS.PROCESSING:
        updateData.processingStartedAt = now;
        break;
      case ORDER_STATUS.SHIPPED:
        updateData.shippedAt = now;
        break;
      case ORDER_STATUS.DELIVERED:
        updateData.deliveredAt = now;
        break;
      case ORDER_STATUS.COMPLETED:
        updateData.completedAt = now;
        break;
      case ORDER_STATUS.CANCELLED:
        updateData.cancelledAt = now;
        break;
      case ORDER_STATUS.REFUNDED:
        updateData.refundedAt = now;
        break;
    }

    // Add admin notes if provided
    if (notes) {
      const existingNotes = order.adminNotes || "";
      const newNote = `[${now.toLocaleString("vi-VN")}] ${admin.name}: ${notes}`;
      updateData.adminNotes = existingNotes 
        ? `${existingNotes}\n${newNote}`
        : newNote;
    }

    // Handle special status changes
    if (status === ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.PENDING) {
      // Refund user balance for non-pending orders
      const user = dataStore.getUserById(order.userId);
      if (user) {
        dataStore.updateUserBalance(user.id, order.totalAmount, {
          type: "refund",
          description: `Hoàn tiền đơn hàng ${orderId} (huỷ bởi admin)`,
          orderId: orderId,
          adminId: admin.id,
        });
      }
    }

    // Update order
    const updatedOrder = dataStore.updateOrder(orderId, updateData);

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: "Không thể cập nhật trạng thái đơn hàng" },
        { status: 500 }
      );
    }

    // Log admin action
    await logAdminAction(
      admin.id,
      "order_status_change",
      "order",
      orderId,
      `Thay đổi trạng thái đơn hàng ${orderId} từ "${orderStatusToViText(order.status as OrderStatus)}" sang "${orderStatusToViText(status)}"${reason ? `: ${reason}` : ""}`,
      {
        fromStatus: order.status,
        toStatus: status,
        reason,
        notes,
        refundAmount: status === ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.PENDING ? order.totalAmount : undefined,
      }
    );

    // TODO: Create status history entry
    // This would be implemented when we add the status history tracking table

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: `Đã cập nhật trạng thái đơn hàng thành "${orderStatusToViText(status)}"`,
    });

  } catch (error) {
    console.error("Admin order status update error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi cập nhật trạng thái đơn hàng" },
      { status: 500 }
    );
  }
}

// GET /api/admin/orders/[id]/status - Get order status history
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

    // TODO: Implement status history retrieval
    // For now, return basic status information
    const statusInfo = {
      currentStatus: order.status,
      currentStatusText: orderStatusToViText(order.status as OrderStatus),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
      refundedAt: order.refundedAt,
      processingStartedAt: (order as any).processingStartedAt,
      shippedAt: (order as any).shippedAt,
      deliveredAt: (order as any).deliveredAt,
      lastModifiedBy: (order as any).lastModifiedBy,
      lastModifiedByName: (order as any).lastModifiedByName,
      adminNotes: order.adminNotes,
      // Mock status history - in real implementation this would come from database
      history: [
        {
          id: "1",
          fromStatus: null,
          toStatus: ORDER_STATUS.PENDING,
          changedAt: order.createdAt,
          changedBy: "system",
          changedByName: "Hệ thống",
          reason: "Đơn hàng được tạo",
        },
        // Additional history entries would be added here
      ],
    };

    return NextResponse.json({
      success: true,
      data: statusInfo,
    });

  } catch (error) {
    console.error("Admin order status history error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi tải lịch sử trạng thái đơn hàng" },
      { status: 500 }
    );
  }
}
