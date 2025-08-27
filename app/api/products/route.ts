import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/src/core/data-store";
import { guardRateLimit } from "@/src/core/rate-limit";

// GET /api/products - Get public products for customer-facing pages
export async function GET(request: NextRequest) {
  // Public rate limit guard
  const limited = await guardRateLimit(request as any, "public");
  if (limited) return limited;

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
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (dateB !== dateA) {
        return dateB - dateA; // Newest first
      }
      return (b.soldCount || 0) - (a.soldCount || 0);
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
