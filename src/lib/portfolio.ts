import { db } from "@/lib/db";
import { currentPriceHalalas } from "@/lib/market";
import { fetchTadawulQuote } from "@/lib/tadawulData";
import type { Stock } from "@/generated/prisma/client";

export interface Holding {
  stock: Stock;
  quantity: number;
  avgCostHalalas: bigint;
  currentPriceHalalas: bigint;
  costBasisHalalas: bigint;
  marketValueHalalas: bigint;
  unrealizedPnlHalalas: bigint;
  realizedPnlHalalas: bigint;
}

export async function getHoldings(userId: string): Promise<Holding[]> {
  const orders = await db.order.findMany({
    where: { userId, status: "FILLED" },
    orderBy: { filledAt: "asc" },
    include: { stock: true },
  });

  const map = new Map<
    string,
    { stock: Stock; qty: number; avgCost: number; realizedPnl: number }
  >();

  for (const o of orders) {
    let entry = map.get(o.stockId);
    if (!entry) {
      entry = { stock: o.stock, qty: 0, avgCost: 0, realizedPnl: 0 };
      map.set(o.stockId, entry);
    }
    const fillPrice = Number(o.fillPriceHalalas ?? 0n);
    if (o.side === "BUY") {
      const newQty = entry.qty + o.quantity;
      entry.avgCost = newQty === 0 ? 0 : (entry.avgCost * entry.qty + fillPrice * o.quantity) / newQty;
      entry.qty = newQty;
    } else {
      entry.realizedPnl += (fillPrice - entry.avgCost) * o.quantity;
      entry.qty -= o.quantity;
    }
  }

  const now = new Date();
  const holdings: Holding[] = [];
  for (const entry of map.values()) {
    if (entry.qty <= 0) continue;
    const price = currentPriceHalalas(entry.stock.ticker, entry.stock.previousCloseHalalas, now, entry.stock.lastRealPriceHalalas, entry.stock.lastRealPriceAt);
    const costBasis = BigInt(Math.round(entry.avgCost * entry.qty));
    const marketValue = price * BigInt(entry.qty);
    holdings.push({
      stock: entry.stock,
      quantity: entry.qty,
      avgCostHalalas: BigInt(Math.round(entry.avgCost)),
      currentPriceHalalas: price,
      costBasisHalalas: costBasis,
      marketValueHalalas: marketValue,
      unrealizedPnlHalalas: marketValue - costBasis,
      realizedPnlHalalas: BigInt(Math.round(entry.realizedPnl)),
    });
  }
  return holdings;
}

const LIVE_REFRESH_MIN_AGE_MS = 60_000;

/** Like getHoldings, but first re-fetches quotes for held stocks whose cached price is older than a minute. Falls back to cached prices per stock if the source is unreachable. */
export async function getHoldingsWithLivePrices(userId: string): Promise<Holding[]> {
  const holdings = await getHoldings(userId);
  const nowMs = Date.now();
  const stale = holdings.filter((h) => !h.stock.lastRealPriceAt || nowMs - h.stock.lastRealPriceAt.getTime() > LIVE_REFRESH_MIN_AGE_MS);
  if (stale.length === 0) return holdings;

  const quotes = await Promise.all(stale.map(async (h) => ({ stockId: h.stock.id, quote: await fetchTadawulQuote(h.stock.ticker, "5d") })));
  const fresh = quotes.filter((q) => q.quote != null);
  if (fresh.length === 0) return holdings;

  await Promise.all(
    fresh.map((q) =>
      db.stock.update({
        where: { id: q.stockId },
        data: { lastRealPriceHalalas: q.quote!.currentPriceHalalas, lastRealPriceAt: q.quote!.asOf },
      }),
    ),
  );
  return getHoldings(userId);
}

export async function getSharesHeld(userId: string, stockId: string): Promise<number> {
  const holdings = await getHoldings(userId);
  return holdings.find((h) => h.stock.id === stockId)?.quantity ?? 0;
}
