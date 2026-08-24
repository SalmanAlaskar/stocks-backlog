"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sarToHalalas, formatSar } from "@/lib/money";
import { notify } from "@/lib/notifications";

export type IpoState = { error?: string; success?: string } | undefined;

export async function subscribeToIpoAction(_prev: IpoState, formData: FormData): Promise<IpoState> {
  const user = await requireVerifiedUser();
  const ipoId = String(formData.get("ipoId"));
  const amountSar = Number(formData.get("amount"));

  const ipo = await db.ipo.findUnique({ where: { id: ipoId } });
  if (!ipo) return { error: "IPO not found." };
  const now = new Date();
  if (ipo.status !== "OPEN" || now < ipo.subscriptionStart || now > ipo.subscriptionEnd) {
    return { error: "This IPO is not currently open for subscription." };
  }
  if (!amountSar || amountSar <= 0) return { error: "Enter a valid subscription amount." };

  const amount = sarToHalalas(amountSar);
  if (amount > ipo.perInvestorCapHalalas) {
    return { error: `Maximum subscription per investor is ${formatSar(ipo.perInvestorCapHalalas)}.` };
  }

  const existing = await db.ipoSubscription.findFirst({ where: { ipoId, userId: user.id } });
  if (existing) return { error: "You have already subscribed to this IPO." };

  const wallet = await db.wallet.findUniqueOrThrow({ where: { userId: user.id } });
  const available = wallet.balanceHalalas - wallet.reservedHalalas;
  if (available < amount) return { error: "Insufficient Wallet balance to reserve this subscription amount." };

  await db.$transaction([
    db.wallet.update({ where: { userId: user.id }, data: { reservedHalalas: { increment: amount } } }),
    db.walletTransaction.create({
      data: { walletId: wallet.id, type: "IPO_RESERVE", amountHalalas: -amount, description: `IPO subscription reserve: ${ipo.companyNameEn}` },
    }),
    db.ipoSubscription.create({ data: { ipoId, userId: user.id, reservedHalalas: amount } }),
  ]);

  revalidatePath("/ipo");
  revalidatePath("/wallet");
  return { success: `Subscribed with ${amountSar.toLocaleString()} SAR reserved.` };
}

/** Demo-only control to simulate the allocation results that normally arrive after the subscription window closes. */
export async function simulateAllocationAction(formData: FormData) {
  await requireVerifiedUser();
  const ipoId = String(formData.get("ipoId"));
  const ipo = await db.ipo.findUnique({ where: { id: ipoId }, include: { subscriptions: true } });
  if (!ipo || ipo.status !== "OPEN") return;

  for (const sub of ipo.subscriptions) {
    if (sub.allocatedHalalas != null) continue;
    // Deterministic pro-rata demo allocation: 60% of the requested amount allocated, 40% refunded.
    const allocated = (sub.reservedHalalas * 60n) / 100n;
    const shares = Number(allocated / ipo.offerPriceHalalas);
    const actualAllocated = BigInt(shares) * ipo.offerPriceHalalas;
    const actualRefund = sub.reservedHalalas - actualAllocated;

    const wallet = await db.wallet.findUniqueOrThrow({ where: { userId: sub.userId } });
    await db.$transaction([
      db.wallet.update({
        where: { userId: sub.userId },
        data: { reservedHalalas: { decrement: sub.reservedHalalas }, balanceHalalas: { decrement: actualAllocated } },
      }),
      db.walletTransaction.create({
        data: { walletId: wallet.id, type: "IPO_REFUND", amountHalalas: actualRefund, description: `IPO refund: ${ipo.companyNameEn}` },
      }),
      db.ipoSubscription.update({ where: { id: sub.id }, data: { allocatedHalalas: actualAllocated, refundedHalalas: actualRefund } }),
    ]);

    await notify(
      sub.userId,
      "IPO_RESULT",
      `${ipo.companyNameEn} IPO allocation results`,
      `You were allocated ${shares} shares (${formatSar(actualAllocated)}); ${formatSar(actualRefund)} refunded to your Wallet.`
    );
  }

  await db.ipo.update({ where: { id: ipoId }, data: { status: "ALLOCATED" } });
  revalidatePath("/ipo");
  revalidatePath("/wallet");
  revalidatePath("/notifications");
}
