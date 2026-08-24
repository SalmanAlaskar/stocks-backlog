"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

export async function signupAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const mobile = String(formData.get("mobile") ?? "").trim();
  const nationalId = String(formData.get("nationalId") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !mobile || !nationalId || !password) {
    return { error: "All fields are required." };
  }
  if (!/^05\d{8}$/.test(mobile)) {
    return { error: "Enter a valid Saudi mobile number (e.g. 05XXXXXXXX)." };
  }
  if (!/^[12]\d{9}$/.test(nationalId)) {
    return { error: "Enter a valid 10-digit National ID/Iqama number." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await db.user.findFirst({ where: { OR: [{ mobile }, { nationalId }] } });
  if (existing) {
    return { error: "An account with this mobile number or National ID/Iqama already exists." };
  }

  const { hash, salt } = hashPassword(password);
  const user = await db.user.create({
    data: {
      fullName,
      mobile,
      nationalId,
      passwordHash: hash,
      passwordSalt: salt,
      wallet: { create: { balanceHalalas: 0n, reservedHalalas: 0n } },
      notificationPrefs: { create: {} },
    },
  });

  await createSession(user.id);
  redirect("/verify-nafath");
}

export async function loginAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const mobile = String(formData.get("mobile") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const user = await db.user.findUnique({ where: { mobile } });
  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    return { error: "Invalid mobile number or password." };
  }

  if (user.twoFactorEnabled) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const session = await createSession(user.id, false);
    await db.session.update({ where: { id: session.id }, data: { twoFactorCode: code } });
    redirect("/login/2fa");
  }

  await createSession(user.id);
  if (!user.nafathVerifiedAt) redirect("/verify-nafath");
  if (user.kycStatus !== "APPROVED") redirect("/kyc");
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
