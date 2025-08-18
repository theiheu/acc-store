import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminPermission,
  getCurrentAdmin,
  logAdminAction,
} from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminPermission(
    request,
    "canManageCategories"
  );
  if (authError) return authError;

  try {
    const admin = await getCurrentAdmin();
    if (!admin)
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 401 }
      );

    const { id } = await context.params;
    const body = await request.json();

    console.log("API Update Category:", id, "with data:", body);

    const updated = dataStore.updateCategory(id, {
      name: body.name,
      description: body.description,
      icon: body.icon,
      featuredProductIds: Array.isArray(body.featuredProductIds)
        ? (body.featuredProductIds as string[])
        : undefined,
      isActive: body.isActive,
    });

    console.log(
      "API Update Category result:",
      updated ? "SUCCESS" : "FAILED",
      updated?.name
    );

    if (!updated)
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );

    // Optionally assign selected products to this category
    if (
      Array.isArray(body.featuredProductIds) &&
      body.featuredProductIds.length > 0
    ) {
      let assignCount = 0;
      for (const pid of body.featuredProductIds as string[]) {
        const updatedProduct = dataStore.updateProduct(
          pid,
          { category: updated.slug },
          admin.id,
          admin.name
        );
        if (updatedProduct) assignCount++;
      }
      console.log(
        `API Update Category: Assigned ${assignCount}/${body.featuredProductIds.length} products to category`,
        updated.slug
      );
    }

    await logAdminAction(
      admin.id,
      "update_category",
      "system",
      id,
      `Cập nhật danh mục: ${updated.name}`
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    const msg = e?.message || "Failed to update category";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminPermission(
    request,
    "canManageCategories"
  );
  if (authError) return authError;

  try {
    const admin = await getCurrentAdmin();
    if (!admin)
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 401 }
      );

    const { id } = await context.params;
    const ok = dataStore.deleteCategory(id);

    if (!ok)
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );

    await logAdminAction(
      admin.id,
      "delete_category",
      "system",
      id,
      `Xóa danh mục`
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e?.message || "Failed to delete category";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
