import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const stocks = await db.stock.findMany({
    select: { ticker: true, previousCloseHalalas: true, lastRealPriceHalalas: true, lastRealPriceAt: true },
    orderBy: { ticker: "asc" },
  });
  return NextResponse.json(
    stocks.map((s) => ({
      ticker: s.ticker,
      previousClose: Number(s.previousCloseHalalas) / 100,
      lastRealPrice: s.lastRealPriceHalalas != null ? Number(s.lastRealPriceHalalas) / 100 : null,
      lastRealPriceAt: s.lastRealPriceAt,
    })),
  );
}
