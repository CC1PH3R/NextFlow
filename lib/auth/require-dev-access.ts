import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Dashboard access: session + dev tier + workspace membership. Cached per request. */
export const requireDevAccess = cache(async () => {
  const session = await auth();
  if (!session?.userId || session.tier !== "dev") {
    redirect("/");
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!membership) {
    redirect("/");
  }

  return session;
});
