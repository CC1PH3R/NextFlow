import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { githubAppEnabled } from "@/lib/github/app";
import { caller } from "@/lib/trpc/server";

export default async function DashboardPage() {
  const [health, membership, installations] = await Promise.all([
    caller.dev.health(),
    caller.dev.workspace.get(),
    caller.dev.github.installations.list(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-medium tracking-tight">
            Dashboard
          </h1>
          <Badge variant={health.ok ? "secondary" : "destructive"}>
            API {health.ok ? "ok" : "down"}
          </Badge>
          <Badge variant="outline">
            {membership.workspace.slug} · {membership.role}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Connected Next.js sites will show up here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>GitHub App</CardTitle>
          <CardDescription>
            Repo access is the App install, not the login you used to sign in.
          </CardDescription>
          <CardAction>
            {githubAppEnabled ? (
              <Button nativeButton={false} render={<a href="/api/github/install" />}>
                {installations.length > 0
                  ? "Add or update install"
                  : "Install GitHub App"}
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Install GitHub App
              </Button>
            )}
          </CardAction>
        </CardHeader>
        <CardContent>
          {installations.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {installations.map((installation) => (
                <li key={installation.id}>
                  {installation.accountLogin}{" "}
                  <span className="text-muted-foreground">
                    ({installation.accountType}) · {installation.installationId}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {githubAppEnabled
                ? "No installation yet. Install on one private repo."
                : "Add GITHUB_APP_ID, GITHUB_APP_SLUG, and GITHUB_APP_PRIVATE_KEY to .env.local, then restart."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sites</CardTitle>
          <CardDescription>
            No sites yet. Host status will appear after a repo is connected.
          </CardDescription>
          <CardAction>
            <Button variant="outline" disabled>
              Connect site
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Last publish</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody />
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
