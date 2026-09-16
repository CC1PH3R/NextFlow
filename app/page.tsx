import Link from "next/link";

import { signInWithGitHub, signOutSession } from "@/app/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { auth, githubAuthEnabled } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await auth();
  const membership = session?.userId
    ? await prisma.workspaceMember.findFirst({
        where: { userId: session.userId },
        select: { id: true },
      })
    : null;

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-3 p-8">
      <div className="absolute top-4 right-6">
        <ThemeToggle />
      </div>
      <h1 className="font-heading text-3xl font-medium tracking-tight">
        NextFlow
      </h1>
      <p className="text-muted-foreground">
        Dashboard for managing multiple Next.js sites
      </p>
      {membership ? (
        <Link
          href="/dashboard"
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          Open dashboard
        </Link>
      ) : session ? (
        <p className="max-w-md text-center text-sm text-muted-foreground">
          You&apos;re signed in, but not on the team yet. Ask the owner to add
          your GitHub username, then open the dashboard.
        </p>
      ) : githubAuthEnabled ? (
        <form action={signInWithGitHub}>
          <Button type="submit">Sign in with GitHub</Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Add <code>AUTH_GITHUB_ID</code> and <code>AUTH_GITHUB_SECRET</code> to{" "}
          <code>.env.local</code>, then restart <code>npm run dev</code>.
        </p>
      )}
      {session ? (
        <form action={signOutSession}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      ) : null}
      <Link
        href="/debug/session"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Session diagnostics
      </Link>
    </main>
  );
}
