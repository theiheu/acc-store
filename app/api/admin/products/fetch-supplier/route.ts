import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import { TapHoaMMOClient } from "@/src/services/taphoammo";

// POST /api/admin/products/fetch-supplier
// Body: { kioskToken: string }
// Returns: { success: boolean, data?: { items: Array<{ name: string; stock: number; basePrice: number }> }, error?: string }
export async function POST(request: NextRequest) {
  // Only admins with product permission can use this endpoint
  const authError = await requireAdminPermission(request, "canManageProducts");
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({} as any));
    const kioskToken = (body?.kioskToken || "").trim();
    if (!kioskToken) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập TAPHOAMMO_KIOSK_TOKEN" },
        { status: 400 }
      );
    }

    let client: TapHoaMMOClient;
    try {
      client = new TapHoaMMOClient({ kioskToken });
    } catch (e: any) {
      return NextResponse.json(
        { success: false, error: "Thiếu cấu hình kết nối nhà cung cấp (USER_TOKEN/KIOSK_TOKEN)" },
        { status: 500 }
      );
    }

    const resp = await client.getStock();
    if (!resp) {
      return NextResponse.json(
        { success: false, error: "Không thể lấy dữ liệu từ TAPHOAMMO" },
        { status: 502 }
      );
    }

    const list = Array.isArray(resp) ? resp : [resp as any];
    const items = list
      .map((it: any) => ({
        name: String(it?.name || "Sản phẩm"),
        stock: Number(it?.stock ?? 0) || 0,
        basePrice: Number(it?.price ?? 0) || 0,
      }))
      // Filter out invalid entries
      .filter((x) => x.name && Number.isFinite(x.stock) && Number.isFinite(x.basePrice));

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Không có dữ liệu sản phẩm hợp lệ từ TAPHOAMMO" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { items } });
  } catch (error: any) {
    console.error("fetch-supplier error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi lấy dữ liệu nhà cung cấp" },
      { status: 500 }
    );
  }
}

