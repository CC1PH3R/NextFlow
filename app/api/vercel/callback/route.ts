import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  VERCEL_OAUTH_STATE_COOKIE,
  exchangeVercelCode,
  saveVercelConnection,
} from "@/lib/hosts/vercel";
import { prisma } from "@/lib/prisma";

function nonempty(value: string | null) {
  return value && value.length > 0 ? value : null;
}

function sameState(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      redirect("/");
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.userId },
      select: { workspaceId: true },
    });

    if (!membership) {
      redirect("/");
    }

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieStore = await cookies();
    const expected = cookieStore.get(VERCEL_OAUTH_STATE_COOKIE)?.value;
    cookieStore.delete(VERCEL_OAUTH_STATE_COOKIE);

    if (!code || !state || !expected || !sameState(state, expected)) {
      redirect("/dashboard");
    }

    const tokens = await exchangeVercelCode(code);
    const configurationId =
      tokens.configurationId ??
      nonempty(url.searchParams.get("configurationId"));
    const teamId = tokens.teamId ?? nonempty(url.searchParams.get("teamId"));

    await saveVercelConnection({
      workspaceId: membership.workspaceId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      teamId,
      configurationId,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Vercel connect failed.";
    return new Response(message, { status: 500 });
  }

  redirect("/dashboard");
}
