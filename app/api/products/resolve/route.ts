import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/src/core/data-store";
import { slugify } from "@/src/utils/slug";

// GET /api/products/resolve
// Query params:
// - id: product id -> returns { id, category, slug }
// - OR category + slug -> returns { id, category, slug }
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const categoryParam = searchParams.get("category");
    const slugParam = searchParams.get("slug");

    if (id) {
      const product = dataStore.getProduct(id);
      if (!product || !product.isActive) {
        return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: {
          id: product.id,
          category: product.category,
          slug: slugify(product.title),
        },
      });
    }

    if (categoryParam && slugParam) {
      const catSlug = slugify(categoryParam);
      const targetSlug = slugify(slugParam);
      const product = dataStore
        .getActiveProducts()
        .find((p) => slugify(p.category) === catSlug && slugify(p.title) === targetSlug);
      if (!product) {
        return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: {
          id: product.id,
          category: product.category,
          slug: slugify(product.title),
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Missing id or (category & slug)" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Resolve product error:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

