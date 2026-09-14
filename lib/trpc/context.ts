import "server-only";

import { prisma } from "@/lib/prisma";

export async function createTRPCContext(opts: { headers: Headers }) {
  return {
    prisma,
    headers: opts.headers,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
