import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { User, UserRole } from "./auth";
import {
  AdminProfile,
  AdminPermissions,
  DEFAULT_ADMIN_PERMISSIONS,
} from "./admin";

// Mock admin data - in a real app, this would come from a database
const MOCK_ADMINS: AdminProfile[] = [
  {
    id: "admin-1",
    email: "acevn236@gmail.com", // Replace with your email
    name: "Fi Acc",
    role: "admin",
    permissions: DEFAULT_ADMIN_PERMISSIONS,
    createdAt: new Date("2024-01-01"),
    lastLoginAt: new Date(),
    isActive: true,
  },
];

// Helper function to check if user is admin
export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}

// Helper function to get admin profile
export function getAdminProfile(userId: string): AdminProfile | null {
  return MOCK_ADMINS.find((admin) => admin.id === userId) || null;
}

// Helper function to check admin permissions
export function hasAdminPermission(
  admin: AdminProfile | null,
  permission: keyof AdminPermissions
): boolean {
  if (!admin || !admin.isActive) return false;
  return admin.permissions[permission];
}

// Middleware function to protect admin routes
export async function requireAdmin(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // In a real app, you would fetch user data from database
    // For now, we'll check if the email matches our mock admin
    const isAdminUser = MOCK_ADMINS.some(
      (admin) => admin.email === session.user?.email && admin.isActive
    );

    if (!isAdminUser) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    return null; // Allow request to continue
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication error" },
      { status: 500 }
    );
  }
}

// Middleware function to check specific admin permissions
export async function requireAdminPermission(
  request: NextRequest,
  permission: keyof AdminPermissions
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const admin = MOCK_ADMINS.find(
      (admin) => admin.email === session.user?.email && admin.isActive
    );

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    if (!hasAdminPermission(admin, permission)) {
      return NextResponse.json(
        { success: false, error: `Permission '${permission}' required` },
        { status: 403 }
      );
    }

    return null; // Allow request to continue
  } catch (error) {
    console.error("Admin permission middleware error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication error" },
      { status: 500 }
    );
  }
}

// Client-side hook to check admin status
export function useAdminAuth() {
  // This would typically use the session data
  // For now, we'll return a mock implementation
  return {
    isAdmin: false, // This should be determined from session
    adminProfile: null as AdminProfile | null,
    hasPermission: (permission: keyof AdminPermissions) => false,
    loading: false,
  };
}

// Helper function to get current admin from session
export async function getCurrentAdmin(): Promise<AdminProfile | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return null;
    }

    const admin = MOCK_ADMINS.find(
      (admin) => admin.email === session.user?.email && admin.isActive
    );

    return admin || null;
  } catch (error) {
    console.error("Get current admin error:", error);
    return null;
  }
}

// Helper function to log admin actions
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType:
    | "user"
    | "product"
    | "order"
    | "system"
    | "topup-request"
    | "analytics"
    | "report",
  targetId?: string,
  description?: string,
  metadata?: Record<string, any>
) {
  // In a real app, this would save to database
  console.log("Admin action logged:", {
    adminId,
    action,
    targetType,
    targetId,
    description,
    metadata,
    timestamp: new Date().toISOString(),
  });
}

// Helper function to validate admin session on client side
export function validateAdminSession(
  user: any
): user is User & { role: "admin" } {
  return user && user.role === "admin";
}

// Mock function to simulate checking if email is admin
// In a real app, this would query the database
export function isEmailAdmin(email: string): boolean {
  return MOCK_ADMINS.some((admin) => admin.email === email && admin.isActive);
}

// Helper to create admin user object from session
export function createAdminUserFromSession(session: any): User | null {
  if (!session?.user?.email) return null;

  const admin = MOCK_ADMINS.find(
    (admin) => admin.email === session.user.email && admin.isActive
  );

  if (!admin) return null;

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: "admin",
    status: "active",
    balance: 0, // Admins don't have balance
    createdAt: admin.createdAt,
    updatedAt: new Date(),
    lastLoginAt: admin.lastLoginAt,
  };
}
