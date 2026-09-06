"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/(auth)/actions";

export default function LoginForm({ justReset }: { justReset: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h1 className="text-xl font-semibold mb-6">Log in</h1>
      {justReset && <p className="text-sm text-emerald-400 mb-4">Password updated — log in with your new password.</p>}
      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="mobile">Mobile number</label>
          <input id="mobile" name="mobile" placeholder="05XXXXXXXX" required className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-full rounded border border-zinc-700 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-full rounded border border-zinc-700 px-3 py-2 text-sm" />
        </div>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>
      <div className="flex items-center justify-between text-sm text-zinc-400 mt-4">
        <Link href="/forgot-password" className="text-emerald-400">Forgot password?</Link>
        <span>No account? <Link href="/signup" className="text-emerald-400">Sign up</Link></span>
      </div>
    </div>
  );
}
