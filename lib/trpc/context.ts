import "server-only";

import type { WorkspaceMembership } from "@/lib/auth/bootstrap-workspace";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await auth();

  if (!session?.userId) {
    return {
      prisma,
      headers: opts.headers,
      session: null,
      user: null,
      membership: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      tier: true,
      memberships: {
        take: 1,
        select: {
          role: true,
          workspace: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });

  const membershipRow = user?.memberships[0];
  const membership: WorkspaceMembership | null = membershipRow
    ? {
        workspace: membershipRow.workspace,
        role: membershipRow.role,
      }
    : null;

  return {
    prisma,
    headers: opts.headers,
    session,
    user: user ? { id: user.id, tier: user.tier } : null,
    membership,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
