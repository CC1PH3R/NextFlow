import "server-only";

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { listAccessibleRepos } from "@/lib/github/adapter";
import { githubAppEnabled } from "@/lib/github/app";
import { getVercelAdapterForWorkspace } from "@/lib/hosts/vercel";
import { mapHostStatus } from "@/lib/hosts/types";
import { createTRPCRouter, devProcedure, publicProcedure } from "@/lib/trpc/procedures";

const createSiteInput = z.object({
  repoFullName: z.string().regex(/^[^/\s]+\/[^/\s]+$/),
  hostProjectId: z.string().min(1),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function isUniqueConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

const devRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ ok: true as const })),
  workspace: createTRPCRouter({
    get: devProcedure.query(({ ctx }) => ({
      ...ctx.membership,
      user: {
        name: ctx.user.name,
        githubUsername: ctx.user.githubUsername,
      },
    })),
    listMembers: devProcedure.query(async ({ ctx }) => {
      if (ctx.membership.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the workspace owner can view members.",
        });
      }

      const rows = await ctx.prisma.workspaceMember.findMany({
        where: { workspaceId: ctx.membership.workspace.id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          user: {
            select: {
              name: true,
              githubUsername: true,
            },
          },
        },
      });

      return rows.map((row) => ({
        id: row.id,
        role: row.role,
        name: row.user.name,
        githubUsername: row.user.githubUsername,
      }));
    }),
    addMember: devProcedure
      .input(
        z.object({
          githubUsername: z
            .string()
            .min(1)
            .max(100)
            .regex(/^[A-Za-z0-9-]+$/),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.membership.role !== "owner") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the workspace owner can add members.",
          });
        }

        const user = await ctx.prisma.user.findFirst({
          where: {
            githubUsername: {
              equals: input.githubUsername,
              mode: "insensitive",
            },
          },
          select: { id: true, githubUsername: true },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "They need to sign in with GitHub once first.",
          });
        }

        try {
          await ctx.prisma.workspaceMember.create({
            data: {
              workspaceId: ctx.membership.workspace.id,
              userId: user.id,
              role: "dev",
            },
          });
        } catch (error) {
          if (isUniqueConflict(error)) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "That GitHub user is already a member.",
            });
          }

          throw error;
        }

        return { githubUsername: user.githubUsername };
      }),
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
  sites: createTRPCRouter({
    list: devProcedure.query(async ({ ctx }) => {
      const rows = await ctx.prisma.site.findMany({
        where: { workspaceId: ctx.membership.workspace.id },
        select: {
          id: true,
          name: true,
          slug: true,
          githubRepoOwner: true,
          githubRepoName: true,
          hostProvider: true,
          hostProjectId: true,
          customDomain: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const adapter = await getVercelAdapterForWorkspace(
        ctx.membership.workspace.id,
      );

      const hosts = await Promise.all(
        rows.map(async (site) => {
          if (!adapter) {
            return {
              url: null,
              status: "unknown" as const,
              publishedAt: null,
              error: "Vercel is not connected.",
            };
          }

          if (!site.hostProjectId) {
            return {
              url: null,
              status: "unknown" as const,
              publishedAt: null,
              error: "This site has no host project.",
            };
          }

          try {
            const production = await adapter.getLatestProduction(
              site.hostProjectId,
            );
            return {
              url: production.url,
              status: mapHostStatus(production.status),
              publishedAt: production.createdAt,
              error: null,
            };
          } catch (error) {
            return {
              url: null,
              status: "unknown" as const,
              publishedAt: null,
              error:
                error instanceof Error
                  ? error.message
                  : "Host status unavailable.",
            };
          }
        }),
      );

      return rows.map((site, index) => ({
        ...site,
        host: hosts[index],
      }));
    }),
    create: devProcedure.input(createSiteInput).mutation(async ({ ctx, input }) => {
      const workspaceId = ctx.membership.workspace.id;
      const [owner, repoName] = input.repoFullName.split("/");
      const wanted = input.repoFullName.toLowerCase();

      const installations = await ctx.prisma.gitHubInstallation.findMany({
        where: { workspaceId },
        select: { id: true, installationId: true },
      });

      let matched: {
        githubInstallationId: string;
        ownerLogin: string;
        name: string;
        defaultBranch: string;
      } | null = null;

      for (const installation of installations) {
        const repos = await listAccessibleRepos(installation.installationId);
        const repo = repos.find((item) => item.fullName.toLowerCase() === wanted);
        if (repo) {
          matched = {
            githubInstallationId: installation.id,
            ownerLogin: repo.ownerLogin,
            name: repo.name,
            defaultBranch: repo.defaultBranch,
          };
          break;
        }
      }

      if (!matched || !owner || !repoName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That repo is not on the GitHub App install.",
        });
      }

      const adapter = await getVercelAdapterForWorkspace(workspaceId);
      if (!adapter) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Connect Vercel before adding a site.",
        });
      }

      const projects = await adapter.listProjects();
      if (!projects.some((project) => project.id === input.hostProjectId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That Vercel project is not on this connection.",
        });
      }

      const slug = slugify(matched.name);
      if (!slug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not derive a slug from that repo name.",
        });
      }

      try {
        return await ctx.prisma.site.create({
          data: {
            workspaceId,
            name: matched.name,
            slug,
            githubInstallationId: matched.githubInstallationId,
            githubRepoOwner: matched.ownerLogin,
            githubRepoName: matched.name,
            githubDefaultBranch: matched.defaultBranch,
            hostProvider: "vercel",
            hostProjectId: input.hostProjectId,
          },
          select: { id: true, slug: true },
        });
      } catch (error) {
        if (isUniqueConflict(error)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That repo is already connected.",
          });
        }

        throw error;
      }
    }),
  }),
});

export const appRouter = createTRPCRouter({
  dev: devRouter,
});

export type AppRouter = typeof appRouter;
