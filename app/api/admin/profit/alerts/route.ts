import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";

export async function GET(request: NextRequest) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canViewAnalytics");
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = searchParams.get("limit");

    let alerts = dataStore.getProfitAlerts(unreadOnly);

    if (limit) {
      alerts = alerts.slice(0, parseInt(limit));
    }

    // Get summary statistics
    const allAlerts = dataStore.getProfitAlerts(false);
    const summary = {
      total: allAlerts.length,
      unread: allAlerts.filter(alert => !alert.isRead).length,
      critical: allAlerts.filter(alert => alert.severity === "critical").length,
      high: allAlerts.filter(alert => alert.severity === "high").length,
      medium: allAlerts.filter(alert => alert.severity === "medium").length,
      low: allAlerts.filter(alert => alert.severity === "low").length,
      unresolved: allAlerts.filter(alert => !alert.isResolved).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        summary,
      },
    });
  } catch (error) {
    console.error("Get profit alerts error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch profit alerts",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check admin permission
  const authResult = await requireAdminPermission(request, "canViewAnalytics");
  if (authResult instanceof NextResponse) return authResult;
  
  const admin = authResult;

  try {
    const { action, alertId, startDate, endDate } = await request.json();

    switch (action) {
      case "mark_read":
        if (!alertId) {
          return NextResponse.json(
            { success: false, error: "Alert ID is required" },
            { status: 400 }
          );
        }

        const marked = dataStore.markAlertAsRead(alertId);
        if (!marked) {
          return NextResponse.json(
            { success: false, error: "Alert not found" },
            { status: 404 }
          );
        }

        // Log the activity
        dataStore.logActivity({
          adminId: admin.id,
          adminName: admin.name,
          action: "mark_alert_read",
          targetType: "system",
          targetId: alertId,
          description: "Đánh dấu cảnh báo lợi nhuận đã đọc",
        });

        return NextResponse.json({
          success: true,
          message: "Alert marked as read",
        });

      case "resolve":
        if (!alertId) {
          return NextResponse.json(
            { success: false, error: "Alert ID is required" },
            { status: 400 }
          );
        }

        const resolved = dataStore.resolveAlert(alertId);
        if (!resolved) {
          return NextResponse.json(
            { success: false, error: "Alert not found" },
            { status: 404 }
          );
        }

        // Log the activity
        dataStore.logActivity({
          adminId: admin.id,
          adminName: admin.name,
          action: "resolve_alert",
          targetType: "system",
          targetId: alertId,
          description: "Giải quyết cảnh báo lợi nhuận",
        });

        return NextResponse.json({
          success: true,
          message: "Alert resolved",
        });

      case "check_new":
        if (!startDate || !endDate) {
          return NextResponse.json(
            { success: false, error: "Start date and end date are required" },
            { status: 400 }
          );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const newAlerts = dataStore.checkProfitAlerts(start, end);

        // Log the activity
        dataStore.logActivity({
          adminId: admin.id,
          adminName: admin.name,
          action: "check_profit_alerts",
          targetType: "system",
          description: `Kiểm tra cảnh báo lợi nhuận từ ${start.toLocaleDateString('vi-VN')} đến ${end.toLocaleDateString('vi-VN')}`,
          metadata: {
            alertsFound: newAlerts.length,
            period: { startDate, endDate },
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            newAlerts,
            count: newAlerts.length,
          },
        });

      case "bulk_mark_read":
        const { alertIds } = await request.json();
        if (!Array.isArray(alertIds)) {
          return NextResponse.json(
            { success: false, error: "Alert IDs array is required" },
            { status: 400 }
          );
        }

        let markedCount = 0;
        alertIds.forEach(id => {
          if (dataStore.markAlertAsRead(id)) {
            markedCount++;
          }
        });

        // Log the activity
        dataStore.logActivity({
          adminId: admin.id,
          adminName: admin.name,
          action: "bulk_mark_alerts_read",
          targetType: "system",
          description: `Đánh dấu ${markedCount} cảnh báo lợi nhuận đã đọc`,
          metadata: {
            alertIds,
            markedCount,
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            markedCount,
            total: alertIds.length,
          },
        });

      case "bulk_resolve":
        const { alertIds: resolveIds } = await request.json();
        if (!Array.isArray(resolveIds)) {
          return NextResponse.json(
            { success: false, error: "Alert IDs array is required" },
            { status: 400 }
          );
        }

        let resolvedCount = 0;
        resolveIds.forEach(id => {
          if (dataStore.resolveAlert(id)) {
            resolvedCount++;
          }
        });

        // Log the activity
        dataStore.logActivity({
          adminId: admin.id,
          adminName: admin.name,
          action: "bulk_resolve_alerts",
          targetType: "system",
          description: `Giải quyết ${resolvedCount} cảnh báo lợi nhuận`,
          metadata: {
            alertIds: resolveIds,
            resolvedCount,
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            resolvedCount,
            total: resolveIds.length,
          },
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Profit alerts POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process profit alerts request",
      },
      { status: 500 }
    );
  }
}
