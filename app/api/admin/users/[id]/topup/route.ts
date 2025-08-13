import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminPermission,
  logAdminAction,
  getCurrentAdmin,
} from "@/src/core/admin-auth";
import { AdminUser, UserTransaction, UserTopUpRequest } from "@/src/core/admin";
import { dataStore } from "@/src/core/data-store";

// POST /api/admin/users/[id]/topup - Add credits to user account
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canManageUsers");
  if (authError) return authError;

  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 401 }
      );
    }

    const userId = params.id;
    const topUpData: UserTopUpRequest = await request.json();

    // Validate input
    if (!topUpData.amount || topUpData.amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount must be greater than 0",
        },
        { status: 400 }
      );
    }

    if (topUpData.amount > 10000000) {
      // Max 10M VND per transaction
      return NextResponse.json(
        {
          success: false,
          error: "Amount cannot exceed 10,000,000 VND per transaction",
        },
        { status: 400 }
      );
    }

    if (!topUpData.description || topUpData.description.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Description is required",
        },
        { status: 400 }
      );
    }

    // Find user
    const user = dataStore.getUser(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot add credits to inactive user",
        },
        { status: 400 }
      );
    }

    // Update user balance using data store with admin info for activity logging
    const oldBalance = user.balance;
    const newBalance = oldBalance + topUpData.amount;

    console.log("Updating user balance:", {
      userId,
      userEmail: user.email,
      oldBalance,
      newBalance,
      amount: topUpData.amount,
    });

    const updatedUser = dataStore.updateUser(
      userId,
      { balance: newBalance },
      admin.id,
      admin.name
    );

    console.log("User updated:", updatedUser ? "success" : "failed");

    // Create transaction record using data store
    const transaction = dataStore.createTransaction({
      userId: userId,
      type: "credit",
      amount: topUpData.amount,
      description: topUpData.description,
      adminId: admin.id,
      metadata: {
        adminNote: topUpData.adminNote,
        oldBalance,
        newBalance,
      },
    });

    console.log("Transaction created:", {
      transactionId: transaction.id,
      userId: transaction.userId,
      amount: transaction.amount,
      type: transaction.type,
    });

    // Log admin action for audit
    await logAdminAction(
      admin.id,
      "user_credit_add",
      "user",
      userId,
      `Added ${topUpData.amount.toLocaleString("vi-VN")} VND to ${user.email}`,
      {
        amount: topUpData.amount,
        oldBalance,
        newBalance,
        description: topUpData.description,
        adminNote: topUpData.adminNote,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        transaction,
        message: `Successfully added ${topUpData.amount.toLocaleString(
          "vi-VN"
        )} VND to user account`,
      },
    });
  } catch (error) {
    console.error("User top-up error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add credits to user account",
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/users/[id]/topup - Get user's transaction history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canManageUsers");
  if (authError) return authError;

  try {
    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Find user using data store
    const user = dataStore.getUser(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Get user's transactions from data store
    const userTransactions = dataStore.getUserTransactions(userId);

    // Paginate
    const total = userTransactions.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = userTransactions.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get user transactions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user transactions",
      },
      { status: 500 }
    );
  }
}
