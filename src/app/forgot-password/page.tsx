"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "./actions";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined);

  return (
    <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h1 className="text-xl font-semibold mb-2">Forgot password</h1>
      <p className="text-sm text-zinc-400 mb-6">Enter your mobile number and we&apos;ll send a reset code.</p>
      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="mobile">Mobile number</label>
          <input id="mobile" name="mobile" placeholder="05XXXXXXXX" required className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-full rounded border border-zinc-700 px-3 py-2 text-sm" />
        </div>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Sending..." : "Send reset code"}
        </button>
      </form>
      <p className="text-sm text-zinc-400 mt-4">
        <Link href="/login" className="text-emerald-400">Back to log in</Link>
      </p>
    </div>
  );
}
