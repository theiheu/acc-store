import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";

export async function POST(request: NextRequest) {
  // Check admin permission
  const authResult = await requireAdminPermission(request, "canViewAnalytics");
  if (authResult instanceof NextResponse) return authResult;
  
  const admin = authResult;

  try {
    const { 
      forecastPeriodDays, 
      assumptions = {
        revenueGrowthRate: 5,
        costInflationRate: 2,
        seasonalityFactor: 1,
      }
    } = await request.json();

    // Validate input
    if (!forecastPeriodDays || typeof forecastPeriodDays !== 'number' || forecastPeriodDays <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid forecast period in days is required",
        },
        { status: 400 }
      );
    }

    if (forecastPeriodDays > 365) {
      return NextResponse.json(
        {
          success: false,
          error: "Forecast period cannot exceed 365 days",
        },
        { status: 400 }
      );
    }

    // Validate assumptions
    const validatedAssumptions = {
      revenueGrowthRate: typeof assumptions.revenueGrowthRate === 'number' ? assumptions.revenueGrowthRate : 5,
      costInflationRate: typeof assumptions.costInflationRate === 'number' ? assumptions.costInflationRate : 2,
      seasonalityFactor: typeof assumptions.seasonalityFactor === 'number' ? assumptions.seasonalityFactor : 1,
    };

    // Ensure reasonable bounds for assumptions
    validatedAssumptions.revenueGrowthRate = Math.max(-50, Math.min(100, validatedAssumptions.revenueGrowthRate));
    validatedAssumptions.costInflationRate = Math.max(-20, Math.min(50, validatedAssumptions.costInflationRate));
    validatedAssumptions.seasonalityFactor = Math.max(0.1, Math.min(3, validatedAssumptions.seasonalityFactor));

    // Generate forecast
    const forecast = dataStore.generateProfitForecast(forecastPeriodDays, validatedAssumptions);

    // Calculate additional metrics
    const additionalMetrics = {
      breakEvenPoint: forecast.forecast.costs > 0 
        ? Math.ceil(forecast.forecast.costs / (forecast.forecast.revenue / forecastPeriodDays))
        : 0,
      profitPerDay: forecast.forecast.netProfit / forecastPeriodDays,
      marginImprovement: forecast.scenarios.optimistic.margin - forecast.scenarios.realistic.margin,
      riskFactor: (forecast.scenarios.realistic.margin - forecast.scenarios.pessimistic.margin) / forecast.scenarios.realistic.margin * 100,
    };

    // Generate recommendations based on forecast
    const recommendations = [];
    
    if (forecast.scenarios.realistic.margin < 10) {
      recommendations.push({
        type: "warning",
        title: "Tỷ suất lợi nhuận thấp",
        description: "Tỷ suất lợi nhuận dự báo dưới 10%. Cần xem xét tối ưu hóa chi phí hoặc tăng giá bán.",
        priority: "high",
      });
    }

    if (forecast.scenarios.pessimistic.profit < 0) {
      recommendations.push({
        type: "critical",
        title: "Nguy cơ lỗ trong kịch bản xấu",
        description: "Trong kịch bản xấu nhất, doanh nghiệp có thể bị lỗ. Cần có kế hoạch dự phòng.",
        priority: "critical",
      });
    }

    if (validatedAssumptions.revenueGrowthRate < 0) {
      recommendations.push({
        type: "info",
        title: "Doanh thu giảm",
        description: "Dự báo doanh thu giảm. Cần xem xét các chiến lược marketing và bán hàng mới.",
        priority: "medium",
      });
    }

    if (additionalMetrics.riskFactor > 50) {
      recommendations.push({
        type: "warning",
        title: "Độ rủi ro cao",
        description: "Biến động lợi nhuận giữa các kịch bản lớn. Cần đa dạng hóa nguồn thu.",
        priority: "medium",
      });
    }

    // Log the activity
    dataStore.logActivity({
      adminId: admin.id,
      adminName: admin.name,
      action: "generate_profit_forecast",
      targetType: "analytics",
      description: `Tạo dự báo lợi nhuận ${forecastPeriodDays} ngày`,
      metadata: {
        forecastPeriodDays,
        assumptions: validatedAssumptions,
        forecastRevenue: forecast.forecast.revenue,
        forecastProfit: forecast.forecast.netProfit,
        confidence: forecast.forecast.confidence,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        forecast,
        additionalMetrics,
        recommendations,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: admin.name,
          assumptions: validatedAssumptions,
          forecastPeriodDays,
        },
      },
    });
  } catch (error) {
    console.error("Profit forecast error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate profit forecast",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canViewAnalytics");
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days") || "30";
    const revenueGrowth = searchParams.get("revenueGrowth") || "5";
    const costInflation = searchParams.get("costInflation") || "2";
    const seasonality = searchParams.get("seasonality") || "1";

    const forecastPeriodDays = parseInt(days);
    const assumptions = {
      revenueGrowthRate: parseFloat(revenueGrowth),
      costInflationRate: parseFloat(costInflation),
      seasonalityFactor: parseFloat(seasonality),
    };

    // Validate and generate quick forecast
    if (forecastPeriodDays <= 0 || forecastPeriodDays > 365) {
      return NextResponse.json(
        {
          success: false,
          error: "Forecast period must be between 1 and 365 days",
        },
        { status: 400 }
      );
    }

    const forecast = dataStore.generateProfitForecast(forecastPeriodDays, assumptions);

    return NextResponse.json({
      success: true,
      data: {
        forecast,
        summary: {
          period: `${forecastPeriodDays} ngày`,
          expectedRevenue: forecast.forecast.revenue,
          expectedProfit: forecast.forecast.netProfit,
          expectedMargin: ((forecast.forecast.netProfit / forecast.forecast.revenue) * 100).toFixed(1) + '%',
          confidence: forecast.forecast.confidence + '%',
        },
      },
    });
  } catch (error) {
    console.error("Get profit forecast error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch profit forecast",
      },
      { status: 500 }
    );
  }
}
