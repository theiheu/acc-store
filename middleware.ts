import { NextResponse, NextRequest } from "next/server";
import {
  adminRateLimit,
  publicRateLimit,
  authRateLimit,
  paymentRateLimit,
  getClientIP,
  checkRateLimit,
  createRateLimitResponse,
} from "./src/core/rate-limit";

function isUUIDLike(id: string): boolean {
  // Very light heuristic: our ids are like product-<timestamp>-<random>
  return /^product-/.test(id);
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname, origin } = url;

  // Rate limiting for API routes (temporarily disabled for development)
  // TODO: Re-enable after fixing edge runtime compatibility
  /*
  if (pathname.startsWith("/api")) {
    const clientIP = getClientIP(req);
    let rateLimit;
    let identifier = clientIP;

    if (pathname.startsWith("/api/admin")) {
      rateLimit = adminRateLimit;
      identifier = `admin_${clientIP}`;
    } else if (pathname.startsWith("/api/auth") || pathname.includes("login")) {
      rateLimit = authRateLimit;
      identifier = `auth_${clientIP}`;
    } else if (
      pathname.startsWith("/api/payment") ||
      pathname.startsWith("/api/topup")
    ) {
      rateLimit = paymentRateLimit;
      identifier = `payment_${clientIP}`;
    } else {
      rateLimit = publicRateLimit;
      identifier = `public_${clientIP}`;
    }

    const result = await checkRateLimit(rateLimit, identifier);

    if (!result.success) {
      console.warn(`Rate limit exceeded for ${identifier} on ${pathname}`);
      return createRateLimitResponse(
        result.limit,
        result.remaining,
        result.reset
      );
    }
  }
  */

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

    // Case A: /products/:single  (id or slug)
    if (after.length === 1) {
      const single = after[0];
      if (isUUIDLike(single)) {
        // /products/:id -> redirect to canonical slug URL (301)
        try {
          const res = await fetch(
            `${origin}/api/products/resolve?id=${encodeURIComponent(single)}`,
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
        return NextResponse.next();
      } else {
        // /products/:slug-only -> rewrite to /products/:id if resolvable
        try {
          const res = await fetch(
            `${origin}/api/products/resolve?slug=${encodeURIComponent(single)}`,
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
        return NextResponse.next();
      }
    }

    // Case B: /products/:category/:slug -> rewrite to /products/:id
    if (after.length >= 2) {
      const [category, slug] = after;
      console.log("Middleware: Processing category/slug:", category, slug); // Debug log

      // Ignore if second segment looks like our id to avoid loops
      if (!isUUIDLike(slug)) {
        try {
          const res = await fetch(
            `${origin}/api/products/resolve?category=${encodeURIComponent(
              category
            )}&slug=${encodeURIComponent(slug)}`,
            { cache: "no-store" }
          );
          console.log("Middleware resolve response:", res.status); // Debug log

          if (res.ok) {
            const json = await res.json();
            console.log("Middleware resolve data:", json); // Debug log

            if (json?.success && json?.data?.id) {
              const rewriteTo = new URL(
                `/products/${json.data.id}` + (url.search || ""),
                req.url
              );
              console.log("Middleware rewriting to:", rewriteTo.pathname); // Debug log
              return NextResponse.rewrite(rewriteTo);
            }
          }
        } catch (error) {
          console.error("Middleware error:", error); // Debug log
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
