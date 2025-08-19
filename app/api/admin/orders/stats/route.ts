import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import {
  ExtendedOrderStats,
  calculateOrderProfit,
  calculateOrdersProfit,
  getProfitMarginCategory,
} from "@/src/core/admin";
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

    // Get products for profit calculations
    const products = dataStore.getProducts();
    const productsMap = new Map(products.map((p) => [p.id, p]));

    // Calculate profit metrics for completed orders
    const { totalProfit, totalCosts, averageMargin } = calculateOrdersProfit(
      completedOrdersData,
      productsMap
    );

    // Calculate today's profit
    const todayProfitData = calculateOrdersProfit(
      todayCompletedOrders,
      productsMap
    );

    // Calculate weekly statistics
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyOrders = orders.filter((o) => new Date(o.createdAt) >= weekAgo);
    const weeklyCompletedOrders = weeklyOrders.filter(
      (o) => o.status === ORDER_STATUS.COMPLETED
    );
    const weeklyRevenue = weeklyCompletedOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );
    const weeklyProfitData = calculateOrdersProfit(
      weeklyCompletedOrders,
      productsMap
    );

    // Calculate monthly statistics
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyOrders = orders.filter(
      (o) => new Date(o.createdAt) >= monthAgo
    );
    const monthlyCompletedOrders = monthlyOrders.filter(
      (o) => o.status === ORDER_STATUS.COMPLETED
    );
    const monthlyRevenue = monthlyCompletedOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );
    const monthlyProfitData = calculateOrdersProfit(
      monthlyCompletedOrders,
      productsMap
    );

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

    // Calculate top products by order count, revenue, and profit
    const productOrderCounts = new Map<string, number>();
    const productRevenue = new Map<string, number>();
    const productProfit = new Map<string, number>();
    const productCosts = new Map<string, number>();

    orders.forEach((order) => {
      productOrderCounts.set(
        order.productId,
        (productOrderCounts.get(order.productId) || 0) + 1
      );

      if (order.status === ORDER_STATUS.COMPLETED) {
        const product = productsMap.get(order.productId);
        const { profit, cost } = calculateOrderProfit(order, product);

        productRevenue.set(
          order.productId,
          (productRevenue.get(order.productId) || 0) + order.totalAmount
        );
        productProfit.set(
          order.productId,
          (productProfit.get(order.productId) || 0) + profit
        );
        productCosts.set(
          order.productId,
          (productCosts.get(order.productId) || 0) + cost
        );
      }
    });

    const topProductsByOrders = Array.from(productOrderCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([productId, orderCount]) => {
        const product = productsMap.get(productId);
        const revenue = productRevenue.get(productId) || 0;
        const profit = productProfit.get(productId) || 0;
        const costs = productCosts.get(productId) || 0;
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          productId,
          productTitle: product?.title || "Unknown Product",
          orderCount,
          revenue,
          profit,
          profitMargin,
          costs,
        };
      });

    const topProductsByRevenue = Array.from(productRevenue.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([productId, revenue]) => {
        const product = productsMap.get(productId);
        const profit = productProfit.get(productId) || 0;
        const costs = productCosts.get(productId) || 0;
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          productId,
          productTitle: product?.title || "Unknown Product",
          orderCount: productOrderCounts.get(productId) || 0,
          revenue,
          profit,
          profitMargin,
          costs,
        };
      });

    const topProductsByProfit = Array.from(productProfit.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([productId, profit]) => {
        const product = productsMap.get(productId);
        const revenue = productRevenue.get(productId) || 0;
        const costs = productCosts.get(productId) || 0;
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          productId,
          productTitle: product?.title || "Unknown Product",
          orderCount: productOrderCounts.get(productId) || 0,
          revenue,
          profit,
          profitMargin,
          costs,
        };
      });

    // Calculate daily order trends (last 30 days) with profit
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

      const dayCompletedOrders = dayOrders.filter(
        (o) => o.status === ORDER_STATUS.COMPLETED
      );

      const dayRevenue = dayCompletedOrders.reduce(
        (sum, o) => sum + o.totalAmount,
        0
      );

      const dayProfitData = calculateOrdersProfit(
        dayCompletedOrders,
        productsMap
      );

      dailyTrends.push({
        date: dateStart.toISOString().split("T")[0],
        orders: dayOrders.length,
        revenue: dayRevenue,
        profit: dayProfitData.totalProfit,
        costs: dayProfitData.totalCosts,
        completed: dayCompletedOrders.length,
        profitMargin: dayProfitData.averageMargin,
      });
    }

    // Calculate profit distribution
    const profitDistribution = {
      highMargin: { count: 0, percentage: 0 },
      mediumMargin: { count: 0, percentage: 0 },
      lowMargin: { count: 0, percentage: 0 },
      negative: { count: 0, percentage: 0 },
    };

    completedOrdersData.forEach((order) => {
      const product = productsMap.get(order.productId);
      const { margin } = calculateOrderProfit(order, product);
      const category = getProfitMarginCategory(margin);

      switch (category) {
        case "high":
          profitDistribution.highMargin.count++;
          break;
        case "medium":
          profitDistribution.mediumMargin.count++;
          break;
        case "low":
          profitDistribution.lowMargin.count++;
          break;
        case "negative":
          profitDistribution.negative.count++;
          break;
      }
    });

    // Calculate percentages
    const totalCompletedOrders = completedOrdersData.length;
    if (totalCompletedOrders > 0) {
      profitDistribution.highMargin.percentage =
        (profitDistribution.highMargin.count / totalCompletedOrders) * 100;
      profitDistribution.mediumMargin.percentage =
        (profitDistribution.mediumMargin.count / totalCompletedOrders) * 100;
      profitDistribution.lowMargin.percentage =
        (profitDistribution.lowMargin.count / totalCompletedOrders) * 100;
      profitDistribution.negative.percentage =
        (profitDistribution.negative.count / totalCompletedOrders) * 100;
    }

    const stats: ExtendedOrderStats = {
      // Basic order stats
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

      // Profit metrics
      totalProfit,
      averageProfit: completedOrders > 0 ? totalProfit / completedOrders : 0,
      todayProfit: todayProfitData.totalProfit,
      profitMargin: averageMargin,
      totalCosts,

      // Extended metrics
      weekly: {
        orders: weeklyOrders.length,
        revenue: weeklyRevenue,
        profit: weeklyProfitData.totalProfit,
        costs: weeklyProfitData.totalCosts,
      },
      monthly: {
        orders: monthlyOrders.length,
        revenue: monthlyRevenue,
        profit: monthlyProfitData.totalProfit,
        costs: monthlyProfitData.totalCosts,
      },
      statusDistribution,
      topProductsByOrders,
      topProductsByRevenue,
      topProductsByProfit,
      dailyTrends,
      profitDistribution,
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
