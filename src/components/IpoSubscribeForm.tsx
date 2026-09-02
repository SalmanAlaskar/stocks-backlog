"use client";

import { useActionState } from "react";
import { subscribeToIpoAction } from "@/app/ipo/actions";

export default function IpoSubscribeForm({ ipoId, perInvestorCapSar }: { ipoId: string; perInvestorCapSar: number }) {
  const [state, formAction, pending] = useActionState(subscribeToIpoAction, undefined);

  if (state?.success) return <p className="text-sm text-emerald-400">{state.success}</p>;

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="ipoId" value={ipoId} />
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Subscription amount (SAR, max {perInvestorCapSar.toLocaleString()})</label>
        <input type="number" step="0.01" name="amount" required max={perInvestorCapSar} className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-40 rounded border border-zinc-700 px-2 py-1.5 text-sm" />
      </div>
      <button type="submit" disabled={pending} className="rounded bg-emerald-600 text-white px-3 py-1.5 text-sm hover:bg-emerald-500 disabled:opacity-50">
        {pending ? "Subscribing..." : "Subscribe"}
      </button>
      {state?.error && <p className="text-sm text-red-400 w-full">{state.error}</p>}
    </form>
  );
}
