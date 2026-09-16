import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";
import Link from "next/link";

import { signInWithGitHub, signOutSession } from "@/app/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, githubAuthEnabled } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { caller } from "@/lib/trpc/server";

function sessionPayload(session: Session) {
  return {
    userId: session.userId,
    tier: session.tier,
    expires: session.expires,
  };
}

export default async function DebugSessionPage() {
  const session = await auth();
  const dbUser = session?.userId
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          githubId: true,
          githubUsername: true,
          tier: true,
        },
      })
    : null;
  let membership = null;
  if (session) {
    try {
      membership = await caller.dev.workspace.get();
    } catch (error) {
      if (
        !(error instanceof TRPCError) ||
        (error.code !== "UNAUTHORIZED" && error.code !== "FORBIDDEN")
      ) {
        throw error;
      }
    }
  }

  return (
    <main className="relative mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-6 p-8">
      <div className="absolute top-4 right-6">
        <ThemeToggle />
      </div>
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">
          Session
        </h1>
        <p className="text-sm text-muted-foreground">
          GitHub OAuth is identity only. The access token is discarded after
          profile + email are read.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Cookie
            <Badge variant={session ? "secondary" : "outline"}>
              {session ? "signed in" : "signed out"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Payload is <code>userId</code> and <code>tier</code> only.{" "}
            <code>expires</code> is the Auth.js idle timeout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
              {JSON.stringify(sessionPayload(session), null, 2)}
            </pre>
          ) : (
            <p className="text-sm">signed out</p>
          )}
          {session ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">users row</p>
              {dbUser ? (
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
                  {JSON.stringify(dbUser, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No matching row. Sign out and sign in with GitHub.
                </p>
              )}
            </div>
          ) : null}
          {session ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">workspace</p>
              {membership ? (
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
                  {JSON.stringify(membership, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Signed in, but not a workspace member.
                </p>
              )}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="gap-2">
          {session ? (
            <form action={signOutSession}>
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          ) : githubAuthEnabled ? (
            <form action={signInWithGitHub}>
              <Button type="submit">Sign in with GitHub</Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add <code>AUTH_GITHUB_ID</code> and <code>AUTH_GITHUB_SECRET</code>{" "}
              to <code>.env.local</code>, then restart <code>npm run dev</code>.
            </p>
          )}
        </CardFooter>
      </Card>
      <Link
        href="/"
        className="text-sm font-medium underline-offset-4 hover:underline"
      >
        Home
      </Link>
    </main>
  );
}
