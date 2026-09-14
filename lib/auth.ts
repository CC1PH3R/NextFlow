import NextAuth from "next-auth";
import GitHub, { type GitHubProfile } from "next-auth/providers/github";

import { upsertDevUser } from "@/lib/auth/upsert-dev-user";
import { bootstrapWorkspace } from "@/lib/auth/bootstrap-workspace";
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

export const githubAuthEnabled = Boolean(
  env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET,
);

function isGitHubProfile(profile: unknown): profile is GitHubProfile {
  if (!profile || typeof profile !== "object") {
    return false;
  }

  return (
    "id" in profile &&
    typeof profile.id === "number" &&
    "login" in profile &&
    typeof profile.login === "string"
  );
}

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
  providers: githubAuthEnabled
    ? [
        GitHub({
          clientId: env.AUTH_GITHUB_ID,
          clientSecret: env.AUTH_GITHUB_SECRET,
          authorization: {
            params: { scope: "read:user user:email" },
          },
        }),
      ]
    : [],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "github" && isGitHubProfile(profile)) {
        if (!profile.email) {
          throw new Error("GitHub did not return an email for this account.");
        }

        const dbUser = await upsertDevUser({
          githubId: profile.id,
          githubUsername: profile.login,
          email: profile.email,
          name: profile.name ?? profile.login,
          avatarUrl: profile.avatar_url,
        });

        await bootstrapWorkspace(dbUser.id);

        token.userId = dbUser.id;
        token.tier = dbUser.tier;
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
