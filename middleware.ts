import { NextResponse, type NextRequest } from "next/server";

/**
 * A coarse gate only. Middleware runs on the edge and cannot reach the
 * database, so it just checks whether a session cookie is present and
 * bounces obvious anonymous traffic away from /admin.
 *
 * Real authorization happens in the admin layout via requireAdmin(), which
 * validates the session against the database. Never rely on this file alone.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  const hasSession = request.cookies.has("mello_session");
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
