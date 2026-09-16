import { createPrivateKey } from "node:crypto";

import { SignJWT, importPKCS8 } from "jose";
import { App } from "octokit";

import { env } from "@/lib/env";

export const githubAppEnabled = Boolean(
  env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY && env.GITHUB_APP_SLUG,
);

export function githubAppInstallUrl() {
  if (!env.GITHUB_APP_SLUG) {
    throw new Error("GITHUB_APP_SLUG is not set.");
  }

  return `https://github.com/apps/${env.GITHUB_APP_SLUG.toLowerCase()}/installations/new`;
}

function privateKeyPem() {
  if (!env.GITHUB_APP_PRIVATE_KEY) {
    throw new Error("GITHUB_APP_PRIVATE_KEY is not set.");
  }

  const pem = env.GITHUB_APP_PRIVATE_KEY.replaceAll("\\n", "\n").trim();
  if (!pem.includes("BEGIN") || !pem.includes("END")) {
    throw new Error(
      "GITHUB_APP_PRIVATE_KEY must be the full PEM, wrapped in double quotes in .env.local.",
    );
  }

  return pem;
}

/** Octokit App client. Installation tokens are minted by Octokit, not stored. */
export function createGitHubApp() {
  if (!env.GITHUB_APP_ID) {
    throw new Error("GITHUB_APP_ID is not set.");
  }

  return new App({
    appId: env.GITHUB_APP_ID,
    privateKey: privateKeyPem(),
  });
}

/** App JWT authenticates as the GitHub App, not as a user. Lifetime ≤ 10 minutes. */
export async function createGitHubAppJwt() {
  if (!env.GITHUB_APP_ID) {
    throw new Error("GITHUB_APP_ID is not set.");
  }

  const pkcs8 = createPrivateKey(privateKeyPem())
    .export({ type: "pkcs8", format: "pem" })
    .toString();
  const key = await importPKCS8(pkcs8, "RS256");
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 9 * 60)
    .setIssuer(env.GITHUB_APP_ID)
    .sign(key);
}
