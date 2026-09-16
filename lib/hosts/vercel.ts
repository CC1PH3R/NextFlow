import "server-only";

import { env } from "@/lib/env";
import { decrypt, encrypt, parseTokenEncryptionKey } from "@/lib/crypto/token";
import { prisma } from "@/lib/prisma";
import type { HostAdapter, HostProduction, HostProject } from "@/lib/hosts/types";

const VERCEL_REDIRECT_URI = "http://localhost:3000/api/vercel/callback";
const VERCEL_API = "https://api.vercel.com";

export const VERCEL_OAUTH_STATE_COOKIE = "nextflow-vercel-oauth-state";

export const vercelOAuthEnabled = Boolean(
  env.VERCEL_CLIENT_ID && env.VERCEL_CLIENT_SECRET && env.VERCEL_INTEGRATION_SLUG,
);

export function vercelInstallUrl(state: string) {
  if (!env.VERCEL_INTEGRATION_SLUG) {
    throw new Error("VERCEL_INTEGRATION_SLUG is not set.");
  }

  const url = new URL(
    `https://vercel.com/integrations/${env.VERCEL_INTEGRATION_SLUG}/new`,
  );
  url.searchParams.set("state", state);
  return url.toString();
}

function encryptionKey() {
  return parseTokenEncryptionKey(env.TOKEN_ENCRYPTION_KEY);
}

type VercelTokenResponse = {
  access_token?: unknown;
  refresh_token?: unknown;
  team_id?: unknown;
  installation_id?: unknown;
};

