import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_ROUTES,
  PUBLIC_ROUTES,
  REDIRECT_IF_NOT_AUTH,
} from "@/lib/router";

const matchesRoute = (pathname: string, routes: string[]) => {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
};

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  // Presence flag cookie set by the client after a successful sign-in.
  // The actual bearer token lives in localStorage; this cookie only exists
  // so edge middleware can redirect before the protected page renders.
  const hasSession = request.cookies.get("has_session")?.value;
  const isLoggedIn = Boolean(hasSession);

  const isPublicRoute = checkPublicRoute(pathname);
  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Always allow auth routes.
  // Redirecting away from them based only on cookie presence is unsafe,
  // because a stale cookie can exist after the user has already been banned.
  if (isAuthRoute) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const signInUrl = new URL(REDIRECT_IF_NOT_AUTH, nextUrl);
    signInUrl.searchParams.set("redirect", `${pathname}${nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

export function checkPublicRoute(pathname: string): boolean {
  return matchesRoute(pathname, PUBLIC_ROUTES);
}