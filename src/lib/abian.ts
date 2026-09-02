import type { Candle } from "@/lib/market";

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/**
 * Illustrative performance history for the Abian summary chart, ending
 * exactly at the account's real current market value. There's no real
 * historical time series backing this — it's a deterministic, gently
 * upward-trending synthetic path purely for visual context.
 */
export function abianHistory(seed: string, currentValueHalalas: bigint, days: number, now: Date): Candle[] {
  const candles: Candle[] = [];
  const current = Number(currentValueHalalas);
  for (let i = days; i >= 1; i--) {
    const dayBucket = Math.floor((now.getTime() - i * 86400000) / 86400000);
    const wobble = (hashString(`${seed}:${dayBucket}`) - 0.5) * 0.05;
    const trendBack = 1 - (i / days) * 0.13;
    const value = Math.max(1, Math.round(current * trendBack * (1 + wobble)));
    candles.push({ t: now.getTime() - i * 86400000, priceHalalas: BigInt(value) });
  }
  candles.push({ t: now.getTime(), priceHalalas: currentValueHalalas });
  return candles;
}
