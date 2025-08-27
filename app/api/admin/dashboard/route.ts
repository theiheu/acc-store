import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import { DashboardStats } from "@/src/core/admin";
import { dataStore } from "@/src/core/data-store";
import { guardRateLimit } from "@/src/core/rate-limit";

export async function GET(request: NextRequest) {
  // Rate limit admin endpoint
  const limited = await guardRateLimit(request as any, "admin");
  if (limited) return limited;

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
        revenue: (product.sold || 0) * ((product as any).price ?? 0),
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
    const { type, days = 30, startDate, endDate } = await request.json();

    let responseData;

    if (startDate && endDate) {
      // Use custom date range
      const start = new Date(startDate);
      const end = new Date(endDate);

      switch (type) {
        case "revenue":
          responseData = dataStore.getRevenueData(start, end);
          break;
        case "userGrowth":
          responseData = dataStore.getUserGrowthData(start, end);
          break;
        case "conversionRate":
          responseData = dataStore.getConversionRateData(start, end);
          break;
        case "productPerformance":
          responseData = dataStore.getProductPerformanceData(start, end);
          break;
        case "topCustomers":
          responseData = dataStore.getTopCustomersData(10, start, end);
          break;
        default:
          responseData = dataStore.getRevenueData(start, end);
      }
    } else {
      // Use days from today (legacy behavior)
      switch (type) {
        case "revenue":
          responseData = dataStore.getRevenueData(days);
          break;
        case "userGrowth":
          responseData = dataStore.getUserGrowthData(days);
          break;
        case "conversionRate":
          responseData = dataStore.getConversionRateData(days);
          break;
        case "productPerformance":
          responseData = dataStore.getProductPerformanceData(days);
          break;
        case "topCustomers":
          responseData = dataStore.getTopCustomersData(10, days);
          break;
        default:
          responseData = dataStore.getRevenueData(days);
      }
    }

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
