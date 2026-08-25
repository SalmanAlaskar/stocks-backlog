const RIYADH_TZ = "Asia/Riyadh";
const TRADING_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu"];
const MARKET_OPEN_MINUTES = 10 * 60;
const MARKET_CLOSE_MINUTES = 15 * 60;

function getRiyadhParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: RIYADH_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")!.value;
  // Next.js/ICU can render midnight as "24" with hour12:false; normalize.
  const hour = Number(parts.find((p) => p.type === "hour")!.value) % 24;
  const minute = Number(parts.find((p) => p.type === "minute")!.value);
  return { weekday, hour, minute };
}

export function isTradingDay(date: Date): boolean {
  return TRADING_DAYS.includes(getRiyadhParts(date).weekday);
}

/** Riyadh-local calendar date as "YYYY-MM-DD", for once-per-day idempotency checks. */
export function riyadhDateString(date: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: RIYADH_TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(date);
}

export function isWithinTradingHours(date: Date): boolean {
  const { hour, minute } = getRiyadhParts(date);
  const minutesNow = hour * 60 + minute;
  return minutesNow >= MARKET_OPEN_MINUTES && minutesNow < MARKET_CLOSE_MINUTES;
}

export function isMarketOpen(date: Date, forceOpen: boolean): boolean {
  if (forceOpen) return true;
  return isTradingDay(date) && isWithinTradingHours(date);
}

/** Advances by `days` Tadawul trading days (skipping Fri/Sat), operating on UTC calendar days. */
export function addTradingDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (isTradingDay(result)) remaining--;
  }
  return result;
}

export function settlementDate(fillDate: Date): Date {
  return addTradingDays(fillDate, 2);
}

export function priceLimits(previousCloseHalalas: bigint) {
  const prev = Number(previousCloseHalalas);
  return {
    lower: BigInt(Math.round(prev * 0.9)),
    upper: BigInt(Math.round(prev * 1.1)),
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/**
 * Deterministic synthetic "live" price: same ticker + same minute always
 * produces the same price, so concurrent requests within a minute agree,
 * and it drifts smoothly minute-to-minute without a real market feed.
 * Bounded to Tadawul's +-10% daily fluctuation limit.
 */
export function currentPriceHalalas(ticker: string, previousCloseHalalas: bigint, now: Date): bigint {
  const minuteBucket = Math.floor(now.getTime() / 60000);
  const seedA = hashString(`${ticker}:${minuteBucket}`);
  const seedB = hashString(`${ticker}:${minuteBucket}:trend`);
  const pct = (seedA - 0.5) * 0.16 + (seedB - 0.5) * 0.04;
  const prev = Number(previousCloseHalalas);
  const raw = Math.max(1, Math.round(prev * (1 + pct)));
  const { lower, upper } = priceLimits(previousCloseHalalas);
  const clamped = Math.min(Number(upper), Math.max(Number(lower), raw));
  return BigInt(clamped);
}

export interface Candle {
  t: number;
  priceHalalas: bigint;
}

/** Deterministic synthetic daily history for chart rendering. */
export function dailyHistory(ticker: string, previousCloseHalalas: bigint, days: number, now: Date): Candle[] {
  const candles: Candle[] = [];
  let cursor = new Date(now);
  const points: Date[] = [];
  while (points.length < days) {
    if (isTradingDay(cursor)) points.unshift(new Date(cursor));
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  for (const day of points) {
    const dayBucket = Math.floor(day.getTime() / (24 * 60 * 60 * 1000));
    const seedA = hashString(`${ticker}:day:${dayBucket}`);
    const seedB = hashString(`${ticker}:day:${dayBucket}:trend`);
    const pct = (seedA - 0.5) * 0.16 + (seedB - 0.5) * 0.06;
    const prev = Number(previousCloseHalalas);
    const raw = Math.max(1, Math.round(prev * (1 + pct)));
    const { lower, upper } = priceLimits(previousCloseHalalas);
    const clamped = Math.min(Number(upper), Math.max(Number(lower), raw));
    candles.push({ t: day.getTime(), priceHalalas: BigInt(clamped) });
  }
  candles.push({ t: now.getTime(), priceHalalas: currentPriceHalalas(ticker, previousCloseHalalas, now) });
  return candles;
}
