import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import { validateProfitCalculations } from "@/src/utils/profitValidation";
import { format, subDays } from "date-fns";

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
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else if (days) {
      endDate = new Date();
      startDate = subDays(endDate, parseInt(days) - 1);
    } else {
      // Default to last 30 days
      endDate = new Date();
      startDate = subDays(endDate, 29);
    }

    // Validate profit calculations
    const validationResult = validateProfitCalculations(startDate, endDate);

    return NextResponse.json({
      success: true,
      data: {
        validation: validationResult,
        period: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
        },
      },
    });
  } catch (error) {
    console.error("Profit validation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to validate profit calculations",
      },
      { status: 500 }
    );
  }
}
