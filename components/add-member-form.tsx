"use client";

import { useActionState } from "react";

import { addMemberAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";

export function AddMemberForm() {
  const [error, action, pending] = useActionState(addMemberAction, null);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">GitHub username</span>
        <input
          name="githubUsername"
          required
          autoComplete="off"
          className="h-8 min-w-48 rounded-md border bg-background px-2"
          placeholder="octocat"
        />
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        Add member
      </Button>
      {error ? <p className="basis-full text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
