import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
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
      <Link
        href="/dashboard"
        className="text-sm font-medium underline-offset-4 hover:underline"
      >
        Open dashboard
      </Link>
      <Link
        href="/debug/session"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Session debug
      </Link>
    </main>
  );
}
