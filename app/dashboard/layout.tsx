import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <div className="min-h-svh bg-background">
      <header className="flex h-14 items-center gap-3 px-6">
        <p className="font-heading text-sm font-medium">NextFlow</p>
        <Badge variant="secondary">Private</Badge>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>
      <Separator />
      <main className="mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
