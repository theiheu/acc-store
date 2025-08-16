import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { dataStore } from "@/src/core/data-store";

// PATCH /api/user/topup-request/[id] - Cancel a pending top-up request (user action)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Find user
    let user = dataStore.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const reqItem = dataStore.getTopupRequest(id);
    if (!reqItem || reqItem.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    if (reqItem.status !== "Đang chờ xử lý") {
      return NextResponse.json(
        { success: false, error: "Only pending requests can be Đã huỷ" },
        { status: 400 }
      );
    }

    // Update as rejected with user cancellation reason; SSE will be emitted by dataStore
    const updated = dataStore.updateTopupRequest(id, {
      status: "rejected",
      rejectionReason: "Người dùng hủy yêu cầu",
      processedAt: new Date(),
      processedBy: user.id,
      processedByName: session.user.name || user.email,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Failed to cancel request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: updated.id, status: updated.status },
    });
  } catch (error) {
    console.error("Error cancelling top-up request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
