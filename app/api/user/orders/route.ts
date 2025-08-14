import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { dataStore } from "@/src/core/data-store";

// GET /api/user/orders - returns current user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Cần đăng nhập" }, { status: 401 });
    }

    const user = dataStore.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ success: false, error: "Không tìm thấy người dùng" }, { status: 400 });
    }

    const orders = dataStore.getOrdersByUser(user.id);
    return NextResponse.json({ success: true, data: orders });
  } catch (e) {
    console.error("List orders error:", e);
    return NextResponse.json({ success: false, error: "Có lỗi xảy ra" }, { status: 500 });
  }
}

