import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { dataStore } from "@/src/core/data-store";
import { TapHoaMMOClient } from "@/src/services/taphoammo";
import { ORDER_STATUS } from "@/src/core/constants";
import { getOrderProcessor } from "@/src/services/orderProcessor";
import type { Order } from "@/src/core/admin";

// Helper response utilities for consistency
function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}
function err(message: string, status = 400, extra?: Record<string, any>) {
  return NextResponse.json(
    { success: false, error: message, ...(extra || {}) },
    { status }
  );
}

// POST /api/orders
// Body: { productId: string, quantity: number, promotion?: string }
// Creates an order by purchasing from supplier and returning credentials
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return err("Cần đăng nhập", 401);
    }

    const user = dataStore.getUserByEmail(session.user.email);
    if (!user) {
      return err("Không tìm thấy người dùng", 400);
    }

    const {
      productId,
      quantity = 1,
      promotion,
      selectedOptionId,
    } = await request.json();
    if (!productId || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin đơn hàng" },
        { status: 400 }
      );
    }

    const product = dataStore.getProduct(productId);
    if (!product || !product.isActive) {
      return NextResponse.json(
        { success: false, error: "Sản phẩm không khả dụng" },
        { status: 400 }
      );
    }

    // Validate selected option if product has options
    let selectedOption = null;
    const hasOptions = product.options && product.options.length > 0;

    if (hasOptions) {
      if (!selectedOptionId) {
        return NextResponse.json(
          { success: false, error: "Vui lòng chọn loại sản phẩm" },
          { status: 400 }
        );
      }
      selectedOption = product.options!.find(
        (opt) => opt.id === selectedOptionId
      );
      if (!selectedOption) {
        return NextResponse.json(
          { success: false, error: "Loại sản phẩm không hợp lệ" },
          { status: 400 }
        );
      }
      if (selectedOption.stock === 0) {
        return NextResponse.json(
          { success: false, error: "Sản phẩm đã hết hàng" },
          { status: 400 }
        );
      }
      if (selectedOption.stock < quantity) {
        return NextResponse.json(
          { success: false, error: `Chỉ còn ${selectedOption.stock} sản phẩm` },
          { status: 400 }
        );
      }
    } else {
      // For products without options, check main product stock
      if (product.stock === 0) {
        return NextResponse.json(
          { success: false, error: "Sản phẩm đã hết hàng" },
          { status: 400 }
        );
      }
      if (product.stock && product.stock < quantity) {
        return NextResponse.json(
          { success: false, error: `Chỉ còn ${product.stock} sản phẩm` },
          { status: 400 }
        );
      }
    }

    // Use option price if available, otherwise use product price
    const unitPrice = selectedOption ? selectedOption.price : product.price;

    if (!unitPrice || unitPrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Giá sản phẩm không hợp lệ" },
        { status: 400 }
      );
    }

    const totalAmount = unitPrice * quantity;

    // Check balance (simple wallet-based)
    if (user.balance < totalAmount) {
      return NextResponse.json(
        { success: false, error: "Số dư không đủ. Vui lòng nạp thêm tiền." },
        { status: 400 }
      );
    }

    // Create pending order record
    const orderId = `ord-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const order: Order = {
      id: orderId,
      userId: user.id,
      productId,
      quantity,
      unitPrice,
      totalAmount,
      status: ORDER_STATUS.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      selectedOptionId: selectedOption?.id,
    };
    dataStore.createOrder(order);

    // Debit user's balance and log transaction
    dataStore.updateUser(user.id, {
      balance: user.balance - totalAmount,
      totalSpent: (user.totalSpent || 0) + totalAmount,
      totalOrders: (user.totalOrders || 0) + 1,
    });
    dataStore.createTransaction({
      userId: user.id,
      type: "purchase",
      amount: -totalAmount,
      description: `${product.title} x${quantity}`,
      orderId: order.id,
      metadata: { productId, quantity },
    });

    // Prepare supplier client (allow env fallback)
    const kioskToken =
      selectedOption?.kioskToken ||
      process.env.TAPHOAMMO_KIOSK_TOKEN ||
      undefined;

    let supplier: TapHoaMMOClient;
    try {
      supplier = new TapHoaMMOClient({
        kioskToken,
      });
    } catch (e: any) {
      // Cancel order and refund due to missing/invalid supplier config
      dataStore.updateOrder(order.id, {
        status: ORDER_STATUS.CANCELLED,
        updatedAt: new Date(),
        cancelledAt: new Date(),
        adminNotes: "Thiếu cấu hình API nhà cung cấp",
      });
      const freshUser = dataStore.getUser(user.id)!;
      dataStore.updateUser(freshUser.id, {
        balance: freshUser.balance + totalAmount,
      });
      dataStore.createTransaction({
        userId: freshUser.id,
        type: "refund",
        amount: totalAmount,
        description: `Hoàn tiền do lỗi cấu hình đơn hàng ${order.id}`,
        orderId: order.id,
      });
      return err(
        "Thiếu cấu hình API nhà cung cấp. Vui lòng liên hệ quản trị.",
        500
      );
    }

    const buyResp = await supplier.buyProducts(quantity, promotion);
    if (!buyResp || buyResp.success !== "true" || !buyResp.order_id) {
      const message =
        (buyResp && buyResp.description) ||
        "Không thể đặt hàng từ nhà cung cấp";
      dataStore.updateOrder(order.id, {
        status: ORDER_STATUS.CANCELLED,
        updatedAt: new Date(),
      });
      // Refund
      const freshUser = dataStore.getUser(user.id)!;
      dataStore.updateUser(freshUser.id, {
        balance: freshUser.balance + totalAmount,
      });
      dataStore.createTransaction({
        userId: freshUser.id,
        type: "refund",
        amount: totalAmount,
        description: `Hoàn tiền thất bại đơn hàng ${order.id}`,
        orderId: order.id,
      });
      return NextResponse.json(
        { success: false, error: message },
        { status: 502 }
      );
    }

    // Add to background processing queue instead of synchronous polling
    const upstreamOrderId = buyResp.order_id;
    const processor = getOrderProcessor();
    processor.addJob(order.id, upstreamOrderId, kioskToken);

    // Return immediately with pending status
    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        status: ORDER_STATUS.PENDING,
        message:
          "Đơn hàng đang được xử lý. Bạn sẽ nhận được thông báo khi hoàn tất.",
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi tạo đơn hàng" },
      { status: 500 }
    );
  }
}

// GET /api/orders?userId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Thiếu userId" },
        { status: 400 }
      );
    }

    const user = dataStore.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }

    const orders = dataStore
      .getOrdersByUser(userId)
      .sort(
        (a, b) =>
          new Date((b as any).updatedAt || (b as any).createdAt).getTime() -
          new Date((a as any).updatedAt || (a as any).createdAt).getTime()
      );

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi tải đơn hàng" },
      { status: 500 }
    );
  }
}
