import "server-only";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await auth();

  return {
    prisma,
    headers: opts.headers,
    session,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
