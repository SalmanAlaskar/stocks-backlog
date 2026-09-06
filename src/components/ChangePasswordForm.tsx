"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/settings/actions";

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form action={formAction} className="space-y-2" key={state?.success ? "reset" : "form"}>
      <input
        type="password"
        name="currentPassword"
        placeholder="Current password"
        required
        className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-full rounded border border-zinc-700 px-3 py-1.5 text-sm"
      />
      <input
        type="password"
        name="newPassword"
        placeholder="New password (8+ characters)"
        required
        minLength={8}
        className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-full rounded border border-zinc-700 px-3 py-1.5 text-sm"
      />
      <input
        type="password"
        name="confirmPassword"
        placeholder="Confirm new password"
        required
        minLength={8}
        className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-full rounded border border-zinc-700 px-3 py-1.5 text-sm"
      />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-400">Password updated.</p>}
      <button type="submit" disabled={pending} className="rounded bg-emerald-600 text-white px-3 py-1.5 text-sm hover:bg-emerald-500 disabled:opacity-50">
        {pending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
