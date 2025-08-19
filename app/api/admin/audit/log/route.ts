import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";

export async function POST(request: NextRequest) {
  // Check admin permission
  const authResult = await requireAdminPermission(request, "canAccessAuditLogs");
  if (authResult instanceof NextResponse) return authResult;
  
  const admin = authResult;

  try {
    const { action, targetType, targetId, description, metadata } = await request.json();

    // Validate required fields
    if (!action || !targetType || !description) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: action, targetType, description",
        },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log the activity using data store
    const logEntry = dataStore.logActivity({
      adminId: admin.id,
      adminName: admin.name,
      action,
      targetType,
      targetId,
      description,
      metadata: {
        ...metadata,
        ipAddress: clientIP,
        userAgent,
      },
      ipAddress: clientIP,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: logEntry.id,
        timestamp: logEntry.createdAt,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to log audit action",
      },
      { status: 500 }
    );
  }
}
