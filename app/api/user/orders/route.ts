import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { dataStore } from "@/src/core/data-store";

// GET /api/user/orders - returns current user's orders
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const allOrders = dataStore.getOrdersByUser(user.id).map((o) => {
      const p = dataStore.getProduct(o.productId);
      const optLabel = p?.options?.find(
        (opt) => opt.id === o.selectedOptionId
      )?.label;
      return {
        ...o,
        productTitle: p?.title,
        selectedOptionLabel: optLabel,
      };
    });

    const totalPages = Math.ceil(allOrders.length / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = allOrders.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedOrders,
      totalPages,
      currentPage: page,
    });
  } catch (e) {
    console.error("List orders error:", e);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra" },
      { status: 500 }
    );
  }
}
