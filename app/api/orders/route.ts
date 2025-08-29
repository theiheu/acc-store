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
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return err("Cần đăng nhập", 401);
  }

  const user = dataStore.getUserByEmail(session.user.email);
  if (!user) {
    return err("Không tìm thấy người dùng", 404);
  }

  const { items } = await request.json();
  if (!Array.isArray(items) || items.length === 0) {
    return err("Giỏ hàng trống hoặc không hợp lệ", 400);
  }

  let totalAmount = 0;
  const validatedItems = [];

  // 1. Validate all items and calculate total amount first
  for (const item of items) {
    const product = dataStore.getProduct(item.productId);
    if (!product || !product.isActive) {
      return err(
        `Sản phẩm "${item.product?.title || item.productId}" không tồn tại.`,
        400
      );
    }

    let selectedOption = null;
    if (product.options && product.options.length > 0) {
      if (!item.optionId) {
        return err(`Vui lòng chọn loại cho sản phẩm "${product.title}".`, 400);
      }
      selectedOption = product.options.find((opt) => opt.id === item.optionId);
      if (!selectedOption) {
        return err(`Loại sản phẩm không hợp lệ cho "${product.title}".`, 400);
      }
      if (selectedOption.stock < item.quantity) {
        return err(
          `Không đủ hàng cho "${product.title}". Chỉ còn ${selectedOption.stock}.`,
          400
        );
      }
    } else {
      if (product.stock && product.stock < item.quantity) {
        return err(
          `Không đủ hàng cho "${product.title}". Chỉ còn ${product.stock}.`,
          400
        );
      }
    }

    const unitPrice = selectedOption ? selectedOption.price : product.price;
    if (!unitPrice || unitPrice <= 0) {
      return err(`Giá sản phẩm không hợp lệ cho "${product.title}".`, 400);
    }

    totalAmount += unitPrice * item.quantity;
    validatedItems.push({ ...item, product, selectedOption, unitPrice });
  }

  // 2. Check user balance
  if (user.balance < totalAmount) {
    return err("Số dư không đủ. Vui lòng nạp thêm tiền.", 402);
  }

  // 3. Process the order
  const createdOrders: Order[] = [];
  const checkoutId = `co-${Date.now()}`;

  // Debit user's balance first
  dataStore.updateUser(user.id, {
    balance: user.balance - totalAmount,
    totalSpent: (user.totalSpent || 0) + totalAmount,
    totalOrders: (user.totalOrders || 0) + validatedItems.length,
  });

  // Create a single transaction for the whole cart
  dataStore.createTransaction({
    userId: user.id,
    type: "purchase",
    amount: -totalAmount,
    description: `Thanh toán giỏ hàng (${validatedItems.length} sản phẩm)`,
    orderId: checkoutId, // Use a checkout ID for the parent transaction
    metadata: { items: validatedItems.map((it) => it.productId) },
  });

  try {
    for (const item of validatedItems) {
      const orderId = `ord-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const order: Order = {
        id: orderId,
        userId: user.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.unitPrice * item.quantity,
        status: ORDER_STATUS.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        selectedOptionId: item.optionId,
        checkoutId: checkoutId,
      };
      dataStore.createOrder(order);
      createdOrders.push(order);

      // TODO: In a real scenario, you might want to aggregate supplier calls
      // For now, we process them sequentially.
      const kioskToken =
        item.selectedOption?.kioskToken || process.env.TAPHOAMMO_KIOSK_TOKEN;
      const supplier = new TapHoaMMOClient({ kioskToken });
      const buyResp = await supplier.buyProducts(item.quantity);

      if (!buyResp || buyResp.success !== "true" || !buyResp.order_id) {
        throw new Error(
          `Lỗi đặt hàng từ nhà cung cấp cho sản phẩm ${item.product.title}: ${
            buyResp?.description || "Unknown error"
          }`
        );
      }

      const processor = getOrderProcessor();
      processor.addJob(order.id, buyResp.order_id, kioskToken);
    }

    return ok({
      checkoutId: checkoutId,
      orders: createdOrders.map((o) => o.id),
      message: "Đơn hàng của bạn đang được xử lý.",
    });
  } catch (error: any) {
    console.error("Checkout processing error:", error);

    // Rollback: Refund the user and cancel all created orders
    dataStore.updateUser(user.id, {
      balance: user.balance, // Balance was already debited, so we just need to add it back
    });
    const freshUser = dataStore.getUser(user.id)!;
    dataStore.updateUser(freshUser.id, {
      balance: freshUser.balance + totalAmount,
    });

    dataStore.createTransaction({
      userId: user.id,
      type: "refund",
      amount: totalAmount,
      description: `Hoàn tiền do lỗi thanh toán giỏ hàng ${checkoutId}`,
      orderId: checkoutId,
    });

    for (const order of createdOrders) {
      dataStore.updateOrder(order.id, {
        status: ORDER_STATUS.CANCELLED,
        adminNotes: `Lỗi hệ thống: ${error.message}`,
      });
    }

    return err(
      error.message || "Có lỗi xảy ra khi xử lý đơn hàng của bạn.",
      500
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
