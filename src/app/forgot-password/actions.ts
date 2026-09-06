"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const CODE_TTL_MS = 15 * 60 * 1000;

export type RequestResetState = { error?: string } | undefined;

export async function requestPasswordResetAction(_prev: RequestResetState, formData: FormData): Promise<RequestResetState> {
  const mobile = String(formData.get("mobile") ?? "").trim();
  const user = await db.user.findUnique({ where: { mobile } });
  if (!user) {
    return { error: "No account found with that mobile number." };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.user.update({
    where: { id: user.id },
    data: { passwordResetCode: code, passwordResetExpiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });

  redirect(`/forgot-password/verify?mobile=${encodeURIComponent(mobile)}`);
}

export type ResetPasswordState = { error?: string } | undefined;

export async function resetPasswordAction(_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const mobile = String(formData.get("mobile") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const user = await db.user.findUnique({ where: { mobile } });
  if (!user || !user.passwordResetCode || user.passwordResetCode !== code) {
    return { error: "Incorrect code." };
  }
  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    return { error: "This code has expired. Request a new one." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation don't match." };
  }

  const { hash, salt } = hashPassword(newPassword);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hash, passwordSalt: salt, passwordResetCode: null, passwordResetExpiresAt: null },
  });

  redirect("/login?reset=1");
}
