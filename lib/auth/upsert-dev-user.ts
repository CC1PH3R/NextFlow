import "server-only";

import { prisma } from "@/lib/prisma";

export async function upsertDevUser(input: {
  githubId: number;
  githubUsername: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}) {
  return prisma.user.upsert({
    where: { githubId: input.githubId },
    create: {
      githubId: input.githubId,
      githubUsername: input.githubUsername,
      email: input.email,
      name: input.name,
      avatarUrl: input.avatarUrl,
      tier: "dev",
    },
    update: {
      githubUsername: input.githubUsername,
      email: input.email,
      name: input.name,
      avatarUrl: input.avatarUrl,
    },
    select: {
      id: true,
      tier: true,
    },
  });
}
