import { NextResponse, NextRequest } from "next/server";

function isUUIDLike(id: string): boolean {
  // Very light heuristic: our ids are like product-<timestamp>-<random>
  return /^product-/.test(id);
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname, origin } = url;

  // Normalize Vietnamese alias to canonical /products
  if (pathname === "/san-pham") {
    const to = new URL("/products" + (url.search || ""), req.url);
    return NextResponse.redirect(to, 301);
  }
  if (pathname.startsWith("/san-pham/")) {
    const rest = pathname.replace("/san-pham/", "");
    const to = new URL("/products/" + rest + (url.search || ""), req.url);
    return NextResponse.redirect(to, 301);
  }

  if (pathname.startsWith("/products/")) {
    const parts = pathname.split("/").filter(Boolean); // ["products", ...]
    const after = parts.slice(1);

    // Case A: /products/:id -> redirect to canonical slug URL (301)
    if (after.length === 1) {
      const id = after[0];
      if (isUUIDLike(id)) {
        try {
          const res = await fetch(
            `${origin}/api/products/resolve?id=${encodeURIComponent(id)}`,
            { cache: "no-store" }
          );
          if (res.ok) {
            const json = await res.json();
            if (json?.success && json?.data?.category && json?.data?.slug) {
              const canonical = `/products/${encodeURIComponent(
                json.data.category
              )}/${encodeURIComponent(json.data.slug)}`;
              return NextResponse.redirect(new URL(canonical, req.url), 301);
            }
          }
        } catch {}
      }
      return NextResponse.next();
    }

    // Case B: /products/:category/:slug -> rewrite to /products/:id
    if (after.length >= 2) {
      const [category, slug] = after;
      // Ignore if second segment looks like our id to avoid loops
      if (!isUUIDLike(slug)) {
        try {
          const res = await fetch(
            `${origin}/api/products/resolve?category=${encodeURIComponent(
              category
            )}&slug=${encodeURIComponent(slug)}`,
            { cache: "no-store" }
          );
          if (res.ok) {
            const json = await res.json();
            if (json?.success && json?.data?.id) {
              const rewriteTo = new URL(
                `/products/${json.data.id}` + (url.search || ""),
                req.url
              );
              return NextResponse.rewrite(rewriteTo);
            }
          }
        } catch {}
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/products/:path*", "/san-pham/:path*"],
};
