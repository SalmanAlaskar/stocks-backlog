import { db } from "@/lib/db";
import { currentPriceHalalas, isMarketOpen, priceLimits, settlementDate } from "@/lib/market";
import { getAppConfig } from "@/lib/config";
import { getHoldings } from "@/lib/portfolio";
import { formatSar } from "@/lib/money";
import { notify } from "@/lib/notifications";
import type { OrderSide, OrderType, OrderValidity } from "@/generated/prisma/client";

export class OrderError extends Error {}

interface PlaceOrderInput {
  userId: string;
  stockId: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  validity: OrderValidity;
  limitPriceHalalas?: bigint;
  stopPriceHalalas?: bigint;
  goodTillDate?: Date;
}

function dayCloseUtc(now: Date): Date {
  // Market close is 15:00 Asia/Riyadh (UTC+3, no DST) = 12:00 UTC same day.
  const close = new Date(now);
  close.setUTCHours(12, 0, 0, 0);
  return close;
}

async function reservedSellQuantity(userId: string, stockId: string, excludeOrderId?: string): Promise<number> {
  const pending = await db.order.findMany({
    where: { userId, stockId, side: "SELL", status: "PENDING", id: excludeOrderId ? { not: excludeOrderId } : undefined },
  });
  return pending.reduce((sum, o) => sum + o.quantity, 0);
}

export async function placeOrder(input: PlaceOrderInput) {
  const { userId, stockId, side, type, quantity, validity } = input;
  if (quantity <= 0) throw new OrderError("Quantity must be greater than zero.");

  const [user, stock, wallet, config] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    db.stock.findUniqueOrThrow({ where: { id: stockId } }),
    db.wallet.findUniqueOrThrow({ where: { userId } }),
    getAppConfig(),
  ]);

  if (!user.nafathVerifiedAt || user.kycStatus !== "APPROVED") {
    throw new OrderError("Complete identity verification and KYC before trading.");
  }

  const now = new Date();
  const marketOpen = isMarketOpen(now, config.forceMarketOpen);

  if (type === "MARKET" && !marketOpen) {
    throw new OrderError(
      "Tadawul is open Sun-Thu, 10:00-15:00 AST. Market orders can only be submitted during trading hours."
    );
  }

  if (type === "LIMIT") {
    if (!input.limitPriceHalalas || input.limitPriceHalalas <= 0n) {
      throw new OrderError("A limit price is required.");
    }
    const { lower, upper } = priceLimits(stock.previousCloseHalalas);
    if (input.limitPriceHalalas < lower || input.limitPriceHalalas > upper) {
      throw new OrderError("Limit price is outside Tadawul's daily fluctuation limit (+/-10% of previous close).");
    }
  }

  if (type === "STOP" && (!input.stopPriceHalalas || input.stopPriceHalalas <= 0n)) {
    throw new OrderError("A stop trigger price is required.");
  }

  if (validity === "GOOD_TILL_DATE" && !input.goodTillDate) {
    throw new OrderError("Good-Till-Date orders require an expiry date.");
  }

  if (side === "SELL") {
    const holdings = await getHoldings(userId);
    const held = holdings.find((h) => h.stock.id === stockId)?.quantity ?? 0;
    const reserved = await reservedSellQuantity(userId, stockId);
    if (held - reserved < quantity) {
      throw new OrderError(`You only have ${held - reserved} available shares to sell.`);
    }
  }

  if (type === "MARKET") {
    const fillPrice = currentPriceHalalas(stock.ticker, stock.previousCloseHalalas, now);
    return executeFill({ userId, stockId, side, type, quantity, validity, fillPrice, now });
  }

  // LIMIT / STOP: reserve funds for buys, then create as PENDING.
  const referencePrice = (input.limitPriceHalalas ?? input.stopPriceHalalas)!;
  if (side === "BUY") {
    const cost = referencePrice * BigInt(quantity);
    const available = wallet.balanceHalalas - wallet.reservedHalalas;
    if (available < cost) {
      throw new OrderError("Insufficient Wallet balance to reserve funds for this order.");
    }
    await db.wallet.update({ where: { userId }, data: { reservedHalalas: { increment: cost } } });
  }

  const order = await db.order.create({
    data: {
      userId,
      stockId,
      side,
      type,
      validity,
      quantity,
      limitPriceHalalas: input.limitPriceHalalas ?? null,
      stopPriceHalalas: input.stopPriceHalalas ?? null,
      goodTillDate: input.goodTillDate ?? null,
      status: "PENDING",
    },
  });

  if (marketOpen) {
    await evaluateOrder(order.id);
  }

  return db.order.findUniqueOrThrow({ where: { id: order.id } });
}

