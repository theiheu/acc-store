import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, getCurrentAdmin, logAdminAction } from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";

// DELETE /api/admin/products/[id]/permanent-delete - Permanently delete product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Check admin permission - require higher permission for permanent delete
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

    // Additional security check - only allow super admin for permanent delete
    if (admin.role !== "super_admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient permissions for permanent delete",
        },
        { status: 403 }
      );
    }

    // Check if product exists
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

    try {
      // Permanently delete product
      const deleted = dataStore.permanentlyDeleteProduct(productId, admin.id, admin.name);

      if (!deleted) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to permanently delete product",
          },
          { status: 500 }
        );
      }
    } catch (error) {
      // Handle business logic errors (e.g., related orders)
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Cannot permanently delete product",
        },
        { status: 400 }
      );
    }

    // Log admin action
    await logAdminAction(
      admin.id,
      "permanent_delete_product",
      "product",
      productId,
      `Permanently deleted product: ${product.title}`,
      { 
        deletedProduct: product,
        warning: "PERMANENT_DELETE"
      }
    );

    return NextResponse.json({
      success: true,
      message: "Sản phẩm đã được xóa vĩnh viễn",
    });
  } catch (error) {
    console.error("Permanent delete product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to permanently delete product",
      },
      { status: 500 }
    );
  }
}
