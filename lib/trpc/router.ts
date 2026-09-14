import { bootstrapWorkspace } from "@/lib/auth/bootstrap-workspace";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/procedures";

const devRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ ok: true as const })),
  workspace: createTRPCRouter({
    get: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.session?.userId) {
        return null;
      }

      return bootstrapWorkspace(ctx.session.userId);
    }),
  }),
});

export const appRouter = createTRPCRouter({
  dev: devRouter,
});

export type AppRouter = typeof appRouter;
