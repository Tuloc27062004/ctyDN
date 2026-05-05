import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ONE_HOUR = 60 * 60;

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const search = req.nextUrl.search;

  const isAdminPage = pathname.startsWith("/admin");

  if (!isAdminPage) {
    return NextResponse.next();
  }

  const isSecure = req.nextUrl.protocol === "https:";
  const cookieKey = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: isSecure,
    cookieName: cookieKey,
    salt: cookieKey,
  });

  console.log("[MIDDLEWARE] admin page check", {
    pathname,
    hasToken: !!token,
    cookieNames: req.cookies.getAll().map((c) => c.name),
    cookieKey,
    token: token
      ? {
          sub: token.sub,
          email: token.email,
          role: token.role,
          status: token.status,
          isActive: token.isActive,
          authTime: token.authTime,
        }
      : null,
  });

  if (!token) {
    console.log("[MIDDLEWARE] no token -> redirect login", {
      pathname,
      cookieNames: req.cookies.getAll().map((c) => c.name),
      cookieKey,
    });

    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const role = typeof token.role === "string" ? token.role : undefined;
  const status = typeof token.status === "string" ? token.status : undefined;
  const isActive = token.isActive === true;
  const authTime =
    typeof token.authTime === "number" ? token.authTime : undefined;

  const now = Math.floor(Date.now() / 1000);
  const requiresReauth =
    typeof authTime !== "number" || now - authTime >= ONE_HOUR;

  const badRole = role !== "ADMIN";
  const badStatus = status !== "ACCEPTED" && status !== "VERIFIED";
  const inactive = !isActive;

  console.log("[MIDDLEWARE] page auth result", {
    pathname,
    role,
    status,
    isActive,
    authTime,
    now,
    badRole,
    badStatus,
    inactive,
    requiresReauth,
  });

  if (badRole || badStatus || inactive || requiresReauth) {
    console.log("[MIDDLEWARE] blocked admin page", {
      pathname,
      badRole,
      badStatus,
      inactive,
      requiresReauth,
    });

    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    loginUrl.searchParams.set(
      "error",
      requiresReauth ? "session_expired" : "forbidden"
    );
    return NextResponse.redirect(loginUrl);
  }

  console.log("[MIDDLEWARE] allow admin page", { pathname });

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};