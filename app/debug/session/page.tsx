import type { Session } from "next-auth";
import Link from "next/link";

import { debugSignIn, debugSignOut } from "@/app/debug/session/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, debugSignInEnabled } from "@/lib/auth";

function sessionPayload(session: Session) {
  return {
    userId: session.userId,
    tier: session.tier,
    expires: session.expires,
  };
}

export default async function DebugSessionPage() {
  const session = await auth();

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
          Debug readout for Auth.js. GitHub sign-in is the next milestone.
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
            <code>expires</code> is the Auth.js idle timeout. Tokens never
            belong here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
              {JSON.stringify(sessionPayload(session), null, 2)}
            </pre>
          ) : (
            <p className="text-sm">signed out</p>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          {session ? (
            <form action={debugSignOut}>
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          ) : debugSignInEnabled ? (
            <form action={debugSignIn}>
              <Button type="submit">Sign in (debug)</Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Debug sign-in is disabled in production.
            </p>
          )}
        </CardFooter>
      </Card>
      <Link
        href="/dashboard"
        className="text-sm font-medium underline-offset-4 hover:underline"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
