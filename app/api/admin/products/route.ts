import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminPermission,
  logAdminAction,
  getCurrentAdmin,
} from "@/src/core/admin-auth";
import {
  AdminProduct,
  ProductSearchFilters,
  PaginatedResponse,
} from "@/src/core/admin";
import { dataStore } from "@/src/core/data-store";
import {
  CreateProductSchema,
  PaginationSchema,
  validateRequest,
  createValidationErrorResponse,
} from "@/src/core/validation";
import { z } from "zod";
import { guardRateLimit } from "@/src/core/rate-limit";

// GET /api/admin/products - List products with filtering and pagination
export async function GET(request: NextRequest) {
  // Rate limit for admin endpoints
  const limited = await guardRateLimit(request as any, "admin");
  if (limited) return limited;

  // Check admin permission
  const authError = await requireAdminPermission(request, "canManageProducts");
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries());
    const validation = validateRequest(
      PaginationSchema.extend({
        search: z.string().optional(),
        category: z.string().optional(),
        isActive: z.enum(["true", "false"]).optional(),
        lowStock: z.enum(["true", "false"]).optional(),
        sortBy: z.string().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }),
      queryParams
    );

    if (!validation.success) {
      return createValidationErrorResponse(
        validation.error,
        validation.details
      );
    }

    const {
      page,
      limit,
      search = "",
      category = "",
      isActive,
      lowStock,
      sortBy,
      sortOrder,
    } = validation.data;

    // Get products from data store
    let filteredProducts = dataStore.getProducts();

    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.title.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower)
      );
    }

    if (category && category !== "all") {
      filteredProducts = filteredProducts.filter(
        (product) => product.category === category
      );
    }

    if (isActive !== null && isActive !== undefined) {
      const activeFilter = isActive === "true";
      filteredProducts = filteredProducts.filter(
        (product) => product.isActive === activeFilter
      );
    }

    if (lowStock) {
      filteredProducts = filteredProducts.filter(
        (product) => product.stock < 20
      ); // Low stock threshold
    }

    // Sort products
    filteredProducts.sort((a, b) => {
      let aValue: any = a[sortBy as keyof AdminProduct];
      let bValue: any = b[sortBy as keyof AdminProduct];

      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();

      if (sortOrder === "desc") {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // Paginate
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const response: PaginatedResponse<AdminProduct> = {
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  // Rate limit for admin endpoints
  const limited = await guardRateLimit(request as any, "admin");
  if (limited) return limited;

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

    const rawData = await request.json();

    // Validate product data
    const validation = validateRequest(CreateProductSchema, rawData);
    if (!validation.success) {
      return createValidationErrorResponse(
        validation.error,
        validation.details
      );
    }

    const productData = validation.data;

    // Validate options if provided
    if (productData.options && Array.isArray(productData.options)) {
      for (const option of productData.options) {
        if (!option.label || !option.label.trim()) {
          return NextResponse.json(
            {
              success: false,
              error: "All options must have a label",
            },
            { status: 400 }
          );
        }
        if (typeof option.price !== "number" || option.price <= 0) {
          return NextResponse.json(
            {
              success: false,
              error: "All options must have a price greater than 0",
            },
            { status: 400 }
          );
        }
        if (typeof option.stock !== "number" || option.stock < 0) {
          return NextResponse.json(
            {
              success: false,
              error: "All options must have stock >= 0",
            },
            { status: 400 }
          );
        }
      }
    }

    // Check if product with same title already exists
    const existingProducts = dataStore.getProducts();
    const existingProduct = existingProducts.find(
      (product) =>
        product.title.toLowerCase() === productData.title.toLowerCase()
    );
    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Product with this title already exists",
        },
        { status: 409 }
      );
    }

    // Create new product using data store with admin info for activity logging
    const productToCreate = {
      title: productData.title,
      description: productData.description,
      price: productData.price,
      currency: productData.currency || "VND",
      imageEmoji: productData.imageEmoji,
      imageUrl: productData.imageUrl,
      badge: productData.badge,
      longDescription: productData.longDescription,
      faqs: productData.faqs || [],
      category: productData.category,
      options: productData.options || [],
      originalLink: productData.originalLink,
      stock: productData.stock || 0,
      soldCount: productData.soldCount || 0,
      isActive: productData.isActive !== false, // Default to true unless explicitly false
      createdBy: admin.id,
      lastModifiedBy: admin.id,
      supplier: productData.supplier,
    };

    console.log(
      "API Create Product: Creating product with data",
      productToCreate
    );
    const newProduct = dataStore.createProduct(
      productToCreate,
      admin.id,
      admin.name
    );
    console.log("API Create Product: Created product", {
      id: newProduct.id,
      title: newProduct.title,
      category: newProduct.category,
      isActive: newProduct.isActive,
    });

    // Verify the product appears in public products
    const publicProducts = dataStore.getPublicProducts();
    const foundInPublic = publicProducts.find((p) => p.id === newProduct.id);
    console.log(
      "API Create Product: Found in public products:",
      !!foundInPublic,
      foundInPublic?.category
    );

    // Log admin action
    await logAdminAction(
      admin.id,
      "create_product",
      "product",
      newProduct.id,
      `Created product: ${newProduct.title}`,
      { productData }
    );

    return NextResponse.json({
      success: true,
      data: newProduct,
    });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create product",
      },
      { status: 500 }
    );
  }
}