async function executeFill(params: {
  userId: string;
  stockId: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  validity: OrderValidity;
  fillPrice: bigint;
  now: Date;
  orderId?: string;
  releaseReserved?: bigint;
}) {
  const { userId, stockId, side, quantity, fillPrice, now } = params;
  const proceeds = fillPrice * BigInt(quantity);
  const settleAt = settlementDate(now);

  const filledOrder = await db.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });

    if (side === "BUY") {
      if (params.releaseReserved) {
        await tx.wallet.update({
          where: { userId },
          data: { reservedHalalas: { decrement: params.releaseReserved }, balanceHalalas: { decrement: proceeds } },
        });
      } else {
        if (wallet.balanceHalalas < proceeds) throw new OrderError("Insufficient Wallet balance.");
        await tx.wallet.update({ where: { userId }, data: { balanceHalalas: { decrement: proceeds } } });
      }
      await tx.walletTransaction.create({
        data: { walletId: wallet.id, type: "TRADE_BUY", amountHalalas: -proceeds, description: `Buy ${quantity} shares` },
      });
    } else {
      await tx.wallet.update({ where: { userId }, data: { balanceHalalas: { increment: proceeds } } });
      await tx.walletTransaction.create({
        data: { walletId: wallet.id, type: "TRADE_SELL", amountHalalas: proceeds, description: `Sell ${quantity} shares` },
      });
    }

    if (params.orderId) {
      return tx.order.update({
        where: { id: params.orderId },
        data: { status: "FILLED", fillPriceHalalas: fillPrice, filledAt: now, settlementDate: settleAt },
      });
    }
    return tx.order.create({
      data: {
        userId,
        stockId,
        side,
        type: params.type,
        validity: params.validity,
        quantity,
        status: "FILLED",
        fillPriceHalalas: fillPrice,
        filledAt: now,
        settlementDate: settleAt,
      },
    });
  });

  const stock = await db.stock.findUnique({ where: { id: stockId } });
  if (stock) {
    await notify(
      userId,
      "ORDER_FILL",
      `${side === "BUY" ? "Buy" : "Sell"} order filled: ${stock.ticker}`,
      `${quantity} shares of ${stock.nameEn} at ${formatSar(fillPrice)}. Settles ${settleAt.toLocaleDateString("en-US")}.`
    );
  }

  return filledOrder;
}

/** Re-checks a single pending order against the current synthetic price and fills/expires it if due. */
export async function evaluateOrder(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { stock: true } });
  if (!order || order.status !== "PENDING") return;

  const config = await getAppConfig();
  const now = new Date();
  if (!isMarketOpen(now, config.forceMarketOpen)) return;

  if (order.validity === "DAY" && now >= dayCloseUtc(order.createdAt)) {
    await expireOrder(order.id);
    return;
  }
  if (order.validity === "GOOD_TILL_DATE" && order.goodTillDate && now > order.goodTillDate) {
    await expireOrder(order.id);
    return;
  }

  const price = currentPriceHalalas(order.stock.ticker, order.stock.previousCloseHalalas, now);
  let shouldFill = false;

  if (order.type === "LIMIT" && order.limitPriceHalalas) {
    shouldFill = order.side === "BUY" ? price <= order.limitPriceHalalas : price >= order.limitPriceHalalas;
  } else if (order.type === "STOP" && order.stopPriceHalalas) {
    shouldFill = order.side === "BUY" ? price >= order.stopPriceHalalas : price <= order.stopPriceHalalas;
  }

  if (!shouldFill) return;

  const reserved = order.side === "BUY" ? (order.limitPriceHalalas ?? order.stopPriceHalalas ?? 0n) * BigInt(order.quantity) : undefined;

  await executeFill({
    userId: order.userId,
    stockId: order.stockId,
    side: order.side,
    type: order.type,
    quantity: order.quantity,
    validity: order.validity,
    fillPrice: price,
    now,
    orderId: order.id,
    releaseReserved: reserved,
  });
}

async function expireOrder(orderId: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.side === "BUY" && (order.limitPriceHalalas || order.stopPriceHalalas)) {
    const reserved = (order.limitPriceHalalas ?? order.stopPriceHalalas ?? 0n) * BigInt(order.quantity);
    await db.wallet.update({ where: { userId: order.userId }, data: { reservedHalalas: { decrement: reserved } } });
  }
  await db.order.update({ where: { id: orderId }, data: { status: "EXPIRED" } });
}

export async function evaluatePendingOrders(userId: string) {
  const pending = await db.order.findMany({ where: { userId, status: "PENDING" } });
  for (const order of pending) {
    await evaluateOrder(order.id);
  }
}

export async function cancelOrder(userId: string, orderId: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.userId !== userId) throw new OrderError("Not your order.");
  if (order.status !== "PENDING") throw new OrderError("Only pending orders can be cancelled.");

  if (order.side === "BUY" && (order.limitPriceHalalas || order.stopPriceHalalas)) {
    const reserved = (order.limitPriceHalalas ?? order.stopPriceHalalas ?? 0n) * BigInt(order.quantity);
    await db.wallet.update({ where: { userId }, data: { reservedHalalas: { decrement: reserved } } });
  }
  await db.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
}
