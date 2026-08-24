"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sarToHalalas } from "@/lib/money";

export async function createPriceAlertAction(formData: FormData) {
  const user = await requireVerifiedUser();
  const stockId = String(formData.get("stockId"));
  const direction = String(formData.get("direction")) === "BELOW" ? "BELOW" : "ABOVE";
  const targetSar = Number(formData.get("target"));
  if (!targetSar || targetSar <= 0) return;

  await db.priceAlert.create({
    data: { userId: user.id, stockId, targetHalalas: sarToHalalas(targetSar), direction },
  });

  const stock = await db.stock.findUnique({ where: { id: stockId } });
  if (stock) revalidatePath(`/market/${stock.ticker}`);
}

export async function deletePriceAlertAction(formData: FormData) {
  const user = await requireVerifiedUser();
  const id = String(formData.get("id"));
  const alert = await db.priceAlert.findFirst({ where: { id, userId: user.id }, include: { stock: true } });
  if (!alert) return;
  await db.priceAlert.delete({ where: { id } });
  revalidatePath(`/market/${alert.stock.ticker}`);
}
