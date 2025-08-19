import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canViewAnalytics");
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const days = searchParams.get("days");

    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      startDate = startOfDay(new Date(startDateParam));
      endDate = endOfDay(new Date(endDateParam));
    } else if (days) {
      endDate = endOfDay(new Date());
      startDate = startOfDay(subDays(endDate, parseInt(days) - 1));
    } else {
      // Default to last 30 days
      endDate = endOfDay(new Date());
      startDate = startOfDay(subDays(endDate, 29));
    }

    // Get comprehensive profit analysis
    const profitAnalysis = dataStore.getProfitAnalysis(startDate, endDate);

    // Check for profit alerts
    const alerts = dataStore.checkProfitAlerts(startDate, endDate);

    return NextResponse.json({
      success: true,
      data: {
        analysis: profitAnalysis,
        alerts: alerts.slice(0, 5), // Return top 5 alerts
        period: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        },
      },
    });
  } catch (error) {
    console.error("Profit analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch profit analysis",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canViewAnalytics");
  if (authError) return authError;

  try {
    const { type, startDate, endDate, productIds, campaignName, investment } = await request.json();

    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    let responseData;

    switch (type) {
      case "product_breakdown":
        if (!productIds || !Array.isArray(productIds)) {
          return NextResponse.json(
            { success: false, error: "Product IDs are required for product breakdown" },
            { status: 400 }
          );
        }
        
        responseData = productIds.map(productId => 
          dataStore.calculateProductCostBreakdown(productId, start, end)
        ).filter(Boolean);
        break;

      case "roi_analysis":
        if (!campaignName || investment === undefined) {
          return NextResponse.json(
            { success: false, error: "Campaign name and investment are required for ROI analysis" },
            { status: 400 }
          );
        }
        
        responseData = dataStore.calculateROI(campaignName, investment, start, end, productIds);
        break;

      case "profit_forecast":
        const forecastDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const assumptions = {
          revenueGrowthRate: 5, // 5% growth
          costInflationRate: 2, // 2% cost inflation
          seasonalityFactor: 1, // No seasonality adjustment
        };
        
        responseData = dataStore.generateProfitForecast(forecastDays, assumptions);
        break;

      case "margin_trends":
        const analysis = dataStore.getProfitAnalysis(start, end);
        
        // Generate daily margin data
        const dailyMargins = [];
        const currentDate = new Date(start);
        
        while (currentDate <= end) {
          const dayStart = startOfDay(new Date(currentDate));
          const dayEnd = endOfDay(new Date(currentDate));
          const dayAnalysis = dataStore.getProfitAnalysis(dayStart, dayEnd);
          
          dailyMargins.push({
            date: format(currentDate, 'yyyy-MM-dd'),
            grossMargin: dayAnalysis.profit.grossMargin,
            netMargin: dayAnalysis.profit.netMargin,
            revenue: dayAnalysis.revenue.total,
            costs: dayAnalysis.costs.total,
          });
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        responseData = dailyMargins;
        break;

      case "cost_breakdown":
        const costAnalysis = dataStore.getProfitAnalysis(start, end);
        responseData = {
          totalCosts: costAnalysis.costs.total,
          breakdown: {
            cogs: costAnalysis.costs.cogs,
            operational: costAnalysis.costs.operational,
            marketing: costAnalysis.costs.marketing,
            administrative: costAnalysis.costs.administrative,
            transactionFees: costAnalysis.costs.transactionFees,
            other: costAnalysis.costs.other,
          },
          percentages: {
            cogs: costAnalysis.costs.total > 0 ? (costAnalysis.costs.cogs / costAnalysis.costs.total) * 100 : 0,
            operational: costAnalysis.costs.total > 0 ? (costAnalysis.costs.operational / costAnalysis.costs.total) * 100 : 0,
            marketing: costAnalysis.costs.total > 0 ? (costAnalysis.costs.marketing / costAnalysis.costs.total) * 100 : 0,
            administrative: costAnalysis.costs.total > 0 ? (costAnalysis.costs.administrative / costAnalysis.costs.total) * 100 : 0,
            transactionFees: costAnalysis.costs.total > 0 ? (costAnalysis.costs.transactionFees / costAnalysis.costs.total) * 100 : 0,
            other: costAnalysis.costs.total > 0 ? (costAnalysis.costs.other / costAnalysis.costs.total) * 100 : 0,
          },
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid analysis type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      period: {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
      },
    });
  } catch (error) {
    console.error("Profit analysis POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process profit analysis request",
      },
      { status: 500 }
    );
  }
}
