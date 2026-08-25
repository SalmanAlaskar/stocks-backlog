import type { Candle } from "@/lib/market";

/**
 * Purely descriptive technical stats — NOT trading signals or recommendations.
 * These describe where the current price sits relative to its recent average
 * and trend; they do not suggest any action.
 */
export interface TechnicalIndicators {
  sma20Halalas: bigint | null;
  sma50Halalas: bigint | null;
  vsSma20Pct: number | null;
  vsSma50Pct: number | null;
  trendLabel: "upward" | "downward" | "flat";
  rangeChangePct: number;
}

function sma(candles: Candle[], period: number): bigint | null {
  if (candles.length < period) return null;
  const window = candles.slice(-period);
  const sum = window.reduce((s, c) => s + c.priceHalalas, 0n);
  return sum / BigInt(period);
}

export function computeIndicators(candles: Candle[]): TechnicalIndicators {
  const current = candles[candles.length - 1]?.priceHalalas ?? 0n;
  const first = candles[0]?.priceHalalas ?? current;

  const sma20 = sma(candles, 20);
  const sma50 = sma(candles, 50);

  const pctVs = (base: bigint | null) =>
    base && base > 0n ? (Number(current - base) / Number(base)) * 100 : null;

  const rangeChangePct = first > 0n ? (Number(current - first) / Number(first)) * 100 : 0;
  const trendLabel: TechnicalIndicators["trendLabel"] =
    rangeChangePct > 1 ? "upward" : rangeChangePct < -1 ? "downward" : "flat";

  return {
    sma20Halalas: sma20,
    sma50Halalas: sma50,
    vsSma20Pct: pctVs(sma20),
    vsSma50Pct: pctVs(sma50),
    trendLabel,
    rangeChangePct,
  };
}
