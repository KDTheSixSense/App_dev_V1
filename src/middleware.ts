
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export { default } from "next-auth/middleware";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const session = await getToken({ req, secret });
  const { pathname } = req.nextUrl;

  // Group related paths
  const groupAdminPath = /^\/group\/[^/]+\/admin/;
  const groupMemberPath = /^\/group\/[^/]+\/member/;
  const groupSettingsPath = /^\/group\/[^/]+\/settings/;

  // Check for admin pages
  if (
    pathname.startsWith("/admin-audit") ||
    pathname.startsWith("/event/admin/create_event")
  ) {
    if (!session || !session.isAdmin) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  // Check for group admin pages
  if (
    groupAdminPath.test(pathname) ||
    pathname.startsWith("/group/coding-page") ||
    pathname.startsWith("/group/select-page")
  ) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  // Check for group member pages
  if (groupMemberPath.test(pathname) || groupSettingsPath.test(pathname)) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin-audit",
    "/event/admin/create_event",
    "/group/:path*/admin",
    "/group/:path*/member",
    "/group/:path*/settings",
    "/group/coding-page/:path*",
    "/group/select-page/:path*",
  ],
};