export async function exchangeVercelCode(code: string) {
  if (!env.VERCEL_CLIENT_ID || !env.VERCEL_CLIENT_SECRET) {
    throw new Error("Vercel OAuth is not configured.");
  }

  const body = new URLSearchParams({
    client_id: env.VERCEL_CLIENT_ID,
    client_secret: env.VERCEL_CLIENT_SECRET,
    code,
    redirect_uri: VERCEL_REDIRECT_URI,
  });

  const response = await fetch(`${VERCEL_API}/v2/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "NextFlow",
    },
    body,
  });

  if (!response.ok) {
    throw new Error("Vercel did not exchange the OAuth code.");
  }

  const payload: VercelTokenResponse = await response.json();
  if (typeof payload.access_token !== "string") {
    throw new Error("Vercel did not return an access token.");
  }

  return {
    accessToken: payload.access_token,
    refreshToken:
      typeof payload.refresh_token === "string" ? payload.refresh_token : null,
    teamId: typeof payload.team_id === "string" ? payload.team_id : null,
    configurationId:
      typeof payload.installation_id === "string"
        ? payload.installation_id
        : null,
  };
}

export async function saveVercelConnection(input: {
  workspaceId: string;
  accessToken: string;
  refreshToken: string | null;
  teamId: string | null;
  configurationId: string | null;
}) {
  const key = encryptionKey();
  const accessTokenEnc = encrypt(input.accessToken, key);
  const refreshTokenEnc = input.refreshToken
    ? encrypt(input.refreshToken, key)
    : null;
  const meta = {
    teamId: input.teamId,
    configurationId: input.configurationId,
  };

  await prisma.hostConnection.upsert({
    where: {
      workspaceId_provider: {
        workspaceId: input.workspaceId,
        provider: "vercel",
      },
    },
    create: {
      workspaceId: input.workspaceId,
      provider: "vercel",
      accessTokenEnc,
      refreshTokenEnc,
      meta,
    },
    update: {
      accessTokenEnc,
      refreshTokenEnc,
      meta,
    },
  });
}

export async function getVercelAdapterForWorkspace(workspaceId: string) {
  const row = await prisma.hostConnection.findFirst({
    where: { workspaceId, provider: "vercel" },
    select: { accessTokenEnc: true, meta: true },
  });

  if (!row) {
    return null;
  }

  const accessToken = decrypt(row.accessTokenEnc, encryptionKey());
  const teamId =
    row.meta &&
    typeof row.meta === "object" &&
    "teamId" in row.meta &&
    typeof row.meta.teamId === "string"
      ? row.meta.teamId
      : null;

  return createVercelAdapter({ accessToken, teamId });
}

export function createVercelAdapter(options: {
  accessToken: string;
  teamId: string | null;
}): HostAdapter {
  return {
    provider: "vercel",
    listProjects: () => listProjects(options),
    getProject: (id) => getProject(options, id),
    getLatestProduction: (id) => getLatestProduction(options, id),
  };
}

async function vercelGet(
  path: string,
  options: { accessToken: string; teamId: string | null },
  search: Record<string, string> = {},
) {
  const url = new URL(path, VERCEL_API);
  for (const [key, value] of Object.entries(search)) {
    url.searchParams.set(key, value);
  }
  if (options.teamId) {
    url.searchParams.set("teamId", options.teamId);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "User-Agent": "NextFlow",
    },
  });

  if (!response.ok) {
    throw new Error("Vercel API request failed.");
  }

  return response.json() as Promise<unknown>;
}

function readProject(value: unknown): HostProject | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (
    !("id" in value) ||
    !("name" in value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string"
  ) {
    return null;
  }

  return { id: value.id, name: value.name };
}

async function listProjects(options: {
  accessToken: string;
  teamId: string | null;
}): Promise<HostProject[]> {
  const projects: HostProject[] = [];
  let until: string | undefined;

  for (let page = 0; page < 10; page += 1) {
    const search: Record<string, string> = { limit: "100" };
    if (until) {
      search.until = until;
    }

    const body = await vercelGet("/v9/projects", options, search);
    if (!body || typeof body !== "object" || !("projects" in body)) {
      throw new Error("Vercel projects response was unexpected.");
    }

    if (!Array.isArray(body.projects)) {
      throw new Error("Vercel projects response was unexpected.");
    }

    for (const item of body.projects) {
      const project = readProject(item);
      if (project) {
        projects.push(project);
      }
    }

    const next =
      "pagination" in body &&
      body.pagination &&
      typeof body.pagination === "object" &&
      "next" in body.pagination
        ? body.pagination.next
        : null;

    if (next === null || next === undefined) {
      break;
    }

    until = String(next);
  }

  return projects;
}

async function getProject(
  options: { accessToken: string; teamId: string | null },
  id: string,
): Promise<HostProject> {
  const project = readProject(await vercelGet(`/v9/projects/${id}`, options));
  if (!project) {
    throw new Error("Vercel project was missing.");
  }

  return project;
}

async function getLatestProduction(
  options: { accessToken: string; teamId: string | null },
  projectId: string,
): Promise<HostProduction> {
  const body = await vercelGet("/v6/deployments", options, {
    projectId,
    target: "production",
    limit: "1",
  });

  if (!body || typeof body !== "object" || !("deployments" in body)) {
    throw new Error("Vercel deployments response was unexpected.");
  }

  if (!Array.isArray(body.deployments) || body.deployments.length === 0) {
    throw new Error("Vercel project has no production deployment.");
  }

  const deployment = body.deployments[0];
  if (!deployment || typeof deployment !== "object") {
    throw new Error("Vercel deployment was unexpected.");
  }

  const created =
    "created" in deployment && typeof deployment.created === "number"
      ? deployment.created
      : "createdAt" in deployment && typeof deployment.createdAt === "number"
        ? deployment.createdAt
        : null;

  if (typeof deployment.url !== "string" || created === null) {
    throw new Error("Vercel deployment was unexpected.");
  }

  const status =
    "readyState" in deployment && typeof deployment.readyState === "string"
      ? deployment.readyState
      : "state" in deployment && typeof deployment.state === "string"
        ? deployment.state
        : "unknown";

  return {
    url: deployment.url.startsWith("http")
      ? deployment.url
      : `https://${deployment.url}`,
    status,
    createdAt: new Date(created),
  };
}
