/**
 * GitHub adapter.
 *
 * Identity = OAuth App. Access = GitHub App installation.
 * listAccessibleRepos uses an installation token Octokit mints per request.
 * That token is not stored.
 */

import "server-only";

import { createGitHubApp, createGitHubAppJwt } from "@/lib/github/app";

export type GitHubInstallationAccount = {
  installationId: bigint;
  accountLogin: string;
  accountType: "User" | "Organization";
};

export type GitHubAccessibleRepo = {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  ownerLogin: string;
  defaultBranch: string;
};

export async function getGitHubAppInstallation(
  installationId: bigint,
): Promise<GitHubInstallationAccount> {
  const jwt = await createGitHubAppJwt();
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "User-Agent": "NextFlow",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) {
    throw new Error("GitHub did not recognize this App installation.");
  }

  const body: unknown = await response.json();
  if (
    !body ||
    typeof body !== "object" ||
    !("account" in body) ||
    !body.account ||
    typeof body.account !== "object"
  ) {
    throw new Error("GitHub installation is missing an account.");
  }

  const account = body.account as { login?: unknown; type?: unknown };
  if (typeof account.login !== "string") {
    throw new Error("GitHub installation is missing account.login.");
  }

  if (account.type !== "User" && account.type !== "Organization") {
    throw new Error("GitHub installation has an unexpected account type.");
  }

  return {
    installationId,
    accountLogin: account.login,
    accountType: account.type,
  };
}

function repositoriesFromPage(data: unknown) {
  if (Array.isArray(data)) {
    return data;
  }

  if (
    data &&
    typeof data === "object" &&
    "repositories" in data &&
    Array.isArray(data.repositories)
  ) {
    return data.repositories;
  }

  return [];
}

export async function listAccessibleRepos(
  installationId: bigint,
): Promise<GitHubAccessibleRepo[]> {
  const octokit = await createGitHubApp().getInstallationOctokit(
    Number(installationId),
  );
  const repos: GitHubAccessibleRepo[] = [];
  let remainingLogged = false;

  for await (const response of octokit.paginate.iterator(
    "GET /installation/repositories",
    { per_page: 100 },
  )) {
    if (!remainingLogged) {
      console.info(
        "GitHub x-ratelimit-remaining",
        response.headers["x-ratelimit-remaining"],
      );
      remainingLogged = true;
    }

    for (const repository of repositoriesFromPage(response.data)) {
      if (
        !repository ||
        typeof repository !== "object" ||
        typeof repository.id !== "number" ||
        typeof repository.name !== "string" ||
        typeof repository.full_name !== "string" ||
        typeof repository.private !== "boolean" ||
        !repository.owner ||
        typeof repository.owner !== "object" ||
        typeof repository.owner.login !== "string"
      ) {
        continue;
      }

      repos.push({
        id: repository.id,
        name: repository.name,
        fullName: repository.full_name,
        private: repository.private,
        ownerLogin: repository.owner.login,
        defaultBranch:
          "default_branch" in repository &&
          typeof repository.default_branch === "string" &&
          repository.default_branch.length > 0
            ? repository.default_branch
            : "main",
      });
    }
  }

  return repos;
}
