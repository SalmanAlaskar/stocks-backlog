"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/app/forgot-password/actions";

export default function ResetPasswordForm({ mobile }: { mobile: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="mobile" value={mobile} />
      <input
        type="text"
        name="code"
        placeholder="6-digit code"
        required
        maxLength={6}
        className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-full rounded border border-zinc-700 px-3 py-2 text-sm"
      />
      <input
        type="password"
        name="newPassword"
        placeholder="New password (8+ characters)"
        required
        minLength={8}
        className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-full rounded border border-zinc-700 px-3 py-2 text-sm"
      />
      <input
        type="password"
        name="confirmPassword"
        placeholder="Confirm new password"
        required
        minLength={8}
        className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-full rounded border border-zinc-700 px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Resetting..." : "Reset password"}
      </button>
    </form>
  );
}
