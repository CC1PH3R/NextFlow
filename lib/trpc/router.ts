import { listAccessibleRepos } from "@/lib/github/adapter";
import { githubAppEnabled } from "@/lib/github/app";
import { getVercelAdapterForWorkspace } from "@/lib/hosts/vercel";
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
  hosts: createTRPCRouter({
    vercel: createTRPCRouter({
      connected: devProcedure.query(async ({ ctx }) => {
        const row = await ctx.prisma.hostConnection.findFirst({
          where: {
            workspaceId: ctx.membership.workspace.id,
            provider: "vercel",
          },
          select: { id: true },
        });

        return { connected: Boolean(row) };
      }),
      listProjects: devProcedure.query(async ({ ctx }) => {
        const adapter = await getVercelAdapterForWorkspace(
          ctx.membership.workspace.id,
        );

        if (!adapter) {
          return [];
        }

        return adapter.listProjects();
      }),
    }),
  }),
});

export const appRouter = createTRPCRouter({
  dev: devRouter,
});

export type AppRouter = typeof appRouter;
