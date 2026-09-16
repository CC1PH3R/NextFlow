import { signOutSession } from "@/app/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { requireDevAccess } from "@/lib/auth/require-dev-access";
import { githubAppEnabled } from "@/lib/github/app";
import { vercelOAuthEnabled } from "@/lib/hosts/vercel";
import { caller } from "@/lib/trpc/server";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  await requireDevAccess();

  const [membership, installations, vercel] = await Promise.all([
    caller.dev.workspace.get(),
    caller.dev.github.installations.list(),
    caller.dev.hosts.vercel.connected(),
  ]);

  const who =
    membership.user.githubUsername ?? membership.user.name ?? "dev";

  return (
    <div className="min-h-svh bg-background">
      <header className="flex h-14 items-center gap-3 px-6">
        <p className="font-heading text-sm font-medium">NextFlow</p>
        <Badge variant="outline">
          {who} · {membership.role}
        </Badge>
        <div className="ml-auto flex items-center gap-1">
          {githubAppEnabled && installations.length === 0 ? (
            <Button
              nativeButton={false}
              variant="ghost"
              size="sm"
              render={<a href="/api/github/install" />}
            >
              Install GitHub App
            </Button>
          ) : null}
          {vercelOAuthEnabled && !vercel.connected ? (
            <Button
              nativeButton={false}
              variant="ghost"
              size="sm"
              render={<a href="/api/vercel/connect" />}
            >
              Connect Vercel
            </Button>
          ) : null}
          <ThemeToggle />
          <form action={signOutSession}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <Separator />
      <main className="mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
