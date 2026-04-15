import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  providers: [
    Credentials({}), // Placeholder, will be replaced in auth.ts
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      if (nextUrl.pathname.endsWith(".json")) return true;
      
      const isAdminPage = nextUrl.pathname.startsWith("/admin/") || nextUrl.pathname === "/admin";
      const isAuthPage = nextUrl.pathname === "/admin/login";
 
      if (isAdminPage && !isAuthPage && !isLoggedIn) {
        return false; // Redirect to login
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.addresses = (user as any).addresses || [];
        token.phone = (user as any).phone;
        token.email = user.email || token.email;
      }
      // Support session updates
      if (trigger === "update" && session) {
        token.name = session.name || token.name;
        token.email = session.email || token.email;
        token.addresses = session.addresses || token.addresses;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.sub;
        (session.user as any).addresses = token.addresses || [];
        (session.user as any).phone = token.phone;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
} satisfies NextAuthConfig;
