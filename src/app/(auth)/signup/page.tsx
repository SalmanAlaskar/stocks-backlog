"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction } from "@/app/(auth)/actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, undefined);

  return (
    <div className="max-w-md mx-auto bg-white border border-zinc-200 rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-1">Create your account</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Opening a CMA-regulated brokerage account requires identity verification via Nafath after signup.
      </p>
      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="fullName">Full name</label>
          <input id="fullName" name="fullName" required className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="mobile">Saudi mobile number</label>
          <input id="mobile" name="mobile" placeholder="05XXXXXXXX" required className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="nationalId">National ID / Iqama number</label>
          <input id="nationalId" name="nationalId" placeholder="1XXXXXXXXX" required className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required minLength={8} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-emerald-700 text-white py-2 text-sm font-medium hover:bg-emerald-800 disabled:opacity-50"
        >
          {pending ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="text-sm text-zinc-500 mt-4">
        Already have an account? <Link href="/login" className="text-emerald-700">Log in</Link>
      </p>
    </div>
  );
}
