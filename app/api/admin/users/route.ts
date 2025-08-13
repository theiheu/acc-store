import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminPermission,
  logAdminAction,
  getCurrentAdmin,
} from "@/src/core/admin-auth";
import {
  AdminUser,
  UserSearchFilters,
  PaginatedResponse,
  UserTransaction,
} from "@/src/core/admin";
import { dataStore } from "@/src/core/data-store";

// GET /api/admin/users - List users with filtering and pagination
export async function GET(request: NextRequest) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canManageUsers");
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") as "user" | "admin" | undefined;
    const status = searchParams.get("status") as
      | "active"
      | "suspended"
      | "banned"
      | undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Get users from data store
    let filteredUsers = dataStore.getUsers();

    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    if (role) {
      filteredUsers = filteredUsers.filter((user) => user.role === role);
    }

    if (status) {
      filteredUsers = filteredUsers.filter((user) => user.status === status);
    }

    // Sort users
    filteredUsers.sort((a, b) => {
      let aValue: any = a[sortBy as keyof AdminUser];
      let bValue: any = b[sortBy as keyof AdminUser];

      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();

      if (sortOrder === "desc") {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // Paginate
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    const response: PaginatedResponse<AdminUser> = {
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user (if needed)
export async function POST(request: NextRequest) {
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

    const userData = await request.json();

    // Validate required fields
    if (!userData.email || !userData.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and name are required",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = dataStore.getUserByEmail(userData.email);
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User with this email already exists",
        },
        { status: 409 }
      );
    }

    // Create new user using data store
    const newUser = dataStore.createUser({
      email: userData.email,
      name: userData.name,
      role: userData.role || "user",
      status: userData.status || "active",
      balance: userData.balance || 0,
      totalOrders: 0,
      totalSpent: 0,
      registrationSource: "admin",
    });

    // Log admin action
    await logAdminAction(
      admin.id,
      "create_user",
      "user",
      newUser.id,
      `Created user: ${newUser.email}`,
      { userData }
    );

    return NextResponse.json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create user",
      },
      { status: 500 }
    );
  }
}
