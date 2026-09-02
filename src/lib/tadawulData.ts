/**
 * Real Tadawul-listed price data, sourced from Yahoo Finance's public chart
 * endpoint using ".SR"-suffixed tickers. This is genuine market data (not
 * synthetic), but it is NOT an official/licensed Tadawul feed: it can be
 * delayed, is undocumented/unofficial, and could change or break without
 * notice. Every caller must treat a null return as "unavailable right now"
 * and fall back gracefully rather than assume freshness.
 */

export interface TadawulQuote {
  currentPriceHalalas: bigint;
  previousCloseHalalas: bigint;
  asOf: Date;
  week52LowHalalas?: bigint;
  week52HighHalalas?: bigint;
  /** Daily closes, oldest first. */
  candles: { t: number; priceHalalas: bigint }[];
}

const toHalalas = (n: number) => BigInt(Math.round(n * 100));

export async function fetchTadawulQuote(ticker: string, range: string = "1y"): Promise<TadawulQuote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.SR?range=${range}&interval=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    if (!result || meta?.regularMarketPrice == null) return null;

    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
    const candles = timestamps
      .map((t: number, i: number) => ({ t: t * 1000, close: closes[i] }))
      .filter((c: { t: number; close: number | null }): c is { t: number; close: number } => c.close != null)
      .map((c: { t: number; close: number }) => ({ t: c.t, priceHalalas: toHalalas(c.close) }));

    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? candles.at(-2)?.priceHalalas;
    if (prevClose == null) return null;

    return {
      currentPriceHalalas: toHalalas(meta.regularMarketPrice),
      previousCloseHalalas: typeof prevClose === "bigint" ? prevClose : toHalalas(prevClose),
      asOf: new Date(),
      week52LowHalalas: meta.fiftyTwoWeekLow != null ? toHalalas(meta.fiftyTwoWeekLow) : undefined,
      week52HighHalalas: meta.fiftyTwoWeekHigh != null ? toHalalas(meta.fiftyTwoWeekHigh) : undefined,
      candles,
    };
  } catch {
    return null;
  }
}
