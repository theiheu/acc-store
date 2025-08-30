import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";

// Node APIs only on server
const __isServer = typeof window === "undefined";
let fs: any = null as any;
let path: any = null as any;
if (__isServer) {
  const __req = eval("require");
  fs = __req("fs");
  path = __req("path");
}

export const runtime = "nodejs";

const MAX_SIZE = 1_000_000; // 1MB
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/webp",
]);

function sanitizeFileName(name: string) {
  // remove path separators and spaces, keep letters numbers dashes underscores dots
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "").slice(-100) || "icon";
  const parts = base.split(".");
  const ext = parts.length > 1 ? parts.pop() : "png";
  const stem = parts.join(".") || "icon";
  const ts = Date.now();
  return `${ts}-${stem}.${ext}`;
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminPermission(
    request,
    "canManageCategories"
  );
  if (authError) return authError;

  try {
    if (!__isServer) throw new Error("Server runtime required");

    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy tệp tải lên" },
        { status: 400 }
      );
    }

    const blob = file as unknown as Blob;
    const type = (blob as any).type as string | undefined;
    const size = (blob as any).size as number | undefined;

    if (!type || !ALLOWED_MIME.has(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Định dạng không được hỗ trợ (PNG, JPG, SVG, WebP)",
        },
        { status: 400 }
      );
    }

    if (!size || size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Kích thước tệp vượt quá 1MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await blob.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // Ensure directory
    const publicDir = path.join(process.cwd(), "public");
    const uploadDir = path.join(publicDir, "uploads", "category-icons");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Unique sanitized filename
    const orig = (file as any).name || `icon.${type.split("/").pop()}`;
    // If we can compress (sharp available) and not SVG, convert to webp to reduce size
    let ext = (orig.split(".").pop() || "png").toLowerCase();
    let baseName = orig.replace(/\.[^.]*$/, "");
    let outputName: string;

    try {
      if (type !== "image/svg+xml") {
        const sharp = eval("require")("sharp");
        const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
        buffer = webpBuffer;
        ext = "webp";
      }
    } catch {
      // sharp not available; keep original buffer and extension
    }

    const safeName = sanitizeFileName(`${baseName}.${ext}`.toLowerCase());
    const filePath = path.join(uploadDir, safeName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/category-icons/${safeName}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (e: any) {
    const msg = e?.message || "Upload thất bại";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
