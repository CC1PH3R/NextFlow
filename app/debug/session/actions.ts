"use server";

import { debugSignInEnabled, signIn, signOut } from "@/lib/auth";

export async function debugSignIn() {
  if (!debugSignInEnabled) {
    return;
  }

  await signIn("dev-debug", { redirectTo: "/debug/session" });
}

export async function debugSignOut() {
  await signOut({ redirectTo: "/debug/session" });
}
