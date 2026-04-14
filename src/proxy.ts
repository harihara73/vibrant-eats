import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAuthPage = nextUrl.pathname.startsWith("/admin/login");
  const isAdminPage = nextUrl.pathname.startsWith("/admin");
  const isDeliveryPage = nextUrl.pathname.startsWith("/delivery");
  const userRole = (req.auth?.user as any)?.role;

  // Redirect to login if accessing protected pages and NOT logged in
  if (!isLoggedIn && (isAdminPage || isDeliveryPage) && !isAuthPage) {
    return Response.redirect(new URL("/admin/login", nextUrl));
  }

  // If already logged in and on login page, redirect to respective dashboard
  if (isAuthPage && isLoggedIn) {
    if (userRole === "admin") return Response.redirect(new URL("/admin/dashboard", nextUrl));
    if (userRole === "delivery") return Response.redirect(new URL("/delivery", nextUrl));
  }

  // Cross-role protection
  if (isLoggedIn) {
    if (isAdminPage && !isAuthPage && userRole !== "admin") {
      return Response.redirect(new URL(userRole === "delivery" ? "/delivery" : "/", nextUrl));
    }
    if (isDeliveryPage && userRole !== "delivery" && userRole !== "admin") {
      return Response.redirect(new URL("/", nextUrl));
    }
  }

  return;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
