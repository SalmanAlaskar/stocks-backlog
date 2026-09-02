"use client";

import { useActionState } from "react";
import { depositAction, withdrawAction } from "@/app/wallet/actions";

export function DepositForm() {
  const [state, formAction, pending] = useActionState(depositAction, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <label className="block text-sm font-medium" htmlFor="deposit-amount">Amount (SAR)</label>
      <input id="deposit-amount" name="amount" type="number" step="0.01" min="1" required className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-full rounded border border-zinc-700 px-3 py-2 text-sm" />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-400">{state.success}</p>}
      <button type="submit" disabled={pending} className="w-full rounded bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50">
        {pending ? "Processing..." : "Deposit via SARIE/mada"}
      </button>
    </form>
  );
}

export function WithdrawForm() {
  const [state, formAction, pending] = useActionState(withdrawAction, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <label className="block text-sm font-medium" htmlFor="withdraw-amount">Amount (SAR)</label>
      <input id="withdraw-amount" name="amount" type="number" step="0.01" min="1" required className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-full rounded border border-zinc-700 px-3 py-2 text-sm" />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-400">{state.success}</p>}
      <button type="submit" disabled={pending} className="w-full rounded border border-zinc-700 py-2 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50">
        {pending ? "Processing..." : "Withdraw to bank account"}
      </button>
    </form>
  );
}
