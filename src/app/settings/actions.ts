"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { requireVerifiedUser } from "@/lib/auth";
import { setForceMarketOpen } from "@/lib/config";
import { db } from "@/lib/db";

export async function toggleForceMarketOpenAction(formData: FormData) {
  await requireVerifiedUser();
  await setForceMarketOpen(formData.get("forceMarketOpen") === "on");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function startEnable2FAAction() {
  const user = await requireVerifiedUser();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.user.update({ where: { id: user.id }, data: { twoFactorSecret: code } });
  revalidatePath("/settings");
}

export type Confirm2FAState = { error?: string; backupCodes?: string[] } | undefined;

export async function confirm2FAAction(_prev: Confirm2FAState, formData: FormData): Promise<Confirm2FAState> {
  const user = await requireVerifiedUser();
  const code = String(formData.get("code") ?? "").trim();

  const fresh = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!fresh.twoFactorSecret || fresh.twoFactorSecret !== code) {
    return { error: "Incorrect code." };
  }

  const backupCodes = Array.from({ length: 8 }, () => randomBytes(4).toString("hex"));
  await db.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true, twoFactorSecret: null, twoFactorBackupCodes: backupCodes.join(",") },
  });
  revalidatePath("/settings");
  return { backupCodes };
}

export async function disable2FAAction() {
  const user = await requireVerifiedUser();
  await db.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: null } });
  revalidatePath("/settings");
}

export async function updateNotificationPrefsAction(formData: FormData) {
  const user = await requireVerifiedUser();
  await db.notificationPreference.upsert({
    where: { userId: user.id },
    update: {
      priceAlerts: formData.get("priceAlerts") === "on",
      orderFills: formData.get("orderFills") === "on",
      ipoResults: formData.get("ipoResults") === "on",
      news: formData.get("news") === "on",
    },
    create: {
      userId: user.id,
      priceAlerts: formData.get("priceAlerts") === "on",
      orderFills: formData.get("orderFills") === "on",
      ipoResults: formData.get("ipoResults") === "on",
      news: formData.get("news") === "on",
    },
  });
  revalidatePath("/settings");
}
