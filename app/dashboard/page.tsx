import { ConnectSiteForm } from "@/components/connect-site-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireDevAccess } from "@/lib/auth/require-dev-access";
import { githubAppEnabled } from "@/lib/github/app";
import { vercelOAuthEnabled } from "@/lib/hosts/vercel";
import { caller } from "@/lib/trpc/server";

export default async function DashboardPage() {
  await requireDevAccess();

  const [
    health,
    membership,
    installations,
    repos,
    vercelConnection,
    vercelProjects,
    sites,
  ] = await Promise.all([
    caller.dev.health(),
    caller.dev.workspace.get(),
    caller.dev.github.installations.list(),
    caller.dev.github.listRepos(),
    caller.dev.hosts.vercel.connected(),
    caller.dev.hosts.vercel.listProjects(),
    caller.dev.sites.list(),
  ]);
  const vercel = {
    connected: vercelConnection.connected,
    projects: vercelProjects,
  };
  const connectedRepos = new Set(
    sites.map((site) => `${site.githubRepoOwner}/${site.githubRepoName}`.toLowerCase()),
  );
  const availableRepos = repos.filter(
    (repo) => !connectedRepos.has(repo.fullName.toLowerCase()),
  );

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
            <div className="space-y-4">
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
              {repos.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {repos.map((repo) => (
                    <li key={repo.id}>
                      {repo.fullName}
                      <span className="text-muted-foreground">
                        {repo.private ? " · private" : " · public"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This install cannot see any repositories yet.
                </p>
              )}
            </div>
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
          <CardTitle>Vercel</CardTitle>
          <CardDescription>
            Host status is the Vercel connection, not the GitHub login.
          </CardDescription>
          <CardAction>
            {vercelOAuthEnabled ? (
              <Button nativeButton={false} render={<a href="/api/vercel/connect" />}>
                {vercel.connected ? "Reconnect Vercel" : "Connect Vercel"}
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Connect Vercel
              </Button>
            )}
          </CardAction>
        </CardHeader>
        <CardContent>
          {vercel.connected ? (
            vercel.projects.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {vercel.projects.map((project) => (
                  <li key={project.id}>{project.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Connected, but this integration cannot see any projects yet.
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              {vercelOAuthEnabled
                ? "No Vercel connection yet."
                : "Add VERCEL_CLIENT_ID, VERCEL_CLIENT_SECRET, and VERCEL_INTEGRATION_SLUG to .env.local, then restart."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sites</CardTitle>
          <CardDescription>
            A site joins a GitHub repo the App can see to a Vercel project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectSiteForm repos={availableRepos} projects={vercel.projects} />
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
            <TableBody>
              {sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>{site.name}</TableCell>
                  <TableCell>{site.customDomain ?? "—"}</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Vercel</TableCell>
                  <TableCell>—</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
