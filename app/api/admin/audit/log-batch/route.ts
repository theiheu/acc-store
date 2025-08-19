import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";

export async function POST(request: NextRequest) {
  // Check admin permission
  const authResult = await requireAdminPermission(request, "canAccessAuditLogs");
  if (authResult instanceof NextResponse) return authResult;
  
  const admin = authResult;

  try {
    const { actions } = await request.json();

    // Validate input
    if (!Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Actions must be a non-empty array",
        },
        { status: 400 }
      );
    }

    // Validate each action
    for (const action of actions) {
      if (!action.action || !action.targetType || !action.description) {
        return NextResponse.json(
          {
            success: false,
            error: "Each action must have: action, targetType, description",
          },
          { status: 400 }
        );
      }
    }

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log all activities
    const logEntries = actions.map(actionData => {
      return dataStore.logActivity({
        adminId: admin.id,
        adminName: admin.name,
        action: actionData.action,
        targetType: actionData.targetType,
        targetId: actionData.targetId,
        description: actionData.description,
        metadata: {
          ...actionData.metadata,
          ipAddress: clientIP,
          userAgent,
        },
        ipAddress: clientIP,
        userAgent,
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        count: logEntries.length,
        entries: logEntries.map(entry => ({
          id: entry.id,
          timestamp: entry.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Batch audit log error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to log batch audit actions",
      },
      { status: 500 }
    );
  }
}
