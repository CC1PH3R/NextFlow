import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  VERCEL_OAUTH_STATE_COOKIE,
  vercelInstallUrl,
  vercelOAuthEnabled,
} from "@/lib/hosts/vercel";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.userId) {
    redirect("/");
  }

  if (!vercelOAuthEnabled) {
    redirect("/dashboard");
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!membership) {
    redirect("/");
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(VERCEL_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
    secure: false,
  });

  redirect(vercelInstallUrl(state));
}
