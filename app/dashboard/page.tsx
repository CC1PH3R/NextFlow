import { ConnectSiteForm } from "@/components/connect-site-form";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireDevAccess } from "@/lib/auth/require-dev-access";
import { caller } from "@/lib/trpc/server";

export default async function DashboardPage() {
  await requireDevAccess();

  const [sites, installations, vercelConnection] = await Promise.all([
    caller.dev.sites.list(),
    caller.dev.github.installations.list(),
    caller.dev.hosts.vercel.connected(),
  ]);

  const githubReady = installations.length > 0;
  const vercelReady = vercelConnection.connected;

  let repos: Awaited<ReturnType<typeof caller.dev.github.listRepos>> = [];
  let projects: Awaited<ReturnType<typeof caller.dev.hosts.vercel.listProjects>> =
    [];
  let pickListError: string | null = null;

  if (githubReady && vercelReady) {
    try {
      [repos, projects] = await Promise.all([
        caller.dev.github.listRepos(),
        caller.dev.hosts.vercel.listProjects(),
      ]);
    } catch {
      pickListError = "Could not load GitHub repos or Vercel projects.";
    }
  }

  const connectedRepos = new Set(
    sites.map((site) => `${site.githubRepoOwner}/${site.githubRepoName}`.toLowerCase()),
  );
  const availableRepos = repos.filter(
    (repo) => !connectedRepos.has(repo.fullName.toLowerCase()),
  );
  const canConnect = availableRepos.length > 0 && projects.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">
          Sites
        </h1>
        <p className="text-sm text-muted-foreground">
          Production URL and status from Vercel. Refresh to update.
        </p>
      </div>

      {sites.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No sites yet.
          {!githubReady
            ? " Install the GitHub App from the header."
            : null}
          {githubReady && !vercelReady
            ? " Connect Vercel from the header."
            : null}
        </p>
      ) : (
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
                <TableCell>
                  {site.host.url ? (
                    <a
                      href={site.host.url}
                      className="underline-offset-4 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {site.customDomain ?? new URL(site.host.url).host}
                    </a>
                  ) : (
                    (site.customDomain ?? "—")
                  )}
                </TableCell>
                <TableCell>
                  {site.host.publishedAt
                    ? site.host.publishedAt.toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">Vercel</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <Badge
                      variant={
                        site.host.status === "error"
                          ? "destructive"
                          : site.host.status === "ready"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {site.host.status}
                    </Badge>
                    {site.host.error ? (
                      <span className="text-xs text-muted-foreground">
                        {site.host.error}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {pickListError ? (
        <p className="text-sm text-destructive">{pickListError}</p>
      ) : null}
      {canConnect ? (
        <ConnectSiteForm repos={availableRepos} projects={projects} />
      ) : null}
    </div>
  );
}
