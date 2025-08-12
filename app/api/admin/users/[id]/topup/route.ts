import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, logAdminAction, getCurrentAdmin } from "@/src/core/admin-auth";
import { AdminUser, UserTransaction, UserTopUpRequest } from "@/src/core/admin";

// Mock user data - same as in other files
const MOCK_USERS: AdminUser[] = [
  {
    id: "user-1",
    email: "user1@example.com",
    name: "Nguyễn Văn A",
    role: "user",
    status: "active",
    balance: 150000,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    lastLoginAt: new Date("2024-01-20"),
    totalOrders: 5,
    totalSpent: 245000,
    registrationSource: "google",
  },
  {
    id: "user-2",
    email: "user2@example.com",
    name: "Trần Thị B",
    role: "user",
    status: "active",
    balance: 75000,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
    lastLoginAt: new Date("2024-01-18"),
    totalOrders: 3,
    totalSpent: 180000,
    registrationSource: "facebook",
  },
  {
    id: "user-3",
    email: "user3@example.com",
    name: "Lê Văn C",
    role: "user",
    status: "suspended",
    balance: 0,
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-16"),
    lastLoginAt: new Date("2024-01-15"),
    totalOrders: 1,
    totalSpent: 49000,
    registrationSource: "google",
  },
];

// Mock transactions storage
const MOCK_TRANSACTIONS: UserTransaction[] = [];

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

    if (topUpData.amount > 10000000) { // Max 10M VND per transaction
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
    const userIndex = MOCK_USERS.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const user = MOCK_USERS[userIndex];

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

    // Update user balance
    const oldBalance = user.balance;
    const newBalance = oldBalance + topUpData.amount;
    
    MOCK_USERS[userIndex] = {
      ...user,
      balance: newBalance,
      updatedAt: new Date(),
    };

    // Create transaction record
    const transaction: UserTransaction = {
      id: `tx-${Date.now()}`,
      userId: userId,
      type: "credit",
      amount: topUpData.amount,
      description: topUpData.description,
      adminId: admin.id,
      createdAt: new Date(),
      metadata: {
        adminNote: topUpData.adminNote,
        oldBalance,
        newBalance,
      },
    };

    // In a real app, save transaction to database
    MOCK_TRANSACTIONS.push(transaction);

    // Log admin action for audit
    await logAdminAction(
      admin.id,
      "user_credit_add",
      "user",
      userId,
      `Added ${topUpData.amount.toLocaleString('vi-VN')} VND to ${user.email}`,
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
        user: MOCK_USERS[userIndex],
        transaction,
        message: `Successfully added ${topUpData.amount.toLocaleString('vi-VN')} VND to user account`,
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

    // Find user
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Get user's transactions
    const userTransactions = MOCK_TRANSACTIONS
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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
