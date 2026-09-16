"use client";

import { useActionState } from "react";

import { createSiteAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";

type RepoOption = {
  fullName: string;
};

type ProjectOption = {
  id: string;
  name: string;
};

export function ConnectSiteForm({
  repos,
  projects,
}: {
  repos: RepoOption[];
  projects: ProjectOption[];
}) {
  const [error, action, pending] = useActionState(createSiteAction, null);

  if (repos.length === 0 || projects.length === 0) {
    return null;
  }

  return (
    <form action={action} className="mb-4 flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">Repo</span>
        <select
          name="repoFullName"
          required
          className="h-8 min-w-48 rounded-md border bg-background px-2"
          defaultValue={repos[0].fullName}
        >
          {repos.map((repo) => (
            <option key={repo.fullName} value={repo.fullName}>
              {repo.fullName}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">Vercel project</span>
        <select
          name="hostProjectId"
          required
          className="h-8 min-w-48 rounded-md border bg-background px-2"
          defaultValue={projects[0].id}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        Connect site
      </Button>
      {error ? <p className="basis-full text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
