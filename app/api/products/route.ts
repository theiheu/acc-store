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

    console.log("API /products: Total products:", products.length);
    console.log("API /products: Category filter:", category);
    console.log(
      "API /products: Products by category:",
      products.map((p) => ({ id: p.id, title: p.title, category: p.category }))
    );

    // Apply filters
    if (category && category !== "all") {
      products = products.filter((product) => product.category === category);
      console.log(
        "API /products: After category filter:",
        products.length,
        "products"
      );
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
        return dateB - dateA; // Newest first
      }

      // Then by sold count (highest first)
      return (b.sold || 0) - (a.sold || 0);
    });

    return new NextResponse(JSON.stringify({ success: true, data: products }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Cache at CDN for 60s, allow stale for 300s
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
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
