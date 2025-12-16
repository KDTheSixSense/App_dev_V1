import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { detectThreatType } from "@/lib/waf";

export { default } from "next-auth/middleware";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const session = await getToken({ req, secret });
  const { pathname, searchParams } = req.nextUrl;

  // --- WAF Check (SQL Injection / XSS / Path Traversal) ---
  // 1. Check Pathname (e.g. traversal, SQLi in path params)
  const pathThreat = detectThreatType(pathname);
  if (pathThreat) {
    console.warn(`[WAF] Blocked request to ${pathname}. Threat: ${pathThreat} in pathname`);
    return new NextResponse(
      JSON.stringify({ error: "Request blocked by WAF", reason: pathThreat }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Check all query parameters
  for (const [key, value] of searchParams.entries()) {
    const threat = detectThreatType(value);
    if (threat) {
      console.warn(`[WAF] Blocked request to ${pathname}. Threat: ${threat} in param '${key}'`);
      return new NextResponse(
        JSON.stringify({ error: "Request blocked by WAF", reason: threat }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Check for admin pages
  if (
    pathname.startsWith("/admin-audit") ||
    pathname.startsWith("/event/admin/create_event")
  ) {
    if (!session || !session.isAdmin) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  // NOTE: Group pages are protected by Layouts (IronSession), not Middleware (NextAuth).
  // Calls to /group/... are allowed to pass through here to reach the Layout check,
  // preventing the "redirect to login -> redirect to home" loop caused by NextAuth mismatch.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin-audit",
    "/event/admin/create_event",
    // Match group paths to enforce WAF checks, but Auth skips them above.
    "/group/:path*/admin",
    "/group/:path*/member",
    "/group/:path*/settings",
    "/group/coding-page/:path*",
    "/group/select-page/:path*",
  ],
};
