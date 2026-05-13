import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";

const PROTECTED = ["/dashboard", "/api/downloads", "/api/orders"];

export function middleware(req: NextRequest) {
  const isProtected = PROTECTED.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const authHeader = req.headers.get("authorization") ?? "";
  const cookieToken = req.cookies.get("access_token")?.value;
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : cookieToken;

  if (!token) {
    return req.nextUrl.pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const payload = verifyAccessToken(token);
    const headers = new Headers(req.headers);
    headers.set("x-user-id", payload.sub);
    headers.set("x-user-role", payload.role);
    return NextResponse.next({ request: { headers } });
  } catch {
    return req.nextUrl.pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Token expired" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/downloads/:path*", "/api/orders/:path*"],
};
