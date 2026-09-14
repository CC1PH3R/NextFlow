import { createTRPCRouter, publicProcedure } from "@/lib/trpc/procedures";

const devRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ ok: true as const })),
});

export const appRouter = createTRPCRouter({
  dev: devRouter,
});

export type AppRouter = typeof appRouter;
