import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { dataStore } from "@/src/core/data-store";

// GET /api/user/transactions - returns current user's recent transactions
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

    const tx = dataStore.getUserTransactions(user.id);
    return NextResponse.json({ success: true, data: tx });
  } catch (e) {
    console.error("List transactions error:", e);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra" },
      { status: 500 }
    );
  }
}

