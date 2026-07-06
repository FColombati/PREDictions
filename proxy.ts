import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.ruolo === "ADMIN";

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isProtectedRoute =
    isAdminRoute ||
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/storico") ||
    nextUrl.pathname.startsWith("/profilo") ||
    nextUrl.pathname.startsWith("/partite");

  if (isAdminRoute && isLoggedIn && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
