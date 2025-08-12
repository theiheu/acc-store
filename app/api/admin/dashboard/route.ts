import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import { DashboardStats, ActivityLog } from "@/src/core/admin";
import { products } from "@/src/core/products";

// Mock data - in a real app, this would come from database queries
const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalUsers: 1247,
  activeUsers: 892, // Users active in last 30 days
  totalProducts: products.length,
  activeProducts: products.filter(p => p.isActive !== false).length,
  totalOrders: 3456,
  pendingOrders: 23,
  totalRevenue: 125000000, // 125M VND
  monthlyRevenue: 15000000, // 15M VND this month
  averageOrderValue: 36000, // 36K VND
  topSellingProducts: [
    {
      productId: "premium",
      productTitle: "Gói Tài Khoản Premium",
      salesCount: 456,
      revenue: 22344000,
    },
    {
      productId: "gaming-bundle",
      productTitle: "Gói Gaming Bundle",
      salesCount: 234,
      revenue: 11700000,
    },
    {
      productId: "facebook",
      productTitle: "Tài khoản Facebook",
      salesCount: 189,
      revenue: 7371000,
    },
  ],
  recentActivity: [
    {
      id: "activity-1",
      adminId: "admin-1",
      adminName: "Admin User",
      action: "Thêm sản phẩm mới",
      targetType: "product",
      targetId: "new-product-1",
      description: "Đã thêm sản phẩm 'Tài khoản Discord Nitro'",
      createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    },
    {
      id: "activity-2",
      adminId: "admin-1",
      adminName: "Admin User",
      action: "Cập nhật trạng thái người dùng",
      targetType: "user",
      targetId: "user-123",
      description: "Đã kích hoạt lại tài khoản user@example.com",
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: "activity-3",
      adminId: "admin-1",
      adminName: "Admin User",
      action: "Nạp tiền cho người dùng",
      targetType: "user",
      targetId: "user-456",
      description: "Đã nạp 100,000 VND cho user2@example.com",
      createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    },
    {
      id: "activity-4",
      adminId: "admin-1",
      adminName: "Admin User",
      action: "Cập nhật kho hàng",
      targetType: "product",
      targetId: "premium",
      description: "Đã cập nhật số lượng tồn kho cho 'Gói Tài Khoản Premium'",
      createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    },
    {
      id: "activity-5",
      adminId: "admin-1",
      adminName: "Admin User",
      action: "Xử lý đơn hàng",
      targetType: "order",
      targetId: "order-789",
      description: "Đã hoàn thành đơn hàng #789",
      createdAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    },
  ],
};

export async function GET(request: NextRequest) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canViewAnalytics");
  if (authError) return authError;

  try {
    // In a real app, you would:
    // 1. Query database for user statistics
    // 2. Query database for product statistics
    // 3. Query database for order statistics
    // 4. Calculate revenue metrics
    // 5. Get recent activity logs

    return NextResponse.json({
      success: true,
      data: MOCK_DASHBOARD_STATS,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard statistics",
      },
      { status: 500 }
    );
  }
}

// Get revenue data for charts
export async function POST(request: NextRequest) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canViewAnalytics");
  if (authError) return authError;

  try {
    const { type, days = 30 } = await request.json();

    // Mock revenue data for the last N days
    const revenueData = [];
    const userGrowthData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Mock revenue data with some variation
      const baseRevenue = 500000 + Math.random() * 200000;
      const baseOrders = 15 + Math.floor(Math.random() * 10);
      const baseNewUsers = 5 + Math.floor(Math.random() * 15);
      
      revenueData.push({
        date: dateStr,
        revenue: Math.floor(baseRevenue),
        orders: baseOrders,
      });
      
      userGrowthData.push({
        date: dateStr,
        newUsers: baseNewUsers,
        totalUsers: 1200 + i * 2, // Growing total
      });
    }

    const responseData = type === "revenue" ? revenueData : userGrowthData;

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Chart data error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch chart data",
      },
      { status: 500 }
    );
  }
}
