import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, getCurrentAdmin, logAdminAction } from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";

// POST /api/admin/products/[id]/restore - Restore soft-deleted product
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canManageProducts");
  if (authError) return authError;

  try {
    const params = await context.params;
    const productId = params.id;

    // Get current admin
    const admin = await getCurrentAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 401 }
      );
    }

    // Check if product exists and is soft-deleted
    const product = dataStore.getAllProducts().find(p => p.id === productId);
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    if (!product.deletedAt) {
      return NextResponse.json(
        {
          success: false,
          error: "Product is not deleted",
        },
        { status: 400 }
      );
    }

    // Restore product
    const restoredProduct = dataStore.restoreProduct(productId, admin.id, admin.name);

    if (!restoredProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to restore product",
        },
        { status: 500 }
      );
    }

    // Log admin action
    await logAdminAction(
      admin.id,
      "restore_product",
      "product",
      productId,
      `Restored product: ${product.title}`,
      { restoredProduct }
    );

    return NextResponse.json({
      success: true,
      message: "Sản phẩm đã được khôi phục thành công",
      data: restoredProduct,
    });
  } catch (error) {
    console.error("Restore product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to restore product",
      },
      { status: 500 }
    );
  }
}
