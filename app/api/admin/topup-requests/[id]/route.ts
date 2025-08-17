import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminPermission,
  getCurrentAdmin,
  logAdminAction,
} from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";

// GET /api/admin/topup-requests/[id] - Get specific top-up request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin permissions
  const authError = await requireAdminPermission(request, "canManageUsers");
  if (authError) return authError;
  try {
    const requestId = params.id;
    const topupRequest = dataStore.getTopupRequest(requestId);

    if (!topupRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "Top-up request not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: topupRequest,
    });
  } catch (error) {
    console.error("Error fetching top-up request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/topup-requests/[id] - Process top-up request (approve/reject)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin permissions
  const authError = await requireAdminPermission(request, "canManageUsers");
  if (authError) return authError;
  try {
    // Get current admin
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin not found",
        },
        { status: 401 }
      );
    }

    const requestId = params.id;
    const body = await request.json();
    const { action, approvedAmount, adminNotes, rejectionReason } = body;

    // Validate action
    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'approve' or 'reject'",
        },
        { status: 400 }
      );
    }

    // Get the request
    const topupRequest = dataStore.getTopupRequest(requestId);
    if (!topupRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "Top-up request not found",
        },
        { status: 404 }
      );
    }

    if (topupRequest.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: "Request has already been processed",
        },
        { status: 400 }
      );
    }

    // Validate approved amount if approving
    if (action === "approve") {
      if (approvedAmount !== undefined) {
        if (typeof approvedAmount !== "number" || approvedAmount <= 0) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid approved amount",
            },
            { status: 400 }
          );
        }

        if (approvedAmount < 10000 || approvedAmount > 10000000) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Số tiền duyệt phải nằm trong khoảng 10,000 ₫ đến 10,000,000 ₫",
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate rejection reason if rejecting
    if (action === "reject" && !rejectionReason) {
      return NextResponse.json(
        {
          success: false,
          error: "Rejection reason is required when rejecting a request",
        },
        { status: 400 }
      );
    }

    // Process the request
    const result = dataStore.processTopupRequest(
      requestId,
      action,
      admin.id,
      admin.name,
      {
        approvedAmount,
        adminNotes,
        rejectionReason,
      }
    );

    if (!result.request) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to process request",
        },
        { status: 500 }
      );
    }

    // Log admin action
    await logAdminAction(
      admin.id,
      action === "approve" ? "approve_topup_request" : "reject_topup_request",
      "topup-request",
      requestId,
      `${action === "approve" ? "Approved" : "Rejected"} top-up request for ${
        topupRequest.userName
      }`,
      {
        originalAmount: topupRequest.requestedAmount,
        approvedAmount: result.request.approvedAmount,
        adminNotes,
        rejectionReason,
        transactionId: result.transaction?.id,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Top-up request ${action}d successfully`,
      data: {
        request: result.request,
        transaction: result.transaction,
      },
    });
  } catch (error) {
    console.error("Error processing top-up request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
