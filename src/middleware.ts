import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("stwd_session")?.value;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot-password");
  const isProtectedPage = pathname.startsWith("/runs") || pathname.startsWith("/approvals") || pathname.startsWith("/projects") || pathname.startsWith("/onboarding");

  // Redirect unauthenticated users from protected pages to /login
  if (isProtectedPage && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages to /runs
  if (isAuthPage && sessionToken) {
    return NextResponse.redirect(new URL("/runs", request.url));
  }

  // Root redirect
  if (pathname === "/") {
    if (sessionToken) {
      return NextResponse.redirect(new URL("/runs", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/runs/:path*",
    "/approvals/:path*",
    "/projects/:path*",
    "/onboarding",
  ],
};
