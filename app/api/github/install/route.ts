import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { githubAppEnabled, githubAppInstallUrl } from "@/lib/github/app";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.userId) {
    redirect("/");
  }

  if (!githubAppEnabled) {
    redirect("/dashboard");
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!membership) {
    redirect("/");
  }

  redirect(githubAppInstallUrl());
}
