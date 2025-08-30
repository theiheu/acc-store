import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/src/core/data-store";
import { guardRateLimit } from "@/src/core/rate-limit";

// Public categories (active only)
export async function GET(request: NextRequest) {
  const limited = await guardRateLimit(request as any, "public");
  if (limited) return limited;
  try {
    const categories = dataStore.getActiveCategories().map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      featuredProductIds: c.featuredProductIds || [],
      sortOrder: (c as any).sortOrder ?? null,
    }));
    return new NextResponse(
      JSON.stringify({ success: true, data: categories }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // Cache at CDN for 5 minutes, allow stale for 10 minutes
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
