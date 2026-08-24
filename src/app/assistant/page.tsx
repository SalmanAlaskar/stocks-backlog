"use client";

import { useActionState } from "react";
import { askAssistantAction } from "./actions";

const EXAMPLES = ["How much am I up this month?", "How many shares of SABIC do I hold?", "What's my Wallet balance?", "What's my biggest position?"];

export default function AssistantPage() {
  const [state, formAction, pending] = useActionState(askAssistantAction, { question: "", answer: "" });

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Portfolio assistant</h1>
        <p className="text-sm text-zinc-500">
          A simple rule-based Q&amp;A over your own data — not a live AI model call, and it won&apos;t give
          personalized financial advice.
        </p>
      </div>

      <form action={formAction} className="flex gap-2">
        <input
          name="question"
          placeholder="Ask about your portfolio..."
          required
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <button type="submit" disabled={pending} className="rounded bg-emerald-700 text-white px-4 py-2 text-sm hover:bg-emerald-800 disabled:opacity-50">
          {pending ? "..." : "Ask"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <span key={ex} className="text-xs px-2 py-1 rounded-full bg-zinc-100 text-zinc-500">{ex}</span>
        ))}
      </div>

      {state.answer && (
        <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-2">
          {state.question && <p className="text-sm text-zinc-500">You asked: &quot;{state.question}&quot;</p>}
          <p className="text-sm">{state.answer}</p>
        </div>
      )}
    </div>
  );
}
