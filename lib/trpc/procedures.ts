import { initTRPC } from "@trpc/server";

import type { TRPCContext } from "@/lib/trpc/context";

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;
