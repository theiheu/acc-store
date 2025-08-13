import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, getCurrentAdmin } from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";

// GET /api/admin/topup-requests - Get all top-up requests
export async function GET(request: NextRequest) {
  try {
    // Check admin permissions
    const hasPermission = await requireAdminPermission("manage_users");
    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient permissions",
        },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get requests based on status filter
    let requests = status === "pending" 
      ? dataStore.getPendingTopupRequests()
      : dataStore.getTopupRequests();

    // Apply pagination
    const total = requests.length;
    const paginatedRequests = requests.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        requests: paginatedRequests,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });

  } catch (error) {
    console.error("Error fetching top-up requests:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
