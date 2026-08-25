import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentPriceHalalas, isTradingDay, riyadhDateString } from "@/lib/market";

/**
 * Runs once daily shortly after Tadawul close (see vercel.json cron schedule).
 * Snapshots each stock's synthetic "live" price into previousCloseHalalas, so
 * the next trading day's +/-10% band and %-change anchor to a real rolling
 * close instead of the original seed value forever.
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

  for (const stock of stocks) {
    const closePrice = currentPriceHalalas(stock.ticker, stock.previousCloseHalalas, now);
    await db.stock.update({ where: { id: stock.id }, data: { previousCloseHalalas: closePrice } });
    updates.push({ ticker: stock.ticker, from: Number(stock.previousCloseHalalas) / 100, to: Number(closePrice) / 100 });
  }

  await db.appConfig.update({ where: { id: "singleton" }, data: { lastCloseRolloverDate: today } });

  return NextResponse.json({ ok: true, date: today, updated: updates.length, updates });
}
