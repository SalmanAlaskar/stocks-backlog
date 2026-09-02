import Link from "next/link";
import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentPriceHalalas, dailyHistory, riyadhDateString, type Candle } from "@/lib/market";
import { fetchTadawulQuote } from "@/lib/tadawulData";
import { formatSar, formatPercent } from "@/lib/money";
import Sparkline from "@/components/Sparkline";
import DataSourceNote from "@/components/DataSourceNote";
import { addToWatchlistAction } from "@/app/watchlists/actions";
import { createPriceAlertAction, deletePriceAlertAction } from "@/app/alerts/actions";
import { summarizeNews } from "@/lib/ai";
import { computeIndicators } from "@/lib/indicators";

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

  const stock = await db.stock.findUnique({ where: { ticker }, include: { newsItems: { orderBy: { publishedAt: "desc" }, take: 6 } } });
  if (!stock) notFound();

  const now = new Date();
  const quote = await fetchTadawulQuote(stock.ticker, "5y");

  let price: bigint;
  let previousClose: bigint;
  let allCandles: Candle[];
  const isRealPrice = quote != null;

  if (quote) {
    price = quote.currentPriceHalalas;
    previousClose = quote.previousCloseHalalas;
    const lastIsToday = quote.candles.at(-1) != null && riyadhDateString(new Date(quote.candles.at(-1)!.t)) === riyadhDateString(now);
    allCandles = [...(lastIsToday ? quote.candles.slice(0, -1) : quote.candles), { t: now.getTime(), priceHalalas: quote.currentPriceHalalas }];
    // Opportunistically refresh the shared cache so other pages (list, portfolio, trade) benefit too.
    await db.stock.update({
      where: { id: stock.id },
      data: {
        previousCloseHalalas: quote.previousCloseHalalas,
        lastRealPriceHalalas: quote.currentPriceHalalas,
        lastRealPriceAt: quote.asOf,
        ...(quote.week52LowHalalas != null ? { week52LowHalalas: quote.week52LowHalalas } : {}),
        ...(quote.week52HighHalalas != null ? { week52HighHalalas: quote.week52HighHalalas } : {}),
      },
    });
  } else {
    price = currentPriceHalalas(stock.ticker, stock.previousCloseHalalas, now, stock.lastRealPriceHalalas, stock.lastRealPriceAt);
    previousClose = stock.previousCloseHalalas;
    allCandles = dailyHistory(stock.ticker, stock.previousCloseHalalas, Math.max(60, RANGES[rangeKey]), now);
  }

  const changePct = (Number(price - previousClose) / Number(previousClose)) * 100;
  const candles = allCandles.slice(-RANGES[rangeKey]);
  const indicatorCandles = allCandles.slice(-60);
  const indicators = computeIndicators(indicatorCandles);
  const watchlists = await db.watchlist.findMany({ where: { userId: user.id } });
  const alerts = await db.priceAlert.findMany({ where: { userId: user.id, stockId: stock.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Company overview</p>
          <h1 className="text-xl font-semibold">{stock.ticker} &middot; {stock.nameEn}</h1>
          <p className="text-sm text-zinc-500" dir="rtl">{stock.nameAr}</p>
          <p className="text-sm text-zinc-400">{stock.sector}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">{formatSar(price)}</div>
          <div className={changePct >= 0 ? "text-emerald-400" : "text-red-400"}>{formatPercent(changePct)} today</div>
          <div className="mt-1"><DataSourceNote isReal={isRealPrice} /></div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href={`/trade/${stock.ticker}?side=BUY`} className="rounded bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-500">Buy</Link>
        <Link href={`/trade/${stock.ticker}?side=SELL`} className="rounded border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800">Sell</Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex gap-2 mb-3 text-xs">
          {Object.keys(RANGES).map((r) => (
            <Link
              key={r}
              href={`/market/${stock.ticker}?range=${r}`}
              className={`px-2 py-1 rounded ${rangeKey === r ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
            >
              {r}
            </Link>
          ))}
        </div>
        <Sparkline candles={candles} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="font-medium mb-3">Fundamentals</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-zinc-400">P/E ratio</dt><dd>{stock.peRatio ?? "N/A"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-400">Market cap</dt><dd>{stock.marketCapHalalas ? formatSar(stock.marketCapHalalas) : "N/A"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-400">Dividend yield</dt><dd>{stock.dividendYieldBps ? `${(stock.dividendYieldBps / 100).toFixed(2)}%` : "N/A"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-400">52-week range</dt><dd>{formatSar(stock.week52LowHalalas ?? 0n)} - {formatSar(stock.week52HighHalalas ?? 0n)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-zinc-400">Shariah status</dt>
              <dd>{stock.shariahCompliant ? <span className="text-emerald-400">Compliant</span> : <span className="text-zinc-400">Non-compliant</span>}</dd>
            </div>
          </dl>
          <p className="text-xs text-zinc-500 mt-3">Illustrative screening for demo purposes; not a certified Shariah ruling.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="font-medium mb-3">Add to watchlist</h2>
          {watchlists.length === 0 ? (
            <p className="text-sm text-zinc-400">Create a <Link href="/watchlists" className="text-emerald-400">watchlist</Link> first.</p>
          ) : (
            <div className="space-y-2">
              {watchlists.map((wl) => (
                <form key={wl.id} action={addToWatchlistAction} className="flex items-center justify-between text-sm">
                  <input type="hidden" name="watchlistId" value={wl.id} />
                  <input type="hidden" name="stockId" value={stock.id} />
                  <span>{wl.name}</span>
                  <button type="submit" className="text-emerald-400 hover:underline">Add</button>
                </form>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h2 className="font-medium mb-1">Technical indicators</h2>
        <p className="text-xs text-zinc-500 mb-3">
          Descriptive statistics only — not a trading signal or recommendation. These describe where
          the price sits relative to its recent history; they do not suggest buying, selling, or holding.
        </p>
        <dl className="text-sm grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <dt className="text-zinc-400">20-day average</dt>
            <dd>{indicators.sma20Halalas ? formatSar(indicators.sma20Halalas) : "N/A (not enough history)"}</dd>
            {indicators.vsSma20Pct != null && (
              <dd className={indicators.vsSma20Pct >= 0 ? "text-emerald-400" : "text-red-400"}>
                Price is {formatPercent(indicators.vsSma20Pct)} vs. this average
              </dd>
            )}
          </div>
          <div>
            <dt className="text-zinc-400">50-day average</dt>
            <dd>{indicators.sma50Halalas ? formatSar(indicators.sma50Halalas) : "N/A (not enough history)"}</dd>
            {indicators.vsSma50Pct != null && (
              <dd className={indicators.vsSma50Pct >= 0 ? "text-emerald-400" : "text-red-400"}>
                Price is {formatPercent(indicators.vsSma50Pct)} vs. this average
              </dd>
            )}
          </div>
          <div>
            <dt className="text-zinc-400">60-day trend</dt>
            <dd className="capitalize">{indicators.trendLabel}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">60-day change</dt>
            <dd className={indicators.rangeChangePct >= 0 ? "text-emerald-400" : "text-red-400"}>{formatPercent(indicators.rangeChangePct)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="font-medium mb-3">Price alerts</h2>
          <form action={createPriceAlertAction} className="flex flex-wrap items-end gap-2 mb-3">
            <input type="hidden" name="stockId" value={stock.id} />
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Direction</label>
              <select name="direction" className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 rounded border border-zinc-700 px-2 py-1.5 text-sm">
                <option value="ABOVE">Above</option>
                <option value="BELOW">Below</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Target (SAR)</label>
              <input type="number" step="0.01" name="target" required className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-28 rounded border border-zinc-700 px-2 py-1.5 text-sm" />
            </div>
            <button type="submit" className="rounded bg-emerald-600 text-white px-3 py-1.5 text-sm hover:bg-emerald-500">Set alert</button>
          </form>
          {alerts.length === 0 ? (
            <p className="text-sm text-zinc-400">No alerts set for this stock.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span>
                    {a.direction === "ABOVE" ? "Above" : "Below"} {formatSar(a.targetHalalas)}
                    {a.triggeredAt && <span className="text-emerald-400 ml-2">(triggered)</span>}
                  </span>
                  <form action={deletePriceAlertAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="text-xs text-zinc-400 hover:text-red-400">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="font-medium mb-2">Daily news</h2>
          {stock.newsItems.length > 0 ? (
            <>
              <p className="text-xs text-zinc-500 mb-2">AI-style summary (rule-based demo, not a live model call):</p>
              <p className="text-sm text-zinc-200 mb-3">{summarizeNews(stock, stock.newsItems)}</p>
              <ul className="space-y-2 text-sm">
                {stock.newsItems.map((n) => (
                  <li key={n.id} className="flex justify-between gap-3">
                    <span>{n.headline}</span>
                    <span className="shrink-0 text-xs text-zinc-500 text-right">
                      {n.publishedAt.toLocaleDateString("en-US")}
                      <br />
                      {n.source}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-zinc-400">No recent news for this stock.</p>
          )}
        </div>
      </div>
    </div>
  );
}
