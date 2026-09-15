import { createTRPCRouter, devProcedure, publicProcedure } from "@/lib/trpc/procedures";

const devRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ ok: true as const })),
  workspace: createTRPCRouter({
    get: devProcedure.query(({ ctx }) => ctx.membership),
  }),
  github: createTRPCRouter({
    installations: createTRPCRouter({
      list: devProcedure.query(async ({ ctx }) => {
        const rows = await ctx.prisma.gitHubInstallation.findMany({
          where: { workspaceId: ctx.membership.workspace.id },
          select: {
            id: true,
            installationId: true,
            accountLogin: true,
            accountType: true,
          },
          orderBy: { createdAt: "asc" },
        });

        return rows.map((row) => ({
          id: row.id,
          installationId: row.installationId.toString(),
          accountLogin: row.accountLogin,
          accountType: row.accountType,
        }));
      }),
    }),
  }),
});

export const appRouter = createTRPCRouter({
  dev: devRouter,
});

export type AppRouter = typeof appRouter;
