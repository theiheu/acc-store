import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, getCurrentAdmin, logAdminAction } from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";
import { TapHoaMMOClient } from "@/src/services/taphoammo";

// POST /api/admin/products/sync - Sync product catalog/stock/prices from supplier
export async function POST(request: NextRequest) {
  const authError = await requireAdminPermission(request, "canManageProducts");
  if (authError) return authError;

  try {
    const admin = await getCurrentAdmin();
    const body = await request.json().catch(()=>({}));
    const kioskToken = body?.kioskToken || process.env.TAPHOAMMO_KIOSK_TOKEN || "5ZZJ82EG5RFJB77KET5B";
    const client = new TapHoaMMOClient({ kioskToken });

    const resp = await client.getStock();
    if (!resp) {
      return NextResponse.json({ success: false, error: "Không thể lấy dữ liệu kho" }, { status: 502 });
    }

    // For simplicity, if array, create/update first one; real impl would map by product name
    const items = Array.isArray(resp) ? resp : [resp as any];

    const updated: any[] = [];
    for (const it of items) {
      const name = (it as any).name || "Sản phẩm từ TapHoaMMO";
      const stock = Number((it as any).stock || 0);
      const basePrice = Number((it as any).price || 0);
      // Find by title match
      const existing = dataStore.getProducts().find((p) => p.title === name);
      const markup = existing?.supplier?.markupPercent ?? 10;
      const price = basePrice ? Math.round(basePrice * (1 + markup / 100)) : existing?.price || 0;
      if (existing) {
        dataStore.updateProduct(existing.id, {
          stock,
          price,
          supplier: {
            provider: "taphoammo",
            kioskToken,
            basePrice,
            markupPercent: markup,
            lastStock: stock,
            lastSyncedAt: new Date(),
            autoSync: existing.supplier?.autoSync ?? false,
          },
        }, admin?.id, admin?.name);
        updated.push({ id: existing.id, name, stock, price });
      } else {
        const created = dataStore.createProduct({
          id: undefined as any, // ignored by dataStore
          title: name,
          description: "Đồng bộ từ nhà cung cấp",
          longDescription: "",
          price,
          currency: "VND",
          category: "gaming",
          imageEmoji: "📦",
          imageUrl: "",
          badge: "new",
          stock,
          sold: 0,
          isActive: true,
          createdBy: admin?.id || "system",
          lastModifiedBy: admin?.id || "system",
          supplier: {
            provider: "taphoammo",
            kioskToken,
            basePrice,
            markupPercent: markup,
            lastStock: stock,
            lastSyncedAt: new Date(),
            autoSync: false,
          },
        } as any, admin?.id, admin?.name);
        updated.push({ id: created.id, name, stock, price });
      }
    }

    await logAdminAction(admin?.id || "system", "product_update", "product", undefined, "Đồng bộ sản phẩm", { count: updated.length });

    return NextResponse.json({ success: true, data: { updated } });
  } catch (error) {
    console.error("Admin sync products error:", error);
    return NextResponse.json({ success: false, error: "Có lỗi xảy ra khi đồng bộ" }, { status: 500 });
  }
}

