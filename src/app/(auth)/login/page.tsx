"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/(auth)/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="max-w-md mx-auto bg-white border border-zinc-200 rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-6">Log in</h1>
      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="mobile">Mobile number</label>
          <input id="mobile" name="mobile" placeholder="05XXXXXXXX" required className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-emerald-700 text-white py-2 text-sm font-medium hover:bg-emerald-800 disabled:opacity-50"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="text-sm text-zinc-500 mt-4">
        No account yet? <Link href="/signup" className="text-emerald-700">Sign up</Link>
      </p>
    </div>
  );
}
