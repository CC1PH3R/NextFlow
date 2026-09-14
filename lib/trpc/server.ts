import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { createTRPCContext } from "@/lib/trpc/context";
import { createCallerFactory } from "@/lib/trpc/procedures";
import { appRouter } from "@/lib/trpc/router";

const createContext = cache(async () => {
  return createTRPCContext({
    headers: await headers(),
  });
});

export const caller = createCallerFactory(appRouter)(createContext);
