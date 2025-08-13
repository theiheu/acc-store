import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminPermission,
  logAdminAction,
  getCurrentAdmin,
} from "@/src/core/admin-auth";
import { AdminUser } from "@/src/core/admin";
import { dataStore } from "@/src/core/data-store";

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

    const oldUser = dataStore.getUser(userId);
    if (!oldUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Update user data using data store with admin info for activity logging
    const updatedUser = dataStore.updateUser(
      userId,
      updateData,
      admin.id,
      admin.name
    );

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

    // Delete user from data store
    const success = dataStore.deleteUser(userId);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete user",
        },
        { status: 500 }
      );
    }

    // Log admin action
    await logAdminAction(
      admin.id,
      "delete_user",
      "user",
      userId,
      `Deleted user: ${user.email}`,
      { deletedUser: user }
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
