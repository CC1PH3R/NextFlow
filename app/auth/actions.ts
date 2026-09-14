"use server";

import { githubAuthEnabled, signIn, signOut } from "@/lib/auth";

export async function signInWithGitHub() {
  if (!githubAuthEnabled) {
    return;
  }

  await signIn("github", { redirectTo: "/dashboard" });
}

export async function signInWithGitHubToSession() {
  if (!githubAuthEnabled) {
    return;
  }

  await signIn("github", { redirectTo: "/debug/session" });
}

export async function signOutSession() {
  await signOut({ redirectTo: "/dashboard" });
}

export async function signOutToSession() {
  await signOut({ redirectTo: "/debug/session" });
}
