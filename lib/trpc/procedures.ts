import { TRPCError, initTRPC } from "@trpc/server";

import type { TRPCContext } from "@/lib/trpc/context";

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;

export const devProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!ctx.user || ctx.user.tier !== "dev" || !ctx.membership) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
      membership: ctx.membership,
    },
  });
});
