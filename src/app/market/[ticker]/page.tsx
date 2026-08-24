import Link from "next/link";
import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentPriceHalalas, dailyHistory } from "@/lib/market";
import { formatSar, formatPercent } from "@/lib/money";
import Sparkline from "@/components/Sparkline";
import { addToWatchlistAction } from "@/app/watchlists/actions";
import { createPriceAlertAction, deletePriceAlertAction } from "@/app/alerts/actions";
import { summarizeNews } from "@/lib/ai";

const RANGES: Record<string, number> = { "1W": 7, "1M": 30, "1Y": 365, "5Y": 365 * 5 };

export default async function StockDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireVerifiedUser();
  const { ticker } = await params;
  const { range } = await searchParams;
  const rangeKey = range && RANGES[range] ? range : "1M";

  const stock = await db.stock.findUnique({ where: { ticker }, include: { newsItems: { orderBy: { publishedAt: "desc" }, take: 3 } } });
  if (!stock) notFound();

  const now = new Date();
  const price = currentPriceHalalas(stock.ticker, stock.previousCloseHalalas, now);
  const changePct = (Number(price - stock.previousCloseHalalas) / Number(stock.previousCloseHalalas)) * 100;
  const candles = dailyHistory(stock.ticker, stock.previousCloseHalalas, RANGES[rangeKey], now);
  const watchlists = await db.watchlist.findMany({ where: { userId: user.id } });
  const alerts = await db.priceAlert.findMany({ where: { userId: user.id, stockId: stock.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold">{stock.ticker} &middot; {stock.nameEn}</h1>
          <p className="text-sm text-zinc-400" dir="rtl">{stock.nameAr}</p>
          <p className="text-sm text-zinc-500">{stock.sector}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">{formatSar(price)}</div>
          <div className={changePct >= 0 ? "text-emerald-700" : "text-red-600"}>{formatPercent(changePct)} today</div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href={`/trade/${stock.ticker}?side=BUY`} className="rounded bg-emerald-700 text-white px-4 py-2 text-sm hover:bg-emerald-800">Buy</Link>
        <Link href={`/trade/${stock.ticker}?side=SELL`} className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100">Sell</Link>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <div className="flex gap-2 mb-3 text-xs">
          {Object.keys(RANGES).map((r) => (
            <Link
              key={r}
              href={`/market/${stock.ticker}?range=${r}`}
              className={`px-2 py-1 rounded ${rangeKey === r ? "bg-emerald-700 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
            >
              {r}
            </Link>
          ))}
        </div>
        <Sparkline candles={candles} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <h2 className="font-medium mb-3">Fundamentals</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-zinc-500">P/E ratio</dt><dd>{stock.peRatio ?? "N/A"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Market cap</dt><dd>{stock.marketCapHalalas ? formatSar(stock.marketCapHalalas) : "N/A"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Dividend yield</dt><dd>{stock.dividendYieldBps ? `${(stock.dividendYieldBps / 100).toFixed(2)}%` : "N/A"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">52-week range</dt><dd>{formatSar(stock.week52LowHalalas ?? 0n)} - {formatSar(stock.week52HighHalalas ?? 0n)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Shariah status</dt>
              <dd>{stock.shariahCompliant ? <span className="text-emerald-700">Compliant</span> : <span className="text-zinc-500">Non-compliant</span>}</dd>
            </div>
          </dl>
          <p className="text-xs text-zinc-400 mt-3">Illustrative screening for demo purposes; not a certified Shariah ruling.</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <h2 className="font-medium mb-3">Add to watchlist</h2>
          {watchlists.length === 0 ? (
            <p className="text-sm text-zinc-500">Create a <Link href="/watchlists" className="text-emerald-700">watchlist</Link> first.</p>
          ) : (
            <div className="space-y-2">
              {watchlists.map((wl) => (
                <form key={wl.id} action={addToWatchlistAction} className="flex items-center justify-between text-sm">
                  <input type="hidden" name="watchlistId" value={wl.id} />
                  <input type="hidden" name="stockId" value={stock.id} />
                  <span>{wl.name}</span>
                  <button type="submit" className="text-emerald-700 hover:underline">Add</button>
                </form>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <h2 className="font-medium mb-3">Price alerts</h2>
          <form action={createPriceAlertAction} className="flex flex-wrap items-end gap-2 mb-3">
            <input type="hidden" name="stockId" value={stock.id} />
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Direction</label>
              <select name="direction" className="rounded border border-zinc-300 px-2 py-1.5 text-sm">
                <option value="ABOVE">Above</option>
                <option value="BELOW">Below</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Target (SAR)</label>
              <input type="number" step="0.01" name="target" required className="w-28 rounded border border-zinc-300 px-2 py-1.5 text-sm" />
            </div>
            <button type="submit" className="rounded bg-emerald-700 text-white px-3 py-1.5 text-sm hover:bg-emerald-800">Set alert</button>
          </form>
          {alerts.length === 0 ? (
            <p className="text-sm text-zinc-500">No alerts set for this stock.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span>
                    {a.direction === "ABOVE" ? "Above" : "Below"} {formatSar(a.targetHalalas)}
                    {a.triggeredAt && <span className="text-emerald-700 ml-2">(triggered)</span>}
                  </span>
                  <form action={deletePriceAlertAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="text-xs text-zinc-500 hover:text-red-600">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <h2 className="font-medium mb-2">Recent news</h2>
          {stock.newsItems.length > 0 ? (
            <>
              <p className="text-xs text-zinc-400 mb-2">AI-style summary (rule-based demo, not a live model call):</p>
              <p className="text-sm text-zinc-700 mb-3">{summarizeNews(stock, stock.newsItems)}</p>
              <ul className="space-y-1 text-xs text-zinc-500">
                {stock.newsItems.map((n) => (
                  <li key={n.id} className="flex justify-between">
                    <span>{n.headline}</span>
                    <span className="shrink-0 ml-4">{n.source}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-zinc-500">No recent news for this stock.</p>
          )}
        </div>
      </div>
    </div>
  );
}
