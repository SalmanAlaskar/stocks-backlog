import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";

export default async function StatementsPage() {
  await requireVerifiedUser();

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Statements & Zakat certificate</h1>
        <p className="text-sm text-zinc-500">Saudi Arabia has no personal income tax; Zakat applies to eligible holdings instead.</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <h2 className="font-medium mb-1">Trade history</h2>
        <p className="text-sm text-zinc-500 mb-3">Export your full order history as CSV.</p>
        <a href="/statements/csv" className="inline-block rounded bg-emerald-700 text-white px-4 py-2 text-sm hover:bg-emerald-800">
          Download CSV
        </a>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <h2 className="font-medium mb-1">Zakat certificate</h2>
        <p className="text-sm text-zinc-500 mb-3">Generate a certificate showing your Zakat-applicable portfolio value as of today.</p>
        <Link href="/statements/zakat" className="inline-block rounded bg-emerald-700 text-white px-4 py-2 text-sm hover:bg-emerald-800">
          Generate certificate
        </Link>
      </div>
    </div>
  );
}
