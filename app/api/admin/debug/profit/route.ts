import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";
import { ORDER_STATUS } from "@/src/core/constants";
import { format, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canViewAnalytics");
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);

    // Get raw order data
    const allOrders = dataStore.getAllOrders();
    const ordersInRange = allOrders.filter(
      order => 
        order.createdAt >= startDate && 
        order.createdAt <= endDate
    );

    const completedOrders = ordersInRange.filter(
      order => order.status === ORDER_STATUS.COMPLETED
    );

    // Calculate basic metrics
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Get products for cost calculation
    const products = dataStore.getProducts();
    const productMap = new Map(products.map(p => [p.id, p]));

    // Calculate costs
    let totalCosts = 0;
    const costBreakdown = completedOrders.map(order => {
      const product = productMap.get(order.productId);
      let unitCost = 0;
      
      if (product) {
        if (order.selectedOptionId && product.options) {
          const selectedOption = product.options.find(opt => opt.id === order.selectedOptionId);
          if (selectedOption) {
            unitCost = selectedOption.basePrice || (selectedOption.price * 0.7);
          }
        } else if (product.price) {
          unitCost = product.price * 0.7;
        }
      }
      
      const orderCost = unitCost * order.quantity;
      totalCosts += orderCost;
      
      return {
        orderId: order.id,
        productId: order.productId,
        productTitle: product?.title || 'Unknown',
        quantity: order.quantity,
        revenue: order.totalAmount,
        unitCost,
        totalCost: orderCost,
        profit: order.totalAmount - orderCost,
      };
    });

    // Get profit analysis from data store
    const profitAnalysis = dataStore.getProfitAnalysis(startDate, endDate);

    // Get expenses
    const expenses = dataStore.getExpenses(undefined, startDate, endDate);

    return NextResponse.json({
      success: true,
      debug: {
        period: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          days,
        },
        rawData: {
          totalOrders: allOrders.length,
          ordersInRange: ordersInRange.length,
          completedOrders: completedOrders.length,
          totalRevenue,
          totalCosts,
          calculatedProfit: totalRevenue - totalCosts,
          profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0,
        },
        orderBreakdown: costBreakdown.slice(0, 10), // First 10 orders
        profitAnalysis: {
          revenue: profitAnalysis.revenue,
          costs: profitAnalysis.costs,
          profit: profitAnalysis.profit,
        },
        expenses: {
          count: expenses.length,
          total: expenses.reduce((sum, e) => sum + e.amount, 0),
          byCategory: expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
          }, {} as Record<string, number>),
        },
        validation: {
          revenueMatch: Math.abs(profitAnalysis.revenue.total - totalRevenue) < 0.01,
          hasValidStructure: !!(profitAnalysis.revenue && profitAnalysis.costs && profitAnalysis.profit),
        },
      },
    });
  } catch (error) {
    console.error("Debug profit error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to debug profit calculations",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
