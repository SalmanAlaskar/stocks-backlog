import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

/**
 * Temporary QA-only endpoint: creates (or reuses) a throwaway synthetic test
 * account with sample wallet/order/watchlist data and logs the caller in as
 * that account, purely to visually verify pages that require auth. Never
 * touches real user data. Remove after verification.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const mobile = "0599999999";
  let user = await db.user.findUnique({ where: { mobile } });

  if (!user) {
    const { hash, salt } = hashPassword("QaTest12345!");
    user = await db.user.create({
      data: {
        fullName: "QA Test",
        mobile,
        nationalId: "1999999999",
        passwordHash: hash,
        passwordSalt: salt,
        nafathVerifiedAt: new Date(),
        kycStatus: "APPROVED",
        wallet: { create: { balanceHalalas: 5_000_00n, reservedHalalas: 0n } },
        notificationPrefs: { create: {} },
      },
    });

    const wallet = await db.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    await db.walletTransaction.createMany({
      data: [
        { walletId: wallet.id, type: "DEPOSIT", amountHalalas: 10_000_00n, description: "SARIE transfer from ANB" },
        { walletId: wallet.id, type: "WITHDRAWAL", amountHalalas: -2_000_00n, description: "Withdrawal to ANB" },
        { walletId: wallet.id, type: "TRADE_BUY", amountHalalas: -3_000_00n, description: "Buy settlement" },
      ],
    });

    const stocks = await db.stock.findMany({ take: 3, orderBy: { ticker: "asc" } });
    for (const [i, stock] of stocks.entries()) {
      await db.order.create({
        data: {
          userId: user.id,
          stockId: stock.id,
          side: "BUY",
          type: "MARKET",
          validity: "DAY",
          quantity: 10 + i,
          status: "FILLED",
          fillPriceHalalas: stock.previousCloseHalalas,
          filledAt: new Date(),
          settlementDate: new Date(Date.now() + 2 * 86400000),
        },
      });
    }
    if (stocks[0]) {
      await db.order.create({
        data: {
          userId: user.id,
          stockId: stocks[0].id,
          side: "BUY",
          type: "LIMIT",
          validity: "DAY",
          quantity: 5,
          limitPriceHalalas: stocks[0].previousCloseHalalas,
          status: "PENDING",
        },
      });
    }

    const wl = await db.watchlist.create({ data: { userId: user.id, name: "QA Watchlist" } });
    for (const stock of stocks) {
      await db.watchlistItem.create({ data: { watchlistId: wl.id, stockId: stock.id } });
    }
  }

  await createSession(user.id);
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
