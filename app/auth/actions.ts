"use server";

import { githubAuthEnabled, signIn, signOut } from "@/lib/auth";

export async function signInWithGitHub() {
  if (!githubAuthEnabled) {
    return;
  }

  await signIn("github", { redirectTo: "/dashboard" });
}

export async function signOutSession() {
  await signOut({ redirectTo: "/" });
}

export { signInWithGitHub as signInWithGitHubToSession };
export { signOutSession as signOutToSession };
