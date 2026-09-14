import "server-only";

import { prisma } from "@/lib/prisma";

const WORKSPACE_SLUG = "nextflow";
const WORKSPACE_NAME = "NextFlow";

export type WorkspaceMembership = {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  role: "owner" | "dev";
};

function toMembership(
  workspace: { id: string; name: string; slug: string },
  role: "owner" | "dev",
): WorkspaceMembership {
  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    role,
  };
}

export async function bootstrapWorkspace(
  userId: string,
): Promise<WorkspaceMembership | null> {
  const existingMembership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: {
      workspace: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (existingMembership) {
    return toMembership(existingMembership.workspace, existingMembership.role);
  }

  const existingWorkspace = await prisma.workspace.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (existingWorkspace) {
    return null;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: WORKSPACE_NAME,
          slug: WORKSPACE_SLUG,
          ownerId: userId,
        },
        select: { id: true, name: true, slug: true },
      });

      const member = await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: "owner",
        },
        select: { role: true },
      });

      return toMembership(workspace, member.role);
    });
  } catch {
    const racedMembership = await prisma.workspaceMember.findFirst({
      where: { userId },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (racedMembership) {
      return toMembership(racedMembership.workspace, racedMembership.role);
    }

    return null;
  }
}
