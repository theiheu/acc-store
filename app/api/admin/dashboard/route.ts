import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import { DashboardStats, ActivityLog } from "@/src/core/admin";
import { dataStore } from "@/src/core/data-store";

export async function GET(request: NextRequest) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canViewAnalytics");
  if (authError) return authError;

  try {
    // Get real-time statistics from data store
    const stats = dataStore.getStats();
    const products = dataStore.getProducts();

    // Calculate top selling products
    const topSellingProducts = products
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 3)
      .map((product) => ({
        productId: product.id,
        productTitle: product.title,
        salesCount: product.sold || 0,
        revenue: (product.sold || 0) * product.price,
      }));

    // Get real activity data from data store
    const recentActivity = dataStore.getRecentActivity(10);

    const dashboardStats: DashboardStats = {
      ...stats,
      topSellingProducts,
      recentActivity,
    };

    return NextResponse.json({
      success: true,
      data: dashboardStats,
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

    // Get real data from data store
    const responseData =
      type === "revenue"
        ? dataStore.getRevenueData(days)
        : dataStore.getUserGrowthData(days);

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
