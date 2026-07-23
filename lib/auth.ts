import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

// Only these emails can access the dashboard
const ALLOWED_EMAILS = [
  "ashish.sf.123@gmail.com",
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub,
    Google,
    Resend({ from: "Personal Finance <onboarding@resend.dev>" }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/login?verify=1",
  },
  callbacks: {
    signIn({ user }) {
      // Block users not in the allowlist
      if (!user.email || !ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
        return false;
      }
      return true;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return isLoggedIn;
    },
  },
});
