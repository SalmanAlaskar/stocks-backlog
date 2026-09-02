"use client";

import { useActionState } from "react";
import { verifyTwoFactorAction } from "@/app/login/2fa/actions";

export default function TwoFactorForm() {
  const [state, formAction, pending] = useActionState(verifyTwoFactorAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="code">Verification code</label>
        <input id="code" name="code" required autoFocus className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-full rounded border border-zinc-700 px-3 py-2 text-sm tracking-widest" />
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50">
        {pending ? "Verifying..." : "Verify"}
      </button>
    </form>
  );
}
