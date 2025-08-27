import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminPermission,
  logAdminAction,
  getCurrentAdmin,
} from "@/src/core/admin-auth";
import { AdminProduct } from "@/src/core/admin";
import { dataStore } from "@/src/core/data-store";

// GET /api/admin/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canManageProducts");
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const product = dataStore.getProduct(id);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch product",
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canManageProducts");
  if (authError) return authError;

  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 401 }
      );
    }

    const { id: productId } = await context.params;
    const updateData = await request.json();

    console.log(
      "API Update Product: Updating product",
      productId,
      "with data:",
      updateData
    );

    const oldProduct = dataStore.getProduct(productId);
    if (!oldProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    // Validate price if provided
    if (updateData.price !== undefined && updateData.price <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Price must be greater than 0",
        },
        { status: 400 }
      );
    }

    // Validate stock if provided
    if (updateData.stock !== undefined && updateData.stock < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Stock cannot be negative",
        },
        { status: 400 }
      );
    }

    // Validate soldCount if provided
    if (
      updateData.soldCount !== undefined &&
      (typeof updateData.soldCount !== "number" || updateData.soldCount < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Sold count must be a non-negative number",
        },
        { status: 400 }
      );
    }

    // Update product data using data store with admin info for activity logging
    const updatedProduct = dataStore.updateProduct(
      productId,
      {
        ...updateData,
        lastModifiedBy: admin.id,
      },
      admin.id,
      admin.name
    );

    console.log("API Update Product: Updated product", {
      id: updatedProduct?.id,
      title: updatedProduct?.title,
      category: updatedProduct?.category,
      isActive: updatedProduct?.isActive,
    });

    // Verify the product appears in public products
    const publicProducts = dataStore.getPublicProducts();
    const foundInPublic = publicProducts.find((p) => p.id === productId);
    console.log(
      "API Update Product: Found in public products:",
      !!foundInPublic,
      foundInPublic?.category
    );

    // Log admin action
    await logAdminAction(
      admin.id,
      "update_product",
      "product",
      productId,
      `Updated product: ${updatedProduct.title}`,
      { oldData: oldProduct, newData: updatedProduct }
    );

    return NextResponse.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update product",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canManageProducts");
  if (authError) return authError;

  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 401 }
      );
    }

    const { id: productId } = await context.params;
    const product = dataStore.getProduct(productId);

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
      // Soft delete product using data store with admin info for activity logging
      const deleted = dataStore.deleteProduct(productId, admin.id, admin.name);

      if (!deleted) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to delete product",
          },
          { status: 500 }
        );
      }
    } catch (error) {
      // Handle business logic errors (e.g., pending orders)
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Cannot delete product",
        },
        { status: 400 }
      );
    }

    // Log admin action
    await logAdminAction(
      admin.id,
      "delete_product",
      "product",
      productId,
      `Deleted product: ${product.title}`,
      { deletedProduct: product }
    );

    return NextResponse.json({
      success: true,
      message: "Sản phẩm đã được xóa thành công",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete product",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/products/[id] - Update specific fields (like stock)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canManageProducts");
  if (authError) return authError;

  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 401 }
      );
    }

    const productId = params.id;
    const { action, value } = await request.json();

    const productIndex = MOCK_ADMIN_PRODUCTS.findIndex(
      (p) => p.id === productId
    );
    if (productIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    const product = MOCK_ADMIN_PRODUCTS[productIndex];
    let updatedProduct = { ...product };
    let actionDescription = "";

    switch (action) {
      case "toggle_active":
        updatedProduct.isActive = !product.isActive;
        actionDescription = `${
          updatedProduct.isActive ? "Activated" : "Deactivated"
        } product: ${product.title}`;
        break;

      case "update_stock":
        if (typeof value !== "number" || value < 0) {
          return NextResponse.json(
            { success: false, error: "Invalid stock value" },
            { status: 400 }
          );
        }
        updatedProduct.stock = value;
        actionDescription = `Updated stock for ${product.title} to ${value}`;
        break;

      case "adjust_stock":
        if (typeof value !== "number") {
          return NextResponse.json(
            { success: false, error: "Invalid stock adjustment value" },
            { status: 400 }
          );
        }
        const newStock = product.stock + value;
        if (newStock < 0) {
          return NextResponse.json(
            { success: false, error: "Stock cannot be negative" },
            { status: 400 }
          );
        }
        updatedProduct.stock = newStock;
        actionDescription = `Adjusted stock for ${product.title} by ${value} (new stock: ${newStock})`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    updatedProduct.updatedAt = new Date();
    updatedProduct.lastModifiedBy = admin.id;

    // In a real app, save to database
    MOCK_ADMIN_PRODUCTS[productIndex] = updatedProduct;

    // Log admin action
    await logAdminAction(
      admin.id,
      `product_${action}`,
      "product",
      productId,
      actionDescription,
      { action, value, oldData: product, newData: updatedProduct }
    );

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: actionDescription,
    });
  } catch (error) {
    console.error("Patch product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update product",
      },
      { status: 500 }
    );
  }
}
