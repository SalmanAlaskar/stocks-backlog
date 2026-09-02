import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { getHoldings } from "@/lib/portfolio";
import { formatSar, formatPercent } from "@/lib/money";
import { analyzePortfolioRisk } from "@/lib/ai";

export default async function PortfolioPage() {
  const user = await requireVerifiedUser();
  const holdings = await getHoldings(user.id);

  const marketValue = holdings.reduce((s, h) => s + h.marketValueHalalas, 0n);
  const costBasis = holdings.reduce((s, h) => s + h.costBasisHalalas, 0n);
  const unrealized = marketValue - costBasis;
  const unrealizedPct = costBasis > 0n ? (Number(unrealized) / Number(costBasis)) * 100 : 0;

  const bySector = new Map<string, bigint>();
  let compliantValue = 0n;
  let nonCompliantValue = 0n;
  for (const h of holdings) {
    bySector.set(h.stock.sector, (bySector.get(h.stock.sector) ?? 0n) + h.marketValueHalalas);
    if (h.stock.shariahCompliant) compliantValue += h.marketValueHalalas;
    else nonCompliantValue += h.marketValueHalalas;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Portfolio</h1>
        <p className="text-sm text-zinc-400">Your TASI holdings, valued in SAR.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Market value</div>
          <div className="text-2xl font-semibold">{formatSar(marketValue)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Cost basis</div>
          <div className="text-2xl font-semibold">{formatSar(costBasis)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Unrealized gain/loss</div>
          <div className={`text-2xl font-semibold ${unrealized < 0n ? "text-red-400" : "text-emerald-400"}`}>{formatSar(unrealized)}</div>
          <div className="text-xs text-zinc-400">{formatPercent(unrealizedPct)}</div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h2 className="font-medium mb-3">Holdings</h2>
        {holdings.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No positions yet. <Link href="/market" className="text-emerald-400">Browse the market</Link>.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-400 border-b border-zinc-800">
                <th className="py-2 font-normal">Stock</th>
                <th className="py-2 font-normal text-right">Qty</th>
                <th className="py-2 font-normal text-right">Avg cost</th>
                <th className="py-2 font-normal text-right">Current price</th>
                <th className="py-2 font-normal text-right">Market value</th>
                <th className="py-2 font-normal text-right">Gain/loss</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const gain = h.unrealizedPnlHalalas;
                const gainPct = h.costBasisHalalas > 0n ? (Number(gain) / Number(h.costBasisHalalas)) * 100 : 0;
                return (
                  <tr key={h.stock.id} className="border-b border-zinc-800 last:border-0">
                    <td className="py-2">
                      <Link href={`/market/${h.stock.ticker}`} className="font-medium text-emerald-400">{h.stock.ticker}</Link>
                      <span className="text-zinc-400 ml-2">{h.stock.nameEn}</span>
                    </td>
                    <td className="py-2 text-right">{h.quantity}</td>
                    <td className="py-2 text-right">{formatSar(h.avgCostHalalas)}</td>
                    <td className="py-2 text-right">{formatSar(h.currentPriceHalalas)}</td>
                    <td className="py-2 text-right">{formatSar(h.marketValueHalalas)}</td>
                    <td className={`py-2 text-right ${gain < 0n ? "text-red-400" : "text-emerald-400"}`}>
                      {formatSar(gain)} ({formatPercent(gainPct)})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {holdings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-medium mb-3">By sector</h2>
            <ul className="space-y-2 text-sm">
              {[...bySector.entries()].map(([sector, value]) => (
                <li key={sector} className="flex justify-between">
                  <span className="text-zinc-300">{sector}</span>
                  <span>{formatSar(value)} ({((Number(value) / Number(marketValue)) * 100).toFixed(1)}%)</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-medium mb-3">Shariah compliance</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-zinc-300">Compliant</span>
                <span>{formatSar(compliantValue)} ({marketValue > 0n ? ((Number(compliantValue) / Number(marketValue)) * 100).toFixed(1) : "0.0"}%)</span>
              </li>
              <li className="flex justify-between">
                <span className="text-zinc-300">Non-compliant</span>
                <span>{formatSar(nonCompliantValue)} ({marketValue > 0n ? ((Number(nonCompliantValue) / Number(marketValue)) * 100).toFixed(1) : "0.0"}%)</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {holdings.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="font-medium mb-1">AI-style risk insights</h2>
          <p className="text-xs text-zinc-500 mb-3">Rule-based demo, not a live model call. Informational only — not financial advice.</p>
          <ul className="space-y-2 text-sm">
            {analyzePortfolioRisk(holdings).map((insight, i) => (
              <li key={i} className={`flex gap-2 ${insight.severity === "warning" ? "text-amber-400" : "text-zinc-300"}`}>
                <span>{insight.severity === "warning" ? "!" : "i"}</span>
                <span>{insight.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
