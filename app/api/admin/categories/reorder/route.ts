import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, getCurrentAdmin, logAdminAction } from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";

// PUT /api/admin/categories/reorder
// Body: { orderedIds: string[] }
export async function PUT(request: NextRequest) {
  const authError = await requireAdminPermission(request, "canManageCategories");
  if (authError) return authError;

  try {
    const admin = await getCurrentAdmin();
    if (!admin)
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 401 }
      );

    const body = await request.json();
    const orderedIds: string[] = Array.isArray(body?.orderedIds)
      ? body.orderedIds
      : [];

    if (!orderedIds || orderedIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Danh sách sắp xếp không hợp lệ" },
        { status: 400 }
      );
    }

    // Perform reorder
    const updated = dataStore.reorderCategories(orderedIds);

    await logAdminAction(
      admin.id,
      "reorder_categories",
      "system",
      "categories",
      `Sắp xếp lại ${updated.length} danh mục`
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    const msg = e?.message || "Failed to reorder categories";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

