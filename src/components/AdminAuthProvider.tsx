"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { AdminProfile, AdminPermissions } from "@/src/core/admin";
import { isEmailAdmin } from "@/src/core/admin-auth";

interface AdminAuthContextType {
  isAdmin: boolean;
  adminProfile: AdminProfile | null;
  hasPermission: (permission: keyof AdminPermissions) => boolean;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const { data: session, status } = useSession();
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (!session?.user?.email) {
      setAdminProfile(null);
      setLoading(false);
      return;
    }

    // Check if user is admin
    const isAdminUser = isEmailAdmin(session.user.email);

    if (isAdminUser) {
      // In a real app, fetch admin profile from API
      // For now, create a mock profile
      const mockAdminProfile: AdminProfile = {
        id: "admin-1",
        email: session.user.email,
        name: session.user.name || "Admin User",
        role: "admin",
        permissions: {
          canManageUsers: true,
          canManageProducts: true,
          canManageCategories: true,
          canManageOrders: true,
          canViewAnalytics: true,
          canManageAdmins: false,
          canAccessAuditLogs: true,
          canPerformBulkOperations: true,
        },
        createdAt: new Date("2024-01-01"),
        lastLoginAt: new Date(),
        isActive: true,
      };
      setAdminProfile(mockAdminProfile);
    } else {
      setAdminProfile(null);
    }

    setLoading(false);
  }, [session, status]);

  const hasPermission = (permission: keyof AdminPermissions): boolean => {
    if (!adminProfile || !adminProfile.isActive) return false;
    return adminProfile.permissions[permission];
  };

  const value: AdminAuthContextType = {
    isAdmin: !!adminProfile,
    adminProfile,
    hasPermission,
    loading,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  // Fallback to non-admin defaults when provider is not present (public pages)
  if (!context) {
    return {
      isAdmin: false,
      adminProfile: null,
      hasPermission: () => false,
      loading: false,
    };
  }
  return context;
}

// Higher-order component to protect admin routes
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AdminProtectedComponent(props: P) {
    const { isAdmin, loading } = useAdminAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Đang kiểm tra quyền truy cập...
            </p>
          </div>
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-300/10 flex items-center justify-center">
              <span className="text-2xl">🚫</span>
            </div>
            <h1 className="text-xl font-semibold mb-2">Truy cập bị từ chối</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Bạn không có quyền truy cập vào khu vực quản trị này.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-amber-300 text-gray-900 hover:bg-amber-400 rounded-lg transition-colors"
            >
              Về trang chủ
            </a>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Hook to check specific permission
export function useAdminPermission(permission: keyof AdminPermissions) {
  const { hasPermission } = useAdminAuth();
  return hasPermission(permission);
}

// Component to conditionally render based on permission
interface AdminPermissionGateProps {
  permission: keyof AdminPermissions;
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminPermissionGate({
  permission,
  children,
  fallback = null,
}: AdminPermissionGateProps) {
  const hasPermission = useAdminPermission(permission);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
