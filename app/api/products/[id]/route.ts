import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/src/core/data-store";

// GET /api/products/[id] - Get single public product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Get product from dataStore (includes both static and dynamic products)
    const adminProduct = dataStore.getProduct(id);

    if (!adminProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    // Only return active products for public API
    if (!adminProduct.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not available",
        },
        { status: 404 }
      );
    }

    // Convert to public product format
    const publicProduct = {
      id: adminProduct.id,
      title: adminProduct.title,
      description: adminProduct.description,
      price: adminProduct.price,
      currency: adminProduct.currency,
      imageEmoji: adminProduct.imageEmoji,
      imageUrl: adminProduct.imageUrl,
      badge: adminProduct.badge,
      longDescription: adminProduct.longDescription,
      faqs: adminProduct.faqs,
      category: adminProduct.category,
      options: adminProduct.options,
      stock: adminProduct.stock,
      sold: adminProduct.sold,
      isActive: adminProduct.isActive,
      createdAt: adminProduct.createdAt,
      updatedAt: adminProduct.updatedAt,
      createdBy: adminProduct.createdBy,
      lastModifiedBy: adminProduct.lastModifiedBy,
    };

    return new NextResponse(
      JSON.stringify({ success: true, data: publicProduct }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // Cache at CDN for 60s, allow stale for 300s
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
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
