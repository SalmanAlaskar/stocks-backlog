"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { placeOrder, OrderError } from "@/lib/orders";
import { sarToHalalas } from "@/lib/money";

export interface PlaceOrderInput {
  ticker: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT" | "STOP";
  quantity: number;
  limitPriceSar?: number;
  stopPriceSar?: number;
  validity: "DAY" | "GOOD_TILL_DATE";
  goodTillDate?: string;
}

export async function submitOrderAction(input: PlaceOrderInput): Promise<{ error?: string; success?: string }> {
  const user = await requireVerifiedUser();
  const stock = await db.stock.findUnique({ where: { ticker: input.ticker } });
  if (!stock) return { error: "Stock not found." };

  try {
    await placeOrder({
      userId: user.id,
      stockId: stock.id,
      side: input.side,
      type: input.type,
      quantity: input.quantity,
      validity: input.validity,
      limitPriceHalalas: input.limitPriceSar ? sarToHalalas(input.limitPriceSar) : undefined,
      stopPriceHalalas: input.stopPriceSar ? sarToHalalas(input.stopPriceSar) : undefined,
      goodTillDate: input.goodTillDate ? new Date(input.goodTillDate) : undefined,
    });
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }

  revalidatePath("/orders");
  revalidatePath("/portfolio");
  revalidatePath("/wallet");
  revalidatePath(`/market/${input.ticker}`);
  return { success: "Order submitted." };
}
