import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { dataStore } from "@/src/core/data-store";

export const runtime = "edge";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const category = dataStore.getCategoryBySlug(slug);

  if (!category) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0f172a",
            color: "#e2e8f0",
            fontSize: 48,
          }}
        >
          Danh mục không tồn tại
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: "linear-gradient(135deg, #fffbeb 0%, #fde68a 100%)",
          padding: 64,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#111827",
            marginBottom: 8,
          }}
        >
          {category.icon || "🏷️"} {category.name}
        </div>
        <div style={{ fontSize: 28, color: "#374151" }}>
          {category.description || "Khám phá các sản phẩm chất lượng"}
        </div>
        <div style={{ marginTop: 16, fontSize: 20, color: "#92400e" }}>
          {process.env.NEXT_PUBLIC_SITE_NAME || "Web bán acc"}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

