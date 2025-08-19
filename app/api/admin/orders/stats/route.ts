import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import { OrderStats } from "@/src/core/admin";
import { dataStore } from "@/src/core/data-store";
import { ORDER_STATUS } from "@/src/core/constants";

// GET /api/admin/orders/stats - Get order statistics
export async function GET(request: NextRequest) {
  const authError = await requireAdminPermission(request, "canViewAnalytics");
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);

    // Parse date range filters
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined;
    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : undefined;

    // Get all orders
    let orders = dataStore.getAllOrders();

    // Apply date filters if provided
    if (dateFrom) {
      orders = orders.filter((order) => new Date(order.createdAt) >= dateFrom);
    }
    if (dateTo) {
      orders = orders.filter((order) => new Date(order.createdAt) <= dateTo);
    }

    // Calculate basic statistics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (o) => o.status === ORDER_STATUS.PENDING
    ).length;
    const processingOrders = orders.filter(
      (o) => o.status === ORDER_STATUS.PROCESSING
    ).length;
    const completedOrders = orders.filter(
      (o) => o.status === ORDER_STATUS.COMPLETED
    ).length;
    const cancelledOrders = orders.filter(
      (o) => o.status === ORDER_STATUS.CANCELLED
    ).length;
    const refundedOrders = orders.filter(
      (o) => o.status === ORDER_STATUS.REFUNDED
    ).length;

    // Calculate revenue (only from completed orders)
    const completedOrdersData = orders.filter(
      (o) => o.status === ORDER_STATUS.COMPLETED
    );
    const totalRevenue = completedOrdersData.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );
    const averageOrderValue =
      totalOrders > 0
        ? orders.reduce((sum, o) => sum + o.totalAmount, 0) / totalOrders
        : 0;

    // Calculate today's statistics
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt) >= todayStart
    );
    const todayCompletedOrders = todayOrders.filter(
      (o) => o.status === ORDER_STATUS.COMPLETED
    );
    const todayRevenue = todayCompletedOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );

    // Calculate conversion rate
    const conversionRate =
      totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Calculate weekly statistics
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyOrders = orders.filter((o) => new Date(o.createdAt) >= weekAgo);
    const weeklyRevenue = weeklyOrders
      .filter((o) => o.status === ORDER_STATUS.COMPLETED)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Calculate monthly statistics
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyOrders = orders.filter(
      (o) => new Date(o.createdAt) >= monthAgo
    );
    const monthlyRevenue = monthlyOrders
      .filter((o) => o.status === ORDER_STATUS.COMPLETED)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Calculate status distribution
    const statusDistribution = {
      pending: {
        count: pendingOrders,
        percentage: totalOrders > 0 ? (pendingOrders / totalOrders) * 100 : 0,
      },
      processing: {
        count: processingOrders,
        percentage:
          totalOrders > 0 ? (processingOrders / totalOrders) * 100 : 0,
      },
      completed: {
        count: completedOrders,
        percentage: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      },
      cancelled: {
        count: cancelledOrders,
        percentage: totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0,
      },
      refunded: {
        count: refundedOrders,
        percentage: totalOrders > 0 ? (refundedOrders / totalOrders) * 100 : 0,
      },
    };

    // Calculate top products by order count
    const productOrderCounts = new Map<string, number>();
    const productRevenue = new Map<string, number>();

    orders.forEach((order) => {
      productOrderCounts.set(
        order.productId,
        (productOrderCounts.get(order.productId) || 0) + 1
      );
      if (order.status === ORDER_STATUS.COMPLETED) {
        productRevenue.set(
          order.productId,
          (productRevenue.get(order.productId) || 0) + order.totalAmount
        );
      }
    });

    // Get product details for top products
    const allProducts = dataStore.getProducts();
    const productsMap = new Map(allProducts.map((p) => [p.id, p]));

    const topProductsByOrders = Array.from(productOrderCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([productId, orderCount]) => {
        const product = productsMap.get(productId);
        return {
          productId,
          productTitle: product?.title || "Unknown Product",
          orderCount,
          revenue: productRevenue.get(productId) || 0,
        };
      });

    const topProductsByRevenue = Array.from(productRevenue.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([productId, revenue]) => {
        const product = productsMap.get(productId);
        return {
          productId,
          productTitle: product?.title || "Unknown Product",
          orderCount: productOrderCounts.get(productId) || 0,
          revenue,
        };
      });

    // Calculate daily order trends (last 30 days)
    const dailyTrends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const dateEnd = new Date(dateStart.getTime() + 24 * 60 * 60 * 1000);

      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= dateStart && orderDate < dateEnd;
      });

      const dayRevenue = dayOrders
        .filter((o) => o.status === ORDER_STATUS.COMPLETED)
        .reduce((sum, o) => sum + o.totalAmount, 0);

      dailyTrends.push({
        date: dateStart.toISOString().split("T")[0],
        orders: dayOrders.length,
        revenue: dayRevenue,
        completed: dayOrders.filter((o) => o.status === ORDER_STATUS.COMPLETED)
          .length,
      });
    }

    const stats: OrderStats & {
      weekly: { orders: number; revenue: number };
      monthly: { orders: number; revenue: number };
      statusDistribution: typeof statusDistribution;
      topProductsByOrders: typeof topProductsByOrders;
      topProductsByRevenue: typeof topProductsByRevenue;
      dailyTrends: typeof dailyTrends;
    } = {
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      refundedOrders,
      totalRevenue,
      averageOrderValue,
      todayOrders: todayOrders.length,
      todayRevenue,
      conversionRate,
      weekly: {
        orders: weeklyOrders.length,
        revenue: weeklyRevenue,
      },
      monthly: {
        orders: monthlyOrders.length,
        revenue: monthlyRevenue,
      },
      statusDistribution,
      topProductsByOrders,
      topProductsByRevenue,
      dailyTrends,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Admin order stats error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi tải thống kê đơn hàng" },
      { status: 500 }
    );
  }
}
