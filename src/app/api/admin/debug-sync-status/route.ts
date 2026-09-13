import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const stocks = await db.stock.findMany({
    select: { ticker: true, lastRealPriceAt: true, lastRealPriceHalalas: true, previousCloseHalalas: true },
    orderBy: { ticker: "asc" },
  });
  const config = await db.appConfig.findUnique({ where: { id: "singleton" } });
  return NextResponse.json({
    lastCloseRolloverDate: config?.lastCloseRolloverDate,
    stocks: stocks.map((s) => ({
      ticker: s.ticker,
      lastRealPriceAt: s.lastRealPriceAt,
      lastRealPrice: s.lastRealPriceHalalas != null ? Number(s.lastRealPriceHalalas) / 100 : null,
      previousClose: Number(s.previousCloseHalalas) / 100,
    })),
  });
}
