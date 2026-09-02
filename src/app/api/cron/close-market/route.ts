import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isTradingDay, riyadhDateString } from "@/lib/market";
import { fetchTadawulQuote } from "@/lib/tadawulData";

/**
 * Runs once daily shortly after Tadawul close (see vercel.json cron schedule).
 * Fetches each stock's REAL closing price and current quote from Tadawul
 * (via Yahoo Finance, see src/lib/tadawulData.ts) and caches them on the
 * Stock row. A ticker whose fetch fails is left untouched (its last known
 * real price stays in place) rather than overwritten with a guess.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  if (!isTradingDay(now)) {
    return NextResponse.json({ ok: true, skipped: "not a trading day" });
  }

  const today = riyadhDateString(now);
  const config = await db.appConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  if (config.lastCloseRolloverDate === today) {
    return NextResponse.json({ ok: true, skipped: "already rolled over today" });
  }

  const stocks = await db.stock.findMany();
  const updates: { ticker: string; from: number; to: number }[] = [];
  const failed: string[] = [];

  for (const stock of stocks) {
    const quote = await fetchTadawulQuote(stock.ticker, "5d");
    if (!quote) {
      failed.push(stock.ticker);
      continue;
    }
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
    updates.push({ ticker: stock.ticker, from: Number(stock.previousCloseHalalas) / 100, to: Number(quote.previousCloseHalalas) / 100 });
  }

  await db.appConfig.update({ where: { id: "singleton" }, data: { lastCloseRolloverDate: today } });

  return NextResponse.json({ ok: true, date: today, updated: updates.length, updates, failed });
}
