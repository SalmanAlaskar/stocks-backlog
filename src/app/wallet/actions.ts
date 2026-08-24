"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/auth";
import { sarToHalalas } from "@/lib/money";

export type WalletFormState = { error?: string; success?: string } | undefined;

export async function depositAction(_prev: WalletFormState, formData: FormData): Promise<WalletFormState> {
  const user = await requireVerifiedUser();
  const amountSar = Number(formData.get("amount"));
  if (!amountSar || amountSar <= 0) return { error: "Enter a valid deposit amount." };

  const amount = sarToHalalas(amountSar);
  const wallet = await db.wallet.findUniqueOrThrow({ where: { userId: user.id } });
  await db.$transaction([
    db.wallet.update({ where: { userId: user.id }, data: { balanceHalalas: { increment: amount } } }),
    db.walletTransaction.create({
      data: { walletId: wallet.id, type: "DEPOSIT", amountHalalas: amount, description: "Bank transfer deposit (SARIE/mada, simulated)" },
    }),
  ]);
  revalidatePath("/wallet");
  return { success: `Deposited ${amountSar.toFixed(2)} SAR.` };
}

export async function withdrawAction(_prev: WalletFormState, formData: FormData): Promise<WalletFormState> {
  const user = await requireVerifiedUser();
  const amountSar = Number(formData.get("amount"));
  if (!amountSar || amountSar <= 0) return { error: "Enter a valid withdrawal amount." };

  const amount = sarToHalalas(amountSar);
  const wallet = await db.wallet.findUniqueOrThrow({ where: { userId: user.id } });
  const available = wallet.balanceHalalas - wallet.reservedHalalas;
  if (available < amount) return { error: "Insufficient available Wallet balance." };

  await db.$transaction([
    db.wallet.update({ where: { userId: user.id }, data: { balanceHalalas: { decrement: amount } } }),
    db.walletTransaction.create({
      data: { walletId: wallet.id, type: "WITHDRAWAL", amountHalalas: -amount, description: "Withdrawal to linked bank account (simulated)" },
    }),
  ]);
  revalidatePath("/wallet");
  return { success: `Withdrew ${amountSar.toFixed(2)} SAR.` };
}
