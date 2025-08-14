import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/src/core/data-store";

// GET /api/products - Get public products for customer-facing pages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";

    // Get public products from data store
    let products = dataStore.getPublicProducts();

    // Apply filters
    if (category && category !== "all") {
      products = products.filter((product) => product.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(
        (product) =>
          product.title.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          (product.longDescription &&
            product.longDescription.toLowerCase().includes(searchLower))
      );
    }

    // Sort by creation date (newest first) and then by sold count
    products.sort((a, b) => {
      // First sort by creation date (newest first)
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (dateB !== dateA) {
        return dateB - dateA;
      }

      // Then by sold count (highest first)
      return (b.sold || 0) - (a.sold || 0);
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get public products error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}
