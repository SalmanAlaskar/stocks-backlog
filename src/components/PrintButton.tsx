"use client";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded bg-emerald-700 text-white px-4 py-2 text-sm hover:bg-emerald-800 mb-4">
      Print / Save as PDF
    </button>
  );
}
