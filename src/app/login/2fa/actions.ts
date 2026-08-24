"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getPendingTwoFactorUser, markSessionTwoFactorVerified } from "@/lib/auth";

export type TwoFactorState = { error?: string } | undefined;

export async function verifyTwoFactorAction(_prev: TwoFactorState, formData: FormData): Promise<TwoFactorState> {
  const user = await getPendingTwoFactorUser();
  if (!user) redirect("/login");

  const code = String(formData.get("code") ?? "").trim();
  const store = await cookies();
  const sessionId = store.get("session_id")?.value;
  const session = sessionId ? await db.session.findUnique({ where: { id: sessionId } }) : null;

  const backupCodes = (user.twoFactorBackupCodes ?? "").split(",").filter(Boolean);
  const isBackupCode = backupCodes.includes(code);
  const isPrimaryCode = !!session?.twoFactorCode && session.twoFactorCode === code;

  if (!isPrimaryCode && !isBackupCode) {
    return { error: "Incorrect code. Try again." };
  }

  if (isBackupCode) {
    const remaining = backupCodes.filter((c) => c !== code);
    await db.user.update({ where: { id: user.id }, data: { twoFactorBackupCodes: remaining.join(",") } });
  }

  await markSessionTwoFactorVerified();
  if (!user.nafathVerifiedAt) redirect("/verify-nafath");
  if (user.kycStatus !== "APPROVED") redirect("/kyc");
  redirect("/dashboard");
}
