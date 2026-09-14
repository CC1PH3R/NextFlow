import { signInWithGitHub, signOutSession } from "@/app/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { auth, githubAuthEnabled } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const session = await auth();

  return (
    <div className="min-h-svh bg-background">
      <header className="flex h-14 items-center gap-3 px-6">
        <p className="font-heading text-sm font-medium">NextFlow</p>
        <Badge variant="secondary">Private</Badge>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          {session ? (
            <form action={signOutSession}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          ) : githubAuthEnabled ? (
            <form action={signInWithGitHub}>
              <Button type="submit" size="sm">
                Sign in with GitHub
              </Button>
            </form>
          ) : null}
        </div>
      </header>
      <Separator />
      <main className="mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
