import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getGitHubAppInstallation } from "@/lib/github/adapter";
import { prisma } from "@/lib/prisma";

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

    const installationIdParam = new URL(request.url).searchParams.get(
      "installation_id",
    );
    if (!installationIdParam || !/^\d+$/.test(installationIdParam)) {
      redirect("/dashboard");
    }

    const installationId = BigInt(installationIdParam);
    const installation = await getGitHubAppInstallation(installationId);

    await prisma.gitHubInstallation.upsert({
      where: { installationId },
      create: {
        workspaceId: membership.workspaceId,
        installationId,
        accountLogin: installation.accountLogin,
        accountType: installation.accountType,
      },
      update: {
        accountLogin: installation.accountLogin,
        accountType: installation.accountType,
      },
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
      error instanceof Error ? error.message : "GitHub App setup failed.";
    return new Response(message, { status: 500 });
  }

  redirect("/dashboard");
}
