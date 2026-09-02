import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatSar, formatPercent } from "@/lib/money";

export default async function AlRajhiPage() {
  const user = await requireVerifiedUser();

  const account = await db.rajhiFundAccount.findUnique({
    where: { userId: user.id },
    include: { holdings: true },
  });

  if (!account) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Al Rajhi Fund Portfolio</h1>
          <p className="text-sm text-zinc-400">Your Al Rajhi Capital mutual fund holdings.</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-sm text-zinc-400">
          You don&apos;t have an Al Rajhi fund portfolio yet. This is a separate fund-investment
          product from your self-directed <Link href="/portfolio" className="text-emerald-400">stock holdings</Link> and
          your <Link href="/abian" className="text-emerald-400">Abian</Link> portfolio.
        </div>
      </div>
    );
  }

  const todayGainPct = account.todayGainBps / 100;
  const gainTotal = account.totalGainHalalas;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Al Rajhi Fund Portfolio</h1>
        <p className="text-sm text-zinc-400">Your Al Rajhi Capital mutual fund holdings.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="text-xs text-zinc-400">Total value</div>
        <div className="text-3xl font-semibold">{formatSar(account.totalValueHalalas)}</div>
        <div className={`text-sm mt-1 ${account.todayGainHalalas < 0n ? "text-red-400" : "text-emerald-400"}`}>
          {formatPercent(todayGainPct)} &middot; {formatSar(account.todayGainHalalas)} today
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Market value</div>
          <div className="text-xl font-semibold">{formatSar(account.marketValueHalalas)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Total cash</div>
          <div className="text-xl font-semibold">{formatSar(account.totalCashHalalas)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Total gain</div>
          <div className={`text-xl font-semibold ${gainTotal < 0n ? "text-red-400" : "text-emerald-400"}`}>
            {formatSar(gainTotal)}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
        <div className="p-4 pb-0">
          <h2 className="font-medium">Fund holdings</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-400 border-b border-zinc-800">
              <th className="py-2 px-4 font-normal">Fund</th>
              <th className="py-2 px-4 font-normal text-right">Quantity</th>
              <th className="py-2 px-4 font-normal text-right">Last price</th>
              <th className="py-2 px-4 font-normal text-right">Avg cost</th>
              <th className="py-2 px-4 font-normal text-right">Market value</th>
              <th className="py-2 px-4 font-normal text-right">Gain</th>
            </tr>
          </thead>
          <tbody>
            {account.holdings.map((h) => (
              <tr key={h.id} className="border-b border-zinc-800 last:border-0">
                <td className="py-2 px-4">{h.nameEn}</td>
                <td className="py-2 px-4 text-right">{h.quantity.toLocaleString("en-US", { maximumFractionDigits: 3 })}</td>
                <td className="py-2 px-4 text-right">{formatSar(h.lastPriceHalalas)}</td>
                <td className="py-2 px-4 text-right">{formatSar(h.avgCostHalalas)}</td>
                <td className="py-2 px-4 text-right">{formatSar(h.marketValueHalalas)}</td>
                <td className={`py-2 px-4 text-right ${h.gainHalalas < 0n ? "text-red-400" : "text-emerald-400"}`}>
                  {formatSar(h.gainHalalas)} ({formatPercent(h.gainBps / 100)})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
