import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { env } from "@/lib/env";

declare module "next-auth" {
  interface Session {
    userId: string;
    tier: "dev" | "casual";
  }

  interface User {
    tier: "dev" | "casual";
  }
}

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

// Debug user for the session page
const debugUser = {
  id: "00000000-0000-0000-0000-000000000001",
  tier: "dev" as const,
};

export const debugSignInEnabled = process.env.NODE_ENV !== "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SEC,
  },
  pages: {
    signIn: "/debug/session",
  },
  providers: debugSignInEnabled
    ? [
        Credentials({
          id: "dev-debug",
          name: "Debug",
          credentials: {},
          authorize() {
            return debugUser;
          },
        }),
      ]
    : [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.tier = user.tier;
      }
      return token;
    },
    session({ session, token }) {
      session.userId = String(token.userId ?? "");
      session.tier = token.tier === "casual" ? "casual" : "dev";
      return session;
    },
  },
});
