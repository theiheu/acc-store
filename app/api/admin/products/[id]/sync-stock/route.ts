import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminPermission,
  getCurrentAdmin,
  logAdminAction,
} from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";
import { TapHoaMMOClient } from "@/src/services/taphoammo";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminPermission(request, "canManageProducts");
  if (authError) return authError;

  try {
    const admin = await getCurrentAdmin();
    const { id } = await context.params;
    const product = dataStore.getProduct(id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );
    }

    const kiosk =
      product.supplier?.kioskToken ||
      process.env.TAPHOAMMO_KIOSK_TOKEN ||
      "5ZZJ82EG5RFJB77KET5B";
    const client = new TapHoaMMOClient({ kioskToken: kiosk });
    const resp = await client.getStock();

    let stock: number | undefined;
    let basePrice: number | undefined;
    if (Array.isArray(resp)) {
      const item = resp[0] as any;
      stock = Number(item?.stock ?? product.stock ?? 0);
      basePrice = Number(
        item?.price ?? product.supplier?.basePrice ?? product.price
      );
    } else if (resp && (resp as any).success === "true") {
      const obj = resp as any;
      stock = Number(obj.stock ?? product.stock ?? 0);
      basePrice = Number(
        obj.price ?? product.supplier?.basePrice ?? product.price
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: (resp as any)?.description || "Không lấy được tồn kho",
        },
        { status: 502 }
      );
    }

    const markup = product.supplier?.markupPercent ?? 0;
    const newPrice =
      basePrice && markup
        ? Math.round(basePrice * (1 + markup / 100))
        : product.price;

    dataStore.updateProduct(
      product.id,
      {
        stock:
          typeof stock === "number" && !Number.isNaN(stock)
            ? stock
            : product.stock,
        price:
          typeof newPrice === "number" && !Number.isNaN(newPrice)
            ? newPrice
            : product.price,
        supplier: {
          provider: "taphoammo",
          kioskToken: kiosk,
          basePrice: basePrice,
          markupPercent: markup,
          lastStock: stock,
          lastSyncedAt: new Date(),
          autoSync: product.supplier?.autoSync ?? false,
        },
      },
      admin?.id,
      admin?.name
    );

    await logAdminAction(
      admin?.id || "system",
      "product_update",
      "product",
      product.id,
      "Đồng bộ kho từ nhà cung cấp",
      { stock, basePrice }
    );

    return NextResponse.json({
      success: true,
      data: { stock, price: newPrice },
    });
  } catch (error) {
    console.error("Sync stock error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi đồng bộ kho" },
      { status: 500 }
    );
  }
}
