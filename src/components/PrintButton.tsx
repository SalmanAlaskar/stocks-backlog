"use client";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-500 mb-4">
      Print / Save as PDF
    </button>
  );
}
