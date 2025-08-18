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
      // Try direct id first
      let product = dataStore.getProduct(id);
      if (!product || !product.isActive) {
        // Fallbacks: treat id as a possible slug across all active products
        const variants = [slugify(id)];
        if (id.startsWith("product-")) {
          variants.push(slugify(id.replace(/^product-/, "")));
        }
        product =
          dataStore
            .getActiveProducts()
            .find((p) => variants.includes(slugify(p.title))) || null;
      }
      if (!product || !product.isActive) {
        return NextResponse.json(
          { success: false, error: "Not found" },
          { status: 404 }
        );
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
      let product =
        dataStore
          .getActiveProducts()
          .find(
            (p) =>
              slugify(p.category) === catSlug && slugify(p.title) === targetSlug
          ) || null;

      // Fallback: if not found under the specified category, try slug-only resolution
      if (!product) {
        const actives = dataStore.getActiveProducts();
        // 1) Exact match on title slug
        product = actives.find((p) => slugify(p.title) === targetSlug) || null;
        // 2) Starts-with match
        if (!product) {
          product =
            actives.find((p) => slugify(p.title).startsWith(targetSlug)) ||
            null;
        }
        // 3) Includes match
        if (!product) {
          product =
            actives.find((p) => slugify(p.title).includes(targetSlug)) || null;
        }
        // 4) Match by description/longDescription content
        if (!product) {
          product =
            actives.find(
              (p) =>
                slugify(p.description || "").includes(targetSlug) ||
                slugify(p.longDescription || "").includes(targetSlug)
            ) || null;
        }
      }

      if (!product) {
        return NextResponse.json(
          { success: false, error: "Not found" },
          { status: 404 }
        );
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

    if (slugParam && !categoryParam) {
      // Resolve by slug only (no category)
      const targetSlug = slugify(slugParam);
      const actives = dataStore.getActiveProducts();

      // 1) Exact match on title slug
      let product =
        actives.find((p) => slugify(p.title) === targetSlug) || null;

      // 2) Starts-with match (e.g., "tiktok" -> "tiktok-starter")
      if (!product) {
        product =
          actives.find((p) => slugify(p.title).startsWith(targetSlug)) || null;
      }

      // 3) Includes match as last resort
      if (!product) {
        product =
          actives.find((p) => slugify(p.title).includes(targetSlug)) || null;
      }

      if (!product) {
        return NextResponse.json(
          { success: false, error: "Not found" },
          { status: 404 }
        );
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
      { success: false, error: "Missing id or (category & slug) or slug" },
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
