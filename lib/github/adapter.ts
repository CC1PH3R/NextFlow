// GitHub adapter
import "server-only";

import { createGitHubAppJwt } from "@/lib/github/app";

export type GitHubInstallationAccount = {
  installationId: bigint;
  accountLogin: string;
  accountType: "User" | "Organization";
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
