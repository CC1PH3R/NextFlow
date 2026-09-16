import { listAccessibleRepos } from "@/lib/github/adapter";
import { githubAppEnabled } from "@/lib/github/app";
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
          accountLogin: row.accpkcs8ountLogin,
          accountType: row.accountType,
        }));
      }),
    }),
    listRepos: devProcedure.query(async ({ ctx }) => {
      if (!githubAppEnabled) {
        return [];
      }

      const installations = await ctx.prisma.gitHubInstallation.findMany({
        where: { workspaceId: ctx.membership.workspace.id },
        select: { installationId: true },
        orderBy: { createdAt: "asc" },
      });

      const repos = [];
      for (const installation of installations) {
        repos.push(...(await listAccessibleRepos(installation.installationId)));
      }

      return repos;
    }),
  }),
});

export const appRouter = createTRPCRouter({
  dev: devRouter,
});

export type AppRouter = typeof appRouter;
