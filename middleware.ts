import { NextResponse, NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;

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

  // Keep middleware lean to minimize edge latency
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
