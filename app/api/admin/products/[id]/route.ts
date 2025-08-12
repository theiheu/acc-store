import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, logAdminAction, getCurrentAdmin } from "@/src/core/admin-auth";
import { AdminProduct } from "@/src/core/admin";
import { products } from "@/src/core/products";

// Convert regular products to admin products with additional fields
const MOCK_ADMIN_PRODUCTS: AdminProduct[] = products.map((product, index) => ({
  ...product,
  stock: 50 + Math.floor(Math.random() * 100), // Random stock 50-150
  sold: Math.floor(Math.random() * 200), // Random sold count
  isActive: true,
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
  updatedAt: new Date(),
  createdBy: "admin-1",
  lastModifiedBy: "admin-1",
}));

// GET /api/admin/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canManageProducts");
  if (authError) return authError;

  try {
    const productId = params.id;
    const product = MOCK_ADMIN_PRODUCTS.find((p) => p.id === productId);

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
  { params }: { params: { id: string } }
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
    const updateData = await request.json();

    const productIndex = MOCK_ADMIN_PRODUCTS.findIndex((p) => p.id === productId);
    if (productIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    const oldProduct = { ...MOCK_ADMIN_PRODUCTS[productIndex] };
    
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

    // Update product data
    const updatedProduct: AdminProduct = {
      ...MOCK_ADMIN_PRODUCTS[productIndex],
      ...updateData,
      updatedAt: new Date(),
      lastModifiedBy: admin.id,
    };

    // In a real app, save to database
    MOCK_ADMIN_PRODUCTS[productIndex] = updatedProduct;

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
  { params }: { params: { id: string } }
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
    const productIndex = MOCK_ADMIN_PRODUCTS.findIndex((p) => p.id === productId);
    
    if (productIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    const deletedProduct = MOCK_ADMIN_PRODUCTS[productIndex];
    
    // Check if product has pending orders (in a real app)
    // For now, we'll allow deletion but log it
    
    // In a real app, you might want to soft delete instead
    MOCK_ADMIN_PRODUCTS.splice(productIndex, 1);

    // Log admin action
    await logAdminAction(
      admin.id,
      "delete_product",
      "product",
      productId,
      `Deleted product: ${deletedProduct.title}`,
      { deletedProduct }
    );

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
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
  { params }: { params: { id: string } }
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

    const productIndex = MOCK_ADMIN_PRODUCTS.findIndex((p) => p.id === productId);
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
        actionDescription = `${updatedProduct.isActive ? "Activated" : "Deactivated"} product: ${product.title}`;
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
