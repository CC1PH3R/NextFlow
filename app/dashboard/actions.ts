"use server";

import { revalidatePath } from "next/cache";
import { TRPCError } from "@trpc/server";

import { caller } from "@/lib/trpc/server";

export async function createSiteAction(
  _previous: string | null,
  formData: FormData,
) {
  try {
    await caller.dev.sites.create({
      repoFullName: String(formData.get("repoFullName") ?? ""),
      hostProjectId: String(formData.get("hostProjectId") ?? ""),
    });
  } catch (error) {
    if (error instanceof TRPCError) {
      return error.message;
    }

    throw error;
  }

  revalidatePath("/dashboard");
  return null;
}

export async function addMemberAction(
  _previous: string | null,
  formData: FormData,
) {
  try {
    await caller.dev.workspace.addMember({
      githubUsername: String(formData.get("githubUsername") ?? "").trim(),
    });
  } catch (error) {
    if (error instanceof TRPCError) {
      return error.message;
    }

    throw error;
  }

  revalidatePath("/dashboard");
  return null;
}
