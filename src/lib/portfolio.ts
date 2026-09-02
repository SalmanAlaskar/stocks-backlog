import { db } from "@/lib/db";
import { currentPriceHalalas } from "@/lib/market";
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

export async function getSharesHeld(userId: string, stockId: string): Promise<number> {
  const holdings = await getHoldings(userId);
  return holdings.find((h) => h.stock.id === stockId)?.quantity ?? 0;
}
