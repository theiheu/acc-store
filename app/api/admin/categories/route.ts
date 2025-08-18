import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminPermission,
  getCurrentAdmin,
  logAdminAction,
} from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";

// GET /api/admin/categories - list categories with search/pagination
export async function GET(request: NextRequest) {
  const authError = await requireAdminPermission(
    request,
    "canManageCategories"
  );
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = (searchParams.get("search") || "").toLowerCase();
    const isActiveParam = searchParams.get("isActive");

    let categories = dataStore.getCategories();

    if (search) {
      categories = categories.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.slug.toLowerCase().includes(search)
      );
    }

    if (isActiveParam === "true" || isActiveParam === "false") {
      const active = isActiveParam === "true";
      categories = categories.filter((c) => c.isActive === active);
    }

    const total = categories.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const end = start + limit;

    const pageItems = categories.slice(start, end).map((c) => ({
      ...c,
      productCount: dataStore.getProducts().filter((p) => p.category === c.slug)
        .length,
      featuredProductIds: c.featuredProductIds || [],
    }));

    return NextResponse.json({
      success: true,
      data: pageItems,
      pagination: { page, limit, total, totalPages },
    });
  } catch (e) {
    console.error("Admin categories list error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to list categories" },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories - create category
export async function POST(request: NextRequest) {
  const authError = await requireAdminPermission(
    request,
    "canManageCategories"
  );
  if (authError) return authError;

  try {
    const admin = await getCurrentAdmin();
    if (!admin)
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 401 }
      );

    const body = await request.json();
    const name = (body.name || "").trim();
    const description = (body.description || "").trim();
    const icon = (body.icon || "").trim();
    const featuredProductIds = Array.isArray(body.featuredProductIds)
      ? (body.featuredProductIds as string[])
      : [];
    const isActive = body.isActive !== false;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Tên danh mục không được trống" },
        { status: 400 }
      );
    }

    const created = dataStore.createCategory({
      name,
      description,
      icon,
      featuredProductIds,
      isActive,
    } as any);

    await logAdminAction(
      admin.id,
      "create_category",
      "system",
      created.id,
      `Tạo danh mục: ${created.name}`
    );

    return NextResponse.json({ success: true, data: created });
  } catch (e: any) {
    const msg = e?.message || "Failed to create category";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
