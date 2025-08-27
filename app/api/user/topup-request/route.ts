import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { dataStore } from "@/src/core/data-store";
import { guardRateLimit } from "@/src/core/rate-limit";
import {
  STATUS,
  TOPUP_MIN_AMOUNT,
  TOPUP_MAX_AMOUNT,
} from "@/src/core/constants";

// POST /api/user/topup-request - Submit a new top-up request
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu đăng nhập",
        },
        { status: 401 }
      );
    }

    // Get or create user from data store (fallback for in-memory reset)
    let user = dataStore.getUserByEmail(session.user.email);
    if (!user) {
      user = dataStore.createUser({
        email: session.user.email,
        name: session.user.name || session.user.email.split("@")[0],
        role: "user",
        status: "active",
        balance: 0,
        totalOrders: 0,
        totalSpent: 0,
        registrationSource: "api-fallback",
      });
    }

    // Parse request body
    const body = await request.json();
    const { amount, notes, qrCodeData, transferContent, bankInfo } = body;

    // Validate input
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Số tiền không hợp lệ. Vui lòng nhập số tiền dương.",
        },
        { status: 400 }
      );
    }

    // Check min/max amount
    if (amount < TOPUP_MIN_AMOUNT) {
      return NextResponse.json(
        {
          success: false,
          error: "Số tiền tối thiểu là 10,000 ₫",
        },
        { status: 400 }
      );
    }

    if (amount > TOPUP_MAX_AMOUNT) {
      return NextResponse.json(
        {
          success: false,
          error: "Số tiền tối đa là 10,000,000 ₫",
        },
        { status: 400 }
      );
    }

    // Check if user has pending requests. If exists, update the latest with new details and reuse it
    const pendingRequests = dataStore
      .getUserTopupRequests(user.id)
      .filter((req) => req.status === STATUS.PENDING)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (pendingRequests.length > 0) {
      const latest = pendingRequests[0];
      const updated = dataStore.updateTopupRequest(latest.id, {
        requestedAmount: amount,
        userNotes: notes || latest.userNotes,
        qrCodeData,
        transferContent,
        bankInfo,
      });

      return NextResponse.json({
        success: true,
        reused: true,
        message: "Đã cập nhật yêu cầu nạp tiền đang chờ với thông tin mới.",
        data: {
          requestId: latest.id,
          amount: updated?.requestedAmount ?? amount,
          status: updated?.status ?? latest.status,
          createdAt: updated?.createdAt ?? latest.createdAt,
        },
      });
    }

    // Create top-up request with QR code data
    const topupRequest = dataStore.createTopupRequest({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      requestedAmount: amount,
      userNotes: notes || "",
      status: STATUS.PENDING,
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

    // Get or create user from data store (fallback for in-memory reset)
    let user = dataStore.getUserByEmail(session.user.email);
    if (!user) {
      user = dataStore.createUser({
        email: session.user.email,
        name: session.user.name || session.user.email.split("@")[0],
        role: "user",
        status: "active",
        balance: 0,
        totalOrders: 0,
        totalSpent: 0,
        registrationSource: "api-fallback",
      });
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
        // Include QR-related fields so history can render QR and bank info
        qrCodeData: req.qrCodeData,
        transferContent: req.transferContent,
        bankInfo: req.bankInfo,
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
