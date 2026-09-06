import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [rajhi, abian] = await Promise.all([
    db.rajhiFundAccount.findFirst({ include: { holdings: true } }),
    db.abianAccount.findFirst({ include: { funds: true } }),
  ]);
  const toNum = (v: bigint) => Number(v) / 100;
  return NextResponse.json({
    rajhi: rajhi && {
      totalValue: toNum(rajhi.totalValueHalalas),
      marketValue: toNum(rajhi.marketValueHalalas),
      totalCash: toNum(rajhi.totalCashHalalas),
      totalGain: toNum(rajhi.totalGainHalalas),
      todayGain: toNum(rajhi.todayGainHalalas),
      todayGainBps: rajhi.todayGainBps,
      sumHoldingsMarketValue: rajhi.holdings.reduce((s, h) => s + toNum(h.marketValueHalalas), 0),
      sumHoldingsGain: rajhi.holdings.reduce((s, h) => s + toNum(h.gainHalalas), 0),
      holdings: rajhi.holdings.map((h) => ({ name: h.nameEn, qty: h.quantity, lastPrice: toNum(h.lastPriceHalalas), avgCost: toNum(h.avgCostHalalas), marketValue: toNum(h.marketValueHalalas), gain: toNum(h.gainHalalas), gainBps: h.gainBps })),
    },
    abian: abian && {
      marketValue: toNum(abian.marketValueHalalas),
      returnsSinceInception: toNum(abian.returnsSinceInceptionHalalas),
      currentReturn: toNum(abian.currentReturnHalalas),
      currentReturnBps: abian.currentReturnBps,
      savings: toNum(abian.savingsHalalas),
      sumFunds: abian.funds.reduce((s, f) => s + toNum(f.valueHalalas), 0),
      funds: abian.funds.map((f) => ({ name: f.nameEn, value: toNum(f.valueHalalas) })),
    },
  });
}
