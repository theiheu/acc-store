import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, logAdminAction, getCurrentAdmin } from "@/src/core/admin-auth";
import { AdminUser } from "@/src/core/admin";

// Mock user data - same as in route.ts
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

// GET /api/admin/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canManageUsers");
  if (authError) return authError;

  try {
    const userId = params.id;
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

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user",
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
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
    const updateData = await request.json();

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

    const oldUser = { ...MOCK_USERS[userIndex] };
    
    // Update user data
    const updatedUser: AdminUser = {
      ...MOCK_USERS[userIndex],
      ...updateData,
      updatedAt: new Date(),
    };

    // In a real app, save to database
    MOCK_USERS[userIndex] = updatedUser;

    // Log admin action
    await logAdminAction(
      admin.id,
      "update_user",
      "user",
      userId,
      `Updated user: ${updatedUser.email}`,
      { oldData: oldUser, newData: updatedUser }
    );

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
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

    const deletedUser = MOCK_USERS[userIndex];
    
    // In a real app, you might want to soft delete or archive instead
    MOCK_USERS.splice(userIndex, 1);

    // Log admin action
    await logAdminAction(
      admin.id,
      "delete_user",
      "user",
      userId,
      `Deleted user: ${deletedUser.email}`,
      { deletedUser }
    );

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete user",
      },
      { status: 500 }
    );
  }
}
