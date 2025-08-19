import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminPermission,
  logAdminAction,
  getCurrentAdmin,
} from "@/src/core/admin-auth";
import { AdminOrder } from "@/src/core/admin";
import { dataStore } from "@/src/core/data-store";
import { ORDER_STATUS } from "@/src/core/constants";

// GET /api/admin/orders/[id] - Get order details
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

    // Get related data
    const user = dataStore.getUserById(order.userId);
    const product = dataStore.getProduct(order.productId);
    const selectedOption = product?.options?.find(opt => opt.id === order.selectedOptionId);
    
    // Get user's order history for context
    const userOrders = dataStore.getOrdersByUser(order.userId);
    
    // Enrich order with additional information
    const enrichedOrder: AdminOrder = {
      ...order,
      customerEmail: user?.email || "Unknown",
      customerName: user?.name,
      customerBalance: user?.balance || 0,
      customerTotalOrders: userOrders.length,
      productTitle: product?.title || "Unknown Product",
      productCategory: product?.category,
      selectedOptionLabel: selectedOption?.label,
      statusHistory: [], // TODO: Implement status history tracking
    };

    // Get related orders from same customer
    const relatedOrders = userOrders
      .filter(o => o.id !== orderId)
      .slice(0, 5)
      .map(o => {
        const relatedProduct = dataStore.getProduct(o.productId);
        return {
          id: o.id,
          productTitle: relatedProduct?.title || "Unknown Product",
          totalAmount: o.totalAmount,
          status: o.status,
          createdAt: o.createdAt,
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        order: enrichedOrder,
        relatedOrders,
        customer: user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          balance: user.balance,
          totalOrders: userOrders.length,
          totalSpent: userOrders
            .filter(o => o.status === ORDER_STATUS.COMPLETED)
            .reduce((sum, o) => sum + o.totalAmount, 0),
          registrationDate: user.createdAt,
        } : null,
        product: product ? {
          id: product.id,
          title: product.title,
          category: product.category,
          price: product.price,
          options: product.options,
        } : null,
      },
    });

  } catch (error) {
    console.error("Admin order detail error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi tải chi tiết đơn hàng" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/orders/[id] - Update order (admin notes, etc.)
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
    const { adminNotes } = body;

    // Get current admin info
    const admin = await getCurrentAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Không thể xác thực admin" },
        { status: 401 }
      );
    }

    // Update order
    const updatedOrder = dataStore.updateOrder(orderId, {
      adminNotes,
      lastModifiedBy: admin.id,
      lastModifiedByName: admin.name,
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: "Không thể cập nhật đơn hàng" },
        { status: 500 }
      );
    }

    // Log admin action
    await logAdminAction(
      admin.id,
      "order_update",
      "order",
      orderId,
      `Cập nhật ghi chú đơn hàng ${orderId}`,
      {
        oldNotes: order.adminNotes,
        newNotes: adminNotes,
      }
    );

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: "Đã cập nhật đơn hàng thành công",
    });

  } catch (error) {
    console.error("Admin order update error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi cập nhật đơn hàng" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/orders/[id] - Cancel order (admin only)
export async function DELETE(
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

    // Check if order can be cancelled
    if (order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.CANCELLED) {
      return NextResponse.json(
        { success: false, error: "Không thể huỷ đơn hàng đã hoàn thành hoặc đã huỷ" },
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

    // Get cancellation reason from request body
    const body = await request.json();
    const { reason } = body;

    // Update order status to cancelled
    const updatedOrder = dataStore.updateOrder(orderId, {
      status: ORDER_STATUS.CANCELLED,
      cancelledAt: new Date(),
      adminNotes: reason ? `Huỷ bởi admin: ${reason}` : "Huỷ bởi admin",
      lastModifiedBy: admin.id,
      lastModifiedByName: admin.name,
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: "Không thể huỷ đơn hàng" },
        { status: 500 }
      );
    }

    // Refund user balance if payment was processed
    const user = dataStore.getUserById(order.userId);
    if (user && order.status !== ORDER_STATUS.PENDING) {
      dataStore.updateUserBalance(user.id, order.totalAmount, {
        type: "refund",
        description: `Hoàn tiền đơn hàng ${orderId} (huỷ bởi admin)`,
        orderId: orderId,
        adminId: admin.id,
      });
    }

    // Log admin action
    await logAdminAction(
      admin.id,
      "order_cancel",
      "order",
      orderId,
      `Huỷ đơn hàng ${orderId}${reason ? `: ${reason}` : ""}`,
      {
        originalStatus: order.status,
        refundAmount: order.totalAmount,
        reason,
      }
    );

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: "Đã huỷ đơn hàng thành công",
    });

  } catch (error) {
    console.error("Admin order cancel error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi huỷ đơn hàng" },
      { status: 500 }
    );
  }
}
