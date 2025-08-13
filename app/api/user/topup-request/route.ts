import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { dataStore } from "@/src/core/data-store";

// POST /api/user/topup-request - Submit a new top-up request
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Get user from data store
    const user = dataStore.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { amount, notes, qrCodeData, transferContent, bankInfo } = body;

    // Validate input
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid amount. Amount must be a positive number.",
        },
        { status: 400 }
      );
    }

    // Check minimum amount (10,000 VND)
    if (amount < 10000) {
      return NextResponse.json(
        {
          success: false,
          error: "Minimum top-up amount is 10,000 VND",
        },
        { status: 400 }
      );
    }

    // Check maximum amount (10,000,000 VND)
    if (amount > 10000000) {
      return NextResponse.json(
        {
          success: false,
          error: "Maximum top-up amount is 10,000,000 VND",
        },
        { status: 400 }
      );
    }

    // Check if user has pending requests
    const pendingRequests = dataStore
      .getUserTopupRequests(user.id)
      .filter((req) => req.status === "pending");

    if (pendingRequests.length >= 3) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You have too many pending requests. Please wait for them to be processed.",
        },
        { status: 400 }
      );
    }

    // Create top-up request with QR code data
    const topupRequest = dataStore.createTopupRequest({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      requestedAmount: amount,
      userNotes: notes || "",
      status: "pending",
      qrCodeData,
      transferContent,
      bankInfo,
    });

    return NextResponse.json({
      success: true,
      message: "Top-up request submitted successfully",
      data: {
        requestId: topupRequest.id,
        amount: topupRequest.requestedAmount,
        status: topupRequest.status,
        createdAt: topupRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating top-up request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// GET /api/user/topup-request - Get user's top-up requests
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Get user from data store
    const user = dataStore.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Get user's top-up requests
    const requests = dataStore.getUserTopupRequests(user.id);

    return NextResponse.json({
      success: true,
      data: requests.map((req) => ({
        id: req.id,
        requestedAmount: req.requestedAmount,
        approvedAmount: req.approvedAmount,
        userNotes: req.userNotes,
        adminNotes: req.adminNotes,
        status: req.status,
        createdAt: req.createdAt,
        processedAt: req.processedAt,
        processedByName: req.processedByName,
        rejectionReason: req.rejectionReason,
        transactionId: req.transactionId,
      })),
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
