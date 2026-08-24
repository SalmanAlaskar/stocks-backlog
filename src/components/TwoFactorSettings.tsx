"use client";

import { useActionState, useState, useTransition } from "react";
import { startEnable2FAAction, confirm2FAAction, disable2FAAction } from "@/app/settings/actions";

export default function TwoFactorSettings({ enabled, pendingCode }: { enabled: boolean; pendingCode: string | null }) {
  const [started, setStarted] = useState(!!pendingCode);
  const [state, formAction, pending] = useActionState(confirm2FAAction, undefined);
  const [startPending, startTransition] = useTransition();
  const [disablePending, disableTransition] = useTransition();

  if (state?.backupCodes) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-emerald-700">2FA enabled. Save these backup codes — each can be used once if you lose access to your phone.</p>
        <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-zinc-50 border border-zinc-200 rounded p-3">
          {state.backupCodes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </div>
    );
  }

  if (enabled) {
    return (
      <div>
        <p className="text-sm text-emerald-700 mb-3">Two-factor authentication is enabled.</p>
        <button
          onClick={() => disableTransition(() => disable2FAAction())}
          disabled={disablePending}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-50"
        >
          {disablePending ? "Disabling..." : "Disable 2FA"}
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <button
        onClick={() => startTransition(async () => { await startEnable2FAAction(); setStarted(true); })}
        disabled={startPending}
        className="rounded bg-emerald-700 text-white px-3 py-1.5 text-sm hover:bg-emerald-800 disabled:opacity-50"
      >
        {startPending ? "Sending code..." : "Enable 2FA"}
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-500">
        Demo mode: real SMS delivery requires a telecom integration. Your code is{" "}
        <span className="font-mono font-semibold text-zinc-800">{pendingCode}</span>.
      </div>
      <input name="code" required placeholder="6-digit code" className="w-full rounded border border-zinc-300 px-3 py-2 text-sm tracking-widest" />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded bg-emerald-700 text-white px-3 py-1.5 text-sm hover:bg-emerald-800 disabled:opacity-50">
        {pending ? "Confirming..." : "Confirm & enable"}
      </button>
    </form>
  );
}
